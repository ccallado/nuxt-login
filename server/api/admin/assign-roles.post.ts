// import { db } from '~/server/database/db'
import { usersToRoles } from '#server/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
// 1. Importamos el tipo nativo de transacción para Postgres
import type { PgTransaction } from 'drizzle-orm/pg-core'

const assignSchema = z.object({
  userId: z.number(),
  roles: z.array(z.string())
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { userId, roles } = assignSchema.parse(body)

  // Transacción para asegurar consistencia
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await db.transaction(async (tx: PgTransaction<any, any>) => {
    // 1. Borrar roles anteriores del usuario
    await tx.delete(usersToRoles).where(eq(usersToRoles.userId, userId))

    // 2. Insertar las nuevas relaciones si el array contiene elementos
    if (roles.length > 0) {
      const valuesToInsert = roles.map(roleName => ({
        userId,
        roleName
      }))
      await tx.insert(usersToRoles).values(valuesToInsert)
    }
  })

  await actualizaSession(event)

  return { success: true }
})
