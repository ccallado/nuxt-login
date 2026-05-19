import { loginSchema } from '#shared/zod/login.schema'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { success, data } = loginSchema.safeParse(body)

  if (!success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request'
    })
  }

  console.log({ body })

  return {
    message: 'Login successful',
    user: {
      email: data.email
    }
  }
})
