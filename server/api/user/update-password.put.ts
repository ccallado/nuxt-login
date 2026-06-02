import { passwordSchema } from '#shared/zod/password.schema'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import bcrypt from 'bcryptjs'

export default eventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const { current, new1 } = await readValidatedBody(event, passwordSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, session?.user?.email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No existe el usuario'
    })
  }

  const isPasswordValid = await bcrypt.compare(current, user[0].password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  const hashedNewPassword = await bcrypt.hash(new1, 10)

  // Modificación de usuario
  await db.update(users).set({
    password: hashedNewPassword
  }).where(eq(users.email, session?.user?.email)).returning()

  return {}
})
