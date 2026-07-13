import { eq } from 'drizzle-orm'
import { userSessions } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  // Ignoramos rutas de autenticación básicas para evitar bucles infinitos
  if (event.path.startsWith('/api/auth/login') || event.path.startsWith('/auth/')) return

  const session = await getUserSession(event)

  if (session?.user?.sessionId) {
    // Buscamos si el ID de la cookie sigue activo en la tabla de Postgres
    const activeSession = await db
      .select()
      .from(userSessions)
      .where(eq(userSessions.id, session.user.sessionId))
      .limit(1)

    // 💥 Si no se encuentra en base de datos, significa que fue revocada remotamente
    if (activeSession.length === 0) {
      await clearUserSession(event) // Limpiamos la cookie
      throw createError({
        statusCode: 401,
        message: 'Tu sesión ha sido cerrada remotamente por el administrador o usuario.'
      })
    }
  }
})
