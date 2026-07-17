// server/api/auth/sync-check.get.ts
import { eq, sql } from 'drizzle-orm'
import { users } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    return { mustRefresh: false }
  }

  try {
    // console.log({ session })
    const sId = session.user.sessionId || session.user.sessionId
    const uId = session.user.id

    if (sId) {
      // Intento A: Actualizar por el ID estricto de la Sesión activa (Recomendado)
      await db.execute(sql.raw(`
        UPDATE "user_sessions"
        SET "modified_at" = NOW()
        WHERE "id" = '${String(sId)}'
      `))
    }

    // console.log(`⏱️ [RELIC] Marca 'modifiedAt' actualizada con éxito para el usuario: ${uId}`)
  } catch (err: any) {
    console.warn('⚠️ No se pudo inyectar modifiedAt en Postgres:', err.message)
  }

  // 2. Obtener la marca de tiempo guardada en la cookie encriptada del navegador
  const sessionTime = new Date(session.user.sessionCreatedAt || session.loggedInAt)

  // 3. Consultar la última modificación real de perfiles SAP en Postgres
  const userList = await db
    .select({ authUpdatedAt: users.authUpdatedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  const dbUser = userList[0]
  if (!dbUser) return { mustRefresh: false }

  // 4. Comparar: si la base de datos es más reciente, le avisamos al cliente que re-hidrate
  const mustRefresh = dbUser.authUpdatedAt > sessionTime

  // Si requiere refrescarse, actualizamos también los datos de la cookie del servidor
  if (mustRefresh) {
    await actualizaSession(event)
  }

  return { mustRefresh }
})
