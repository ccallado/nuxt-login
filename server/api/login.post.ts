import { loginSchema } from '#shared/zod/login.schema'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const {
    secretJwtKey,
    public: { baseApi }
  } = useRuntimeConfig()

  const body = await readBody(event)

  const { success, data } = loginSchema.safeParse(body)

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request'
    })
  }

  console.log({ body })

  const token = jwt.sign({ email: data.email, baseApi }, secretJwtKey, { expiresIn: '1h'})

  setCookie(event, 'jwt_chat', token, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    path: '/'
  })

  setCookie(event, 'public_email', data.email, {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    path: '/'
  })

  return {
    message: 'Login successful',
    user: {
      email: data.email,
      token
    }
  }
})
