import { eq } from 'drizzle-orm'
import { users } from '../../db/schema'
import { profileSchema } from '~~/shared/zod/profile.schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const { email, name, username, avatar, bio } = await readValidatedBody(event, profileSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, session?.user?.email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'No existe el usuario'
    })
  }

  // Modificación de usuario
  const updateUser = await db.update(users).set({
    nombre: name,
    email: email,
    name: username,
    avatar: avatar,
    bio: bio
    // createdAt: new Date().getTime()
  }).where(eq(users.email, session?.user?.email)).returning()

  await setUserSession(event, {
    user: {
      ...session.user,
      name: updateUser[0].name,
      email: updateUser[0].email,
      nombre: updateUser[0].nombre,
      avatar: updateUser[0].avatar,
      bio: updateUser[0].bio
    }
  })

  return {
  }
})
