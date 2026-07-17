import { eq, and, sql, lt } from 'drizzle-orm'
import { userSessions, users } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  // 1. CONTROL DE ACCESO
  const session = await getUserSession(event)
  if (!session?.user) throw createError({ statusCode: 401, message: 'No autorizado' })

  const method = getMethod(event)

  // 📋 MÉTODO GET: Listar dispositivos activos con Drizzle ORM estricto
  if (method === 'GET') {

    // 👑 2. RECOLECTOR DE BASURA REPARADO (Usa la columna nativa createdAt de tu esquema)
    try {
      await db
        .delete(userSessions)
        .where(
          lt(userSessions.modifiedAt, sql`NOW() - INTERVAL '5 minutes'`)
        )
      // console.log('🧹 [GARBAGE COLLECTOR] Sesiones inactivas de más de 30 min purgadas con éxito.')
    } catch (cleanErr: any) {
      console.warn('⚠️ No se pudo ejecutar la autolimpieza:', cleanErr.message)
    }

    // 👑 3. CONSULTA RELACIONAL ADAPTADA A SESSIONS-COMP.VUE
    // Mapeamos tus columnas reales de Drizzle hacia las llaves que espera tu frontend
    return await db
      .select({
        // Campos de la Sesión
        sesionId: userSessions.id,
        dispositivo: userSessions.device,       // userSessions.device ➔ dispositivo
        direccionIp: userSessions.ipAddress,     // userSessions.ipAddress ➔ direccionIp
        sesionCreadaEn: userSessions.createdAt,  // userSessions.createdAt ➔ sesionCreadaEn

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

  // ❌ MÉTODO DELETE: Cerrar sesión manualmente
  if (method === 'DELETE') {
    const { targetSessionId } = await readBody(event)

    if (!targetSessionId) {
      throw createError({ statusCode: 400, message: 'Falta el ID de la sesión' })
    }

    await db
      .delete(userSessions)
      .where(eq(userSessions.id, targetSessionId))

    return { success: true, message: 'Sesión cerrada correctamente' }
  }
})
