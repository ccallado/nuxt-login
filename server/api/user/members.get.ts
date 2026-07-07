import { users } from '#server/db/schema'
import { asc } from 'drizzle-orm'

export default eventHandler(async (event) => {
  const session = await getUserSession(event)

  if (!session?.user?.email) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  const userss = await db.select().from(users).orderBy(asc(users.nombre))

  if (userss.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No existe el usuario'
    })
  }

  // console.log({ userss })
  return userss.map(user => ({
    name: user.name,
    username: user.nombre,
    role: user.role,
    avatar: user.avatar
  }))
})
