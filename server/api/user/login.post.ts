import { loginSchema } from '#shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { actualizaSession } from '~~/server/utils/actualiza-session'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  const userList = await db.select().from(users).where(eq(users.email, email)).limit(1)

  const user = userList[0]

  if (user.length === 0) {
    throw createError({
      statusCode: 404,
      message: 'No existe el usuario'
    })
  }

  if (!user.emailVerified) {
    // Enviar correo electrónico de verificación
    const config = useRuntimeConfig()

    // Generar un token JWT para verificar el email
    const token = jwt.sign(
      { email: email },
      config.secretJwtKey,
      { expiresIn: '15m' }
    )
    // const token = generateJwt({
    //   userId: user[0].Id,
    //   secretKey: config.secretJwtKey,
    //   expiresIn: 60 * 60 * 24 // 1 día en segundos
    // })

    try {
      // URL de reset
      const url = getRequestURL(event)
      const resetUrl = `${url.origin}/auth/verifica-email?token=${token}`

      // Enviar el email de restablecimiento de contraseña
      // const { sendMail } = useNodeMailer()
      // sendMail({
      //   to: email,
      //   subject: 'Verificación de email web mia',
      //   html: `
      //   <div style="font-family: Arial, sans-serif; max-width 600px; margin: 0 auto;">
      //     <h2>Verificación de email</h2>
      //     <p>Te has dado de alta en la web mia. Pulsa el enlace para verificar el correo:</p>
      //     <div style="text-align: center; martin: 30px 0;">
      //       <a href=${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
      //       Verificar Email
      //       </a>
      //     </div>
      //     <p><strong>Este enlace expira en 15 minutos.</strong></p>
      //     <p>Si tu no lo has solicitado, por favor ignora este correo</p>
      //     <hr>
      //     <p style="color: #666; font-size: 12px;">
      //       Si el botón no funciona, copia y pega este enlace: ${resetUrl}
      //     </p>
      //   </div>`
      // })
      await $fetch('/api/send-mail-ethereal', {
        method: 'POST',
        body: {
          to: email,
          subject: 'Verificación de email web mia',
          html: `
            <div style="font-family: Arial, sans-serif; max-width 600px; margin: 0 auto;">
              <h2>Verificación de email</h2>
              <p>Te has dado de alta en la web mia. Pulsa el enlace para verificar el correo:</p>
              <div style="text-align: center; martin: 30px 0;">
                <a href=${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Verificar Email
                </a>
              </div>
              <p><strong>Este enlace expira en 15 minutos.</strong></p>
              <p>Si tu no lo has solicitado, por favor ignora este correo</p>
              <hr>
              <p style="color: #666; font-size: 12px;">
                Si el botón no funciona, copia y pega este enlace: ${resetUrl}
              </p>
            </div>`
        }
      })

      throw createError({
        statusCode: 401,
        message: 'Email no verificado, mandado correo para verificar'
      })
    } catch (error) {
      // 3. OPTIMIZACIÓN: Si el error capturado es el 401 que acabas de lanzar arriba, vuelve a lanzarlo sin mutarlo
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (error && (error as any).statusCode === 401) throw error

      throw createError({
        statusCode: 500, // Cambiado a 500 porque el fallo real aquí es del servicio de correo
        message: 'Error al enviar el correo de verificación'
      })
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password'
    })
  }

  // 7. Guardar el usuario con sus permisos ya resueltos en la sesión
  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name || email.split('@')[0],
      email: user.email,
      nombre: user.nombre,
      avatar: user.avatar,
      bio: user.bio,
      role: user.role,
      authorizations: [] // 👈 Ya expandidos y listos para usar
    },
    loggedInAt: Date.now()
  })

  // console.log({ antes: event })
  await actualizaSession(event)
  // // 1. Obtener los Roles Maestros asignados al usuario y sus objetos internos
  // const userRolesData = await db
  //   .select({ authorizations: masterRoles.authorizations })
  //   .from(usersToRoles)
  //   .innerJoin(masterRoles, eq(usersToRoles.roleName, masterRoles.name))
  //   .where(eq(usersToRoles.userId, user.id))

  // console.log({ basededatos: userRolesData })
  // // 2. Aplanar y fusionar los objetos de autorización (Evitar duplicados)
  // const flattenedAuths: SAPAuthorization[] = []

  // for (const row of userRolesData) {
  //   // CORRECCIÓN CLAVE: Si es un string, lo parseamos a JSON. Si ya es objeto, lo usamos directamente.
  //   const authorizations = typeof row.authorizations === 'string'
  //     ? JSON.parse(row.authorizations)
  //     : (row.authorizations || [])

  //   // Ahora 'authorizations' es un array real y podemos iterar sobre sus objetos correctamente
  //   for (const authObj of authorizations) {
  //     if (!authObj || !authObj.object) continue

  //     const existing = flattenedAuths.find(a => a.object === authObj.object)

  //     if (existing) {
  //       // Si el objeto ya existe, combinamos los permisos (Regla de acumulación de SAP)
  //       Object.keys(authObj.fields || {}).forEach(field => {
  //         const combined = [...(existing.fields[field] || []), ...(authObj.fields[field] || [])]
  //         existing.fields[field] = [...new Set(combined)] // Eliminar duplicados
  //       })
  //     } else {
  //       // Copia profunda limpia para romper referencias a la base de datos
  //       flattenedAuths.push(JSON.parse(JSON.stringify(authObj)))
  //     }
  //   }
  // }

  // // Comprobación final en consola
  // console.log('RESULTADO FINAL PROCESADO:', flattenedAuths)

  // // 7. Guardar el usuario con sus permisos ya resueltos en la sesión
  // await setUserSession(event, {
  //   user: {
  //     name: user.name || email.split('@')[0],
  //     email: user.email,
  //     nombre: user.nombre,
  //     avatar: user.avatar,
  //     bio: user.bio,
  //     role: user.role,
  //     authorizations: flattenedAuths // 👈 Ya expandidos y listos para usar
  //   },
  //   loggedInAt: Date.now()
  // })

  // console.log({ autorización: user.authorizations })
  return {
    message: 'Login correcto'
  }
})
