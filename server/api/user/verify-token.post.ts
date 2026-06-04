import z from 'zod'
import jwt from 'jsonwebtoken'

export default eventHandler(async (event) => {
  const bodySchema = z.object({
    token: z.string().min(1)
  })
  const body = await readValidatedBody(event, bodySchema.parse)
  const rawToken = String(body.token || '')
  const token = rawToken.replace(/^"|"$/g, '')
  const config = useRuntimeConfig()

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, config.secretJwtKey)
    // const userId = decoded.userId
    return { userId: decoded.userId }
  } catch (error) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid or expired token'
    })
  }
})
