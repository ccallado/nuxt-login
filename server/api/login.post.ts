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
      avatar: user[0].avatar,
      nombre: user[0].nombre
    }
  })

  return {
    message: 'Login correcto'
  }
})
