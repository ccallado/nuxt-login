import { eq } from 'drizzle-orm'
import { usersToRoles, masterRoles } from '#server/db/schema'
import type { SAPAuthorization } from '#shared/utils/sap-schema'
import type { H3Event } from 'h3'
// import { createLanguageService } from 'typescript'

export const actualizaSession = async (event: H3Event) => {
  // 1. Obtener la sesión actual del usuario de forma segura
  const session = await getUserSession(event)
  // console.log({ session: session })
  if (!session?.id) {
    throw createError({
      statusCode: 401,
      message: 'No hay ninguna sesión activa de usuario'
    })
  }
  // console.log('pase')

  if (!session?.id) {
    throw createError({
      statusCode: 401,
      message: 'No se puede consultar la matriz porque no hay una sesión de usuario válida activa.'
    })
  }

  // console.log({ session_user_id: session.user.id })
  const currentUser = session?.user
  if (!currentUser || !currentUser.id) {
    throw createError({
      statusCode: 401,
      message: 'No autorizado: No se encontró una sesión de usuario válida.'
    })
  }

  // 2. Obtener los Roles Maestros asignados al usuario y sus objetos internos
  const userRolesData = await db
    .select({ authorizations: masterRoles.authorizations })
    .from(usersToRoles)
    .innerJoin(masterRoles, eq(usersToRoles.roleName, masterRoles.name))
    .where(eq(usersToRoles.userId, currentUser.id))

  // console.log({ basededatos: userRolesData })

  // 3. Aplanar y fusionar los objetos de autorización (Evitar duplicados)
  const flattenedAuths: SAPAuthorization[] = []

  for (const row of userRolesData) {
    const authorizations = typeof row.authorizations === 'string'
      ? JSON.parse(row.authorizations)
      : (row.authorizations || [])

    for (const authObj of authorizations) {
      if (!authObj || !authObj.object) continue

      const existing = flattenedAuths.find(a => a.object === authObj.object)

      if (existing) {
        Object.keys(authObj.fields || {}).forEach((field) => {
          const combined = [...(existing.fields[field] || []), ...(authObj.fields[field] || [])]
          existing.fields[field] = [...new Set(combined)] // Eliminar duplicados
        })
      } else {
        flattenedAuths.push(JSON.parse(JSON.stringify(authObj)))
      }
    }
  }

  // Comprobación final en consola
  // console.log('RESULTADO FINAL PROCESADO:', flattenedAuths)

  // 7. Guardar el usuario con sus permisos ya resueltos en la sesión

  // console.log( { author: flattenedAuths })
  // await clearUserSession(event)
  // await setUserSession(event, {
  //   user: {
  //     // ...session.user,
  //     name: currentUser.name ?? (currentUser.email ?? 'usuario').split('@')[0],
  //     email: currentUser.email ?? '',
  //     nombre: currentUser.nombre ?? '',
  //     avatar: currentUser.avatar ?? '',
  //     bio: currentUser.bio ?? '',
  //     authorizations: flattenedAuths, // 👈 Ya expandidos y listos para usar
  //     id: currentUser.id ?? 0
  //   },
  //   loggedInAt: Date.now()
  // })

  await replaceUserSession(event, {
    ...session, // 1. Mantenemos intactas todas las propiedades raíz (loggedInAt, etc.)
    user: {
      ...session.user, // 2. Propagamos los datos fijos del usuario
      id: currentUser.id ?? 0,
      name: currentUser.name ?? (currentUser.email ?? 'usuario').split('@')[0],
      email: currentUser.email ?? '',
      nombre: currentUser.nombre ?? '',
      avatar: currentUser.avatar ?? '',
      bio: currentUser.bio ?? '',
      authorizations: flattenedAuths, // 3. Reemplazamos la matriz vieja por la limpia y fusionada
      // 4. 👑 CRUCIAL: Forzamos la actualización del reloj.
      // Esto le dice al middleware global en el próximo clic que este usuario
      // ya está al día con Postgres y detiene cualquier bucle de acumulación.
      sessionCreatedAt: new Date()
    }
  })
  console.log({ session })

  // const cookieRealEnviada = JSON.parse(JSON.stringify(flattenedAuths))
  // console.log({ autorización: cookieRealEnviada })
  // session = await getUserSession(event)
  // console.log({ flattenedAuths: flattenedAuths })
  // console.log({ autorización: session.user.authorizations })

  // 5. Cierre limpio para evitar que H3 deje la petición colgada o envíe cabeceras fantasma
  return {
    success: true
  }
}
