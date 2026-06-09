import { loginSchema } from '#shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No existe el usuario'
    })
  }

  if (!user[0].emailVerified) {
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
      const response = await $fetch('/api/send-mail-ethereal', {
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
        statusMessage: 'Email no verificado, mandado correo para verificar'
      })
    } catch (error) {
      // console.log(error)
      throw createError({
        statusCode: 401,
        statusMessage: 'Email no verificado, mandado correo para verificar'
      })
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user[0].password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  await setUserSession(event, {
    user: {
      name: user[0].name || email.split('@')[0],
      email: user[0].email,
      nombre: user[0].nombre,
      avatar: user[0].avatar,
      bio: user[0].bio,
      role: user[0].role
    },
    loggedInAt: Date.now()
  })

  console.log(user[0].role)
  return {
    message: 'Login correcto'
  }
})
