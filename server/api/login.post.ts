import { loginSchema } from '#shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No existe el usuario'
    })
  }

  // const hashedPassword = await bcrypt.hash(password, 10)

  // console.log({ tabla: user[0].password, pantalla: hashedPassword })

  const isPasswordValid = await bcrypt.compare(password, user[0].password)

  if (!isPasswordValid) {
    console.log('ERROR Invalid password')
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  console.log('Login successful')

  await setUserSession(event, {
    user: {
      name: user[0].name || email.split('@')[0],
      email
    }
  })

  return {
    message: 'Login correcto'
  }
})
