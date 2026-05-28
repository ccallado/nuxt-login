import { loginSchema } from '@@/shared/zod/login.schema'
import { eq } from 'drizzle-orm'
import { users } from '../db/schema'
import bcrypt from 'bcryptjs'
// import { email } from "zod"

export default eventHandler(async (event) => {
  const { email, password } = await readValidatedBody(event, loginSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1)

  if (user.length != 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User already exists'
    })
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  // Alta de usuario
  await db.insert(users).values({
    name: email.split('@')[0],
    email: email,
    password: hashedPassword,
    avatar: 'texto'
    // createdAt: new Date().getTime()
  })

  await setUserSession(event, {
    user: {
      name: email.split('@')[0],
      email
    }
  })

  return {
    message: 'User registered successfully'
  }
})
