// server/api/send-email.post.ts
export default defineEventHandler(async (event) => {
  try {
    // 1. Extraer los datos enviados desde el frontend
    const body = await readBody(event)
    const { to, subject, text, html } = body

    // 2. Obtener el cliente de Resend preconfigurado por el módulo
    const { emails } = useResend()

    // 3. Enviar el correo electrónico
    const data = await emails.send({
      from: 'Tu Aplicación <onboarding@resend.dev>', // Modificar tras verificar dominio en Resend
      to: [to],
      subject: subject,
      text: text || '',
      html: html || `<p>${text}</p>`
    })

    return { success: true, data }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al procesar el envío de correo.'
    })
  }
})
