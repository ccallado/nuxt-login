import { loginSchema } from '#shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users, account } from '#server/db/schema'
import bcrypt from 'bcryptjs'
// import { email } from "zod"
import jwt from 'jsonwebtoken'

export default eventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length != 0) {
    throw createError({
      statusCode: 400,
      message: 'User already exists'
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    // 1. Iniciamos una transacción para seguridad de los datos
    const result = await db.transaction(async (tx) => {
      // 2. Alta de usuario tabla principal
      const [newUser] = await db.insert(users).values({
        name: email.split('@')[0],
        email: email,
        emailVerified: false,
        password: hashedPassword,
        avatar: '',
        bio: '',
        nombre: email.split('@')[0],
        role: ['user']
        // createdAt: new Date().getTime()
      }).returning({ insertedId: users.id })
      // 3. Inserta Account
      const [newAccount] = await tx.insert(account).values({
        userId: newUser.insertedId, // Aquí vinculamos ambas tablas
        provider: 'email',
        providerAccountId: email,
        emailVerified: false,
      }).returning()

      return { user: newUser, account: newAccount }
    })
  } catch (error) {
    console.error('Error al guardar en la base de datos:', error)
  }

  const config = useRuntimeConfig()

  // Generar un token JWT para verificar el email
  const token = jwt.sign(
    { email: email },
    config.secretJwtKey,
    { expiresIn: '15m' }
  )

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

    return { message: 'Si el correo existe, recibirás un correo para verificar tu propiedad.'}
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: 'Error de base de datos'
    })
    // console.log(error)
  }

  return {
    message: 'User registered successfully'
  }
})
