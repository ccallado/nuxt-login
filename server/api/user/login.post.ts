import { loginSchema } from '#shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users, userSessions } from '#server/db/schema'
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

  // 🌟 NUEVA LÓGICA DE CONTROL DE SESIONES CENTRALIZADA:
  const sessionId = crypto.randomUUID()
  const userAgent = getHeader(event, 'user-agent') || 'Dispositivo Desconocido'
  const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1'

  // Guardamos los metadatos de la sesión física en Postgres usando Drizzle
  await db.insert(userSessions).values({
    id: sessionId,
    userId: user.id,
    device: userAgent,
    ipAddress: ip
  })

  // Guardar el usuario incluyendo el sessionId recién generado en la cookie cifrada
  await setUserSession(event, {
    user: {
      id: user.id,
      sessionId: sessionId, // 👈 Vinculación directa cookie-base de datos
      name: user.name || user.email.split('@')[0],
      email: user.email,
      nombre: user.nombre,
      avatar: user.avatar,
      bio: user.bio,
      authorizations: [],
      sessionCreatedAt: new Date()
    },
    loggedInAt: Date.now()
  })

  await actualizaSession(event)

  return {
    message: 'Login correcto'
  }
})
