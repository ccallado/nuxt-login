// server/api/send-email.post.ts
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  try {
    // 1. Extraer los datos enviados desde el frontend
    const config = useRuntimeConfig(event)
    const body = await readBody(event)
    const { to, subject, text, html } = body

    // 2. Obtener el cliente de Resend preconfigurado por el módulo
    const transporter = nodemailer.createTransport({
      host: config.nodemailer.host,
      port: Number(config.nodemailer.port),
      secure: Number(config.nodemailer.port) === 465,
      auth: {
        user: config.nodemailer.auth.user,
        pass: config.nodemailer.auth.pass
      }
    })
    // 3. Enviar el correo electrónico
    const data = await transporter.sendMail({
      from: 'Tu Aplicación <onboarding@resend.dev>', // Modificar tras verificar dominio en Resend
      to: [to],
      subject: subject,
      text: text || '',
      html: html || `<p>${text}</p>`
    })

    return { success: true, data }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = error as any
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error al procesar el envío de correo.'
    })
  }
})
