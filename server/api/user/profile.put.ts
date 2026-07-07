import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'
import { profileSchema } from '#shared/zod/profile.schema'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const { email, name, username, avatar, bio, role } = await readValidatedBody(event, profileSchema.parse)

  const user = await db.select().from(users).where(eq(users.email, session?.user?.email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No existe el usuario'
    })
  }

  // Modificación de usuario
  const updateUser = await db.update(users).set({
    nombre: name,
    email: email,
    name: username,
    avatar: avatar,
    bio: bio,
    role: role
    // createdAt: new Date().getTime()
  }).where(eq(users.email, session?.user?.email)).returning()

  await setUserSession(event, {
    user: {
      ...session.user,
      name: updateUser[0].name,
      email: updateUser[0].email,
      nombre: updateUser[0].nombre,
      avatar: updateUser[0].avatar,
      bio: updateUser[0].bio,
      role: updateUser[0].role
    },
    loggedInAt: Date.now()
  })

  return {
  }
})
