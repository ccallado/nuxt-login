import { loginSchema } from '#shared/zod/login.schema'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  if (email === 'ccallado@hotmail.com' && password === '12341234') {
    await setUserSession(event, {
      user: {
        name: 'John Doe'
      }
    })
    console.log({ email, password })
    return {
      message: 'Login correcto'
    }
  }

  throw createError({
    statusCode: 401,
    message: 'Bad credentials'
  })
})
