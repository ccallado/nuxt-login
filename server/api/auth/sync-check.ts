import { eq } from 'drizzle-orm'
// import { db } from '../../utils/db'
import { users } from '#server/db/schema'
// import { createLanguageService } from 'typescript'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)

  // console.log({ seson: session })
  // console.log({ chkaut: session.user?.authorizations })
  if (!session.user) {
    return { mustRefresh: false }
  }

  // 1. Obtener la marca de tiempo guardada en la cookie encriptada del navegador
  // (nuxt-auth-utils guarda 'createdAt' o puedes añadir una propiedad 'lastChecked')
  const sessionTime = new Date(session.user.sessionCreatedAt || session.loggedInAt)

  // 2. Consultar la última modificación real en Postgres
  const userList = await db
    .select({ authUpdatedAt: users.authUpdatedAt })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  // console.log({ userList })
  // 👑 SOLUCIÓN A: Validar de forma segura en lugar de usar desestructuración directa
  const dbUser = userList[0]

  if (!dbUser) return { mustRefresh: false }

  // 3. Comparar: si la base de datos es más reciente, le avisamos al cliente que re-hidrate
  // console.log({ db_upd: dbUser.authUpdatedAt })
  // console.log({ sst: sessionTime })
  const mustRefresh = dbUser.authUpdatedAt > sessionTime

  // Si requiere refrescarse, actualizamos también los datos de la cookie del servidor
  // para que en la siguiente petición ya estén sincronizados los tiempos
  if (mustRefresh) {
    // Traemos todo el nuevo árbol dinámico de autorizaciones mezclado
    const [fullUser] = await db.select().from(users).where(eq(users.id, session.user.id))

    await actualizaSession(event)
    // await replaceUserSession(event, {
    //   ...session, // 1. Propaga todas las propiedades raíz exigidas por nuxt-auth-utils (como loggedInAt)
    //   user: {
    //     ...session.user, // 2. Propaga las propiedades previas del usuario
    //     authorizations: fullUser.authorizations, // 3. Inyectamos la nueva matriz limpia de Postgres
    //     sessionCreatedAt: new Date() // 4. Reiniciamos el reloj para la próxima comparación
    //   }
    // })
  }

  return { mustRefresh }
})
