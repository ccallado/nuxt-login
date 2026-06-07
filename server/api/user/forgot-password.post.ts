import { forgotPasswordSchema } from '#shared/zod/forgot-password.schema'
import jwt from 'jsonwebtoken'
import { users } from '../../db/schema'
import { eq } from 'drizzle-orm'
// import { messages } from '@electric-sql/pglite'
// import { clearNuxtData } from 'nuxt/app'

export default eventHandler(async (event) => {
  const { email } = await readValidatedBody(event, forgotPasswordSchema.parse)
  const config = useRuntimeConfig()

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length === 0) {
    // Por seguridad, no revelar si el email existe o no
    return {
      message: 'If this email exists, you will receive a reset link.'
    }
  }

  // Generar un token JWT para restablecer la contraseña
  const token = jwt.sign(
    { userId: user[0].id },
    config.secretJwtKey,
    { expiresIn: '15m' }
  )

  try {
    // URL de reset
    // const resetUrl = `${config.public.appUrl}/auth/change-password?token=${token}`
    const url = getRequestURL(event)
    const resetUrl = `${url.origin}/auth/change-password?token=${token}`

    // Enviar el email de restablecimiento de contraseña
    // const { sendMail } = useNodeMailer()
    // sendMail({
    //   to: email,
    //   subject: 'Password Reset Requets',
    //   html: `
    //   <div style="font-family: Arial, sans-serif; max-width 600px; margin: 0 auto;">
    //     <h2>Password Reset Request</h2>
    //     <p>You have requested to reset your password. Click the link below to proceed:</p>
    //     <div style="text-align: center; martin: 30px 0;">
    //       <a href=${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
    //       Reset Password
    //       </a>
    //     </div>
    //     <p><strong>This link expires in 15 minutes.</strong></p>
    //     <p>If you didn't request this, please ignore this email</p>
    //     <hr>
    //     <p style="color: #666; font-size: 12px;">
    //       If the button doesn't work, copy and paste this link: ${resetUrl}
    //     </p>
    //   </div>`
    // })
    const response = await $fetch('/api/send-mail-ethereal', {
      method: 'POST',
      body: {
        to: email,
        subject: 'Password Reset Requets',
        html: `
        <div style="font-family: Arial, sans-serif; max-width 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Click the link below to proceed:</p>
          <div style="text-align: center; martin: 30px 0;">
            <a href=${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
            </a>
          </div>
          <p><strong>This link expires in 15 minutes.</strong></p>
          <p>If you didn't request this, please ignore this email</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            If the button doesn't work, copy and paste this link: ${resetUrl}
          </p>
        </div>`
      }
    })

    return { message: 'If this email exists, you will receive a reset link.'}
  } catch (error) {
  }
})
