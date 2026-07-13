import z from 'zod'
import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import { users } from '#server/db/schema'
import { account } from 'hub:db:schema'

export default defineEventHandler(async (event) => {
  const bodySchema = z.object({
    token: z.string().min(1)
  })
  const body = await readValidatedBody(event, bodySchema.parse)
  const rawToken = String(body.token || '')
  const token = rawToken.replace(/^"|"$/g, '')
  const config = useRuntimeConfig()

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, config.secretJwtKey)

    // Modificación de usuario
    await db.update(users).set({
      emailVerified: true
    }).where(eq(users.email, decoded.email)).returning()
    // Modificación de account
    await db.update(account).set({
      emailVerified: true
    }).where(eq(account.providerAccountId, decoded.email)).returning()

    const user = await db.select().from(users).where(eq(users.email, decoded.email)).limit(1)

    if (user.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No existe el usuario'
      })
    }

    // console.log({ user })

    const { sesion } = await setUserSession(event, {
      user: {
        name: user[0].name || user[0].email.split('@')[0],
        email: user[0].email,
        nombre: user[0].nombre,
        avatar: user[0].avatar,
        bio: user[0].bio || ''
      },
      loggedInAt: Date.now()
    })

    // console.log({ sesion })
    return {
      mail: user[0].email
    }
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: 'Invalid or expired token'
    })
  }
})
