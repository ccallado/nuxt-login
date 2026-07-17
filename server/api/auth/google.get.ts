import { and, eq } from 'drizzle-orm'
import { users, account, userSessions } from '#server/db/schema'
import jwt from 'jsonwebtoken'
// import { clearNuxtData } from 'nuxt/app'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    // console.log({ user })
    const usuariosEncontrados = await db.select().from(users).where(eq(users.email, user.email)).limit(1)
    let usuario = usuariosEncontrados[0]
    if (usuariosEncontrados.length === 0) {
      // 2. Alta de usuario tabla principal
      const [nuevoUsuarioCreado] = await db.insert(users).values({
        name: user.email.split('@')[0],
        email: user.email,
        emailVerified: false,
        // password: hashedPassword,
        avatar: '',
        bio: '',
        nombre: user.email.split('@')[0]
        // createdAt: new Date().getTime()
      }).returning({ id: users.id })
      usuario = nuevoUsuarioCreado
      // throw createError({
      //   statusCode: 400,
      //   message: 'User already exists'
      // })
    }

    const accountuser = await db.select().from(account).where(and(
      eq(account.providerAccountId, user.email),
      eq(account.provider, 'google'))).limit(1)
    let newAccount = accountuser[0] || null
    if (accountuser.length === 0) {
      const [cuentaCreada] = await db.insert(account).values({
        userId: usuario.id, // Aquí vinculamos ambas tablas
        provider: 'google',
        providerAccountId: user.email,
        emailVerified: false
      }).returning()
      newAccount = cuentaCreada
      // throw createError({
      //   statusCode: 400,
      //   message: 'User already exists'
      // })
    }
    if (!newAccount.emailVerified) {
      const config = useRuntimeConfig()
      // Generar un token JWT para verificar el email
      const token = jwt.sign(
        { email: user.email,
          accountId: newAccount.id
        },
        config.secretJwtKey,
        { expiresIn: '15m' }
      )

      try {
        // URL de reset
        const url = getRequestURL(event)
        const resetUrl = `${url.origin}/auth/verifica-email?token=${token}`

        await $fetch('/api/send-mail-ethereal', {
          method: 'POST',
          body: {
            to: user.email,
            subject: 'Verificación de email web mia',
            html: `
              <div style="font-family: Arial, sans-serif; max-width 600px; margin: 0 auto;">
                <h2>Verificación de email</h2>
                <p>Te has dado de alta en la web mia. Pulsa el enlace para verificar el correo:</p>
                <div style="text-align: center; martin: 30px 0;">
                  <a href=${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Verificar Email
                  </a>
                </div>
                <p><strong>Este enlace expira en 15 minutos.</strong></p>
                <p>Si tu no lo has solicitado, por favor ignora este correo</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                  Si el botón no funciona, copia y pega este enlace: ${resetUrl}
                </p>
              </div>`
          }
        })
        throw createError({
          statusCode: 404,
          message: 'Verifica el correo'
        })
      } catch (error) {
        console.error (error)
      }
      return sendRedirect(event, '/register?msg=verification_pending')
    }

    // 🌟 NUEVA LÓGICA DE CONTROL DE SESIONES CENTRALIZADA:
    const sessionId = crypto.randomUUID()
    const userAgent = getHeader(event, 'user-agent') || 'Dispositivo Desconocido'
    const ip = getHeader(event, 'x-forwarded-for') || event.node.req.socket.remoteAddress || '127.0.0.1'
    const userId = Number(accountuser[0].userId)
    // console.log({ accountuser })
    // Guardamos los metadatos de la sesión física en Postgres usando Drizzle
    await db.insert(userSessions).values({
      id: sessionId,
      userId: userId,
      device: userAgent,
      ipAddress: ip
    })

    await setUserSession(event, {
      user: {
        id: usuario.id,
        sessionId: sessionId, // 👈 Vinculación directa cookie-base de datos
        name: usuario.name || usuario.email.split('@')[0],
        email: usuario.email,
        nombre: usuario.nombre || 'vacío',
        avatar: usuario.avatar,
        bio: usuario.bio,
        authorizations: [],
        sessionCreatedAt: new Date()
      },
      loggedInAt: Date.now()
    })

    await actualizaSession(event)

    return sendRedirect(event, '/')
  }
})
