import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'

export default eventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const user = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1)

  if (user.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No existe el usuario'
    })
  }

  return {
    name: user[0].name,
    email: user[0].email,
    nombre: user[0].nombre,
    avatar: user[0].avatar,
    bio: user[0].bio
  }
})
