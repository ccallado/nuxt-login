// server/api/admin/assign-roles.post.ts
import { usersToRoles, users } from '#server/db/schema'
import { eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import type { PgTransaction } from 'drizzle-orm/pg-core'

const assignSchema = z.object({
  userId: z.number(),
  roles: z.array(z.string())
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, roles } = assignSchema.parse(body)

  // Transacción controlada para asegurar la consistencia atómica
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.transaction(async (tx: PgTransaction<any, any>) => {
    // 1. Borrar de forma limpia los roles anteriores de este usuario en la tabla intermedia
    await tx.delete(usersToRoles).where(eq(usersToRoles.userId, userId))

    // 2. Insertar las nuevas relaciones en la tabla intermedia si el array contiene elementos
    if (roles.length > 0) {
      const valuesToInsert = roles.map(roleName => ({
        userId,
        roleName
      }))
      await tx.insert(usersToRoles).values(valuesToInsert)
    }

    // 3. 👑 CORRECCIÓN DE LA FICHA DE USUARIO:
    // Retiramos la columna fantasma 'roles' que no existe en tu esquema de la tabla users.
    // Solo actualizamos su propio reloj de autorizaciones a la hora de Madrid.
    await tx.update(users)
      .set({
        authUpdatedAt: sql`NOW()`
      })
      .where(eq(users.id, userId))

    // 4. 👑 REFRESCO EN CASCADA CORREGIDO POR TABLA INTERMEDIA (Tu lógica solicitada):
    // Si el array contiene elementos, inyectamos una subconsulta SQL nativa infalible.
    // Busca en la tabla 'users_to_roles' a todos los usuarios vinculados a cualquiera de estos roles
    // y actualiza su 'auth_updated_at' en bloque dentro de la misma transacción.
    if (roles.length > 0) {
      try {
        // Formateamos los strings de forma segura para la sintaxis IN de Postgres: ('Z_ADMIN','Z_USER')
        const rolesFormatted = roles.map(r => `'${r}'`).join(',')

        await tx.execute(sql.raw(`
          UPDATE "users"
          SET "auth_updated_at" = NOW()
          WHERE "id" IN (
            SELECT "user_id"
            FROM "users_to_roles"
            WHERE "role_name" IN (${rolesFormatted})
          );
        `))

        console.log(`✨ [CASCADA OK] Reloj sync actualizado para todos los usuarios vinculados a: [${roles.join(', ')}]`)
      } catch (cascadeErr: any) {
        console.warn('⚠️ No se pudo propagar la cascada por tabla intermedia:', cascadeErr.message)
      }
    }
  })

  // Sincronizamos en caliente la cookie del administrador que realiza la acción
  await actualizaSession(event)

  return { success: true }
})
