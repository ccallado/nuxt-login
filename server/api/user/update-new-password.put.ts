import { newpasswordSchema } from '#shared/zod/new-password.schema'
import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import bcrypt from 'bcryptjs'

export default eventHandler(async (event) => {
  const { userId, new1, new2 } = await readValidatedBody(event, newpasswordSchema.parse)
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No existe el usuario'
    })
  }

  const hashedNewPassword = await bcrypt.hash(new1, 10)

  // Modificación de usuario
  await db.update(users).set({
    password: hashedNewPassword
  }).where(eq(users.id, userId)).returning()

  return {}
})
