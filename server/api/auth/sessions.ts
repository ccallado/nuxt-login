import { eq, and } from 'drizzle-orm'
import { userSessions, users } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, message: 'No autorizado' })

  const method = getMethod(event)
  const currentUserId = session.user.id

  // 📋 GET: Listar todas las sesiones abiertas de este usuario
  if (method === 'GET') {
    return await db
      // .select()
      // .from(userSessions)
      // .where(eq(userSessions.userId, currentUserId))
      .select({
        // Campos de la Sesión
        sesionId: userSessions.id,
        dispositivo: userSessions.device,
        direccionIp: userSessions.ipAddress,
        sesionCreadaEn: userSessions.createdAt,

        // Campos del Usuario Relacionado
        usuarioId: users.id,
        usuarioName: users.name,
        usuarioEmail: users.email,
        usuarioNombreReal: users.nombre,
        usuarioAvatar: users.avatar,
        permisosActualizadosEn: users.authUpdatedAt
      })
      .from(userSessions)
      // Unimos las tablas comparando la Clave Foránea mediante eq()
      .innerJoin(users, eq(userSessions.userId, users.id))
  }

  // ❌ DELETE: Eliminar de la base de datos la sesión seleccionada
  if (method === 'DELETE') {
    const { targetSessionId } = await readBody(event)

    if (!targetSessionId) {
      throw createError({ statusCode: 400, message: 'Falta el ID de la sesión a cerrar' })
    }

    // console.log(targetSessionId)
    // Borramos el registro asegurando que pertenece al usuario logueado
    await db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.id, targetSessionId)
          // eq(userSessions.id, targetSessionId),
          // eq(userSessions.userId, currentUserId)
        )
      )

    return { success: true, message: 'Sesión cerrada correctamente' }
  }
})
