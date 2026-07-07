import { masterRoleFormSchema } from '#shared/utils/sap-form-schema'
// import { db } from '#server/db'
import { masterRoles } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  // 1. Proteger el endpoint (Solo administradores deberían poder crear roles)
  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({
      statusCode: 401,
      message: 'No autenticado' })
  }

  // 2. Leer y validar el cuerpo de la petición con nuestro esquema Zod
  const body = await readBody(event)
  const result = masterRoleFormSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: `Datos inválidos: ${result.error.issues.map(e => e.message).join(', ')}`
    })
  }

  const { name, description, authorizations } = result.data

  try {
    // 3. Insertar o actualizar el Rol Maestro en la base de datos usando Drizzle
    const authorizationsJsonString = JSON.stringify(authorizations)

    // Forzamos un cast intermedio limpio que el linter sí acepta
    const safeAuthorizations = authorizationsJsonString as unknown as string

    await db.insert(masterRoles)
      .values({
        name,
        description,
        authorizations: safeAuthorizations // Forzamos el guardado como texto plano estructurado
      })
      .onConflictDoUpdate({
        target: masterRoles.name,
        set: {
          description,
          authorizations: safeAuthorizations
        }
      })

    await actualizaSession(event)

    return { success: true }
  } catch (error) {
    console.error('Fallo en la inserción de Drizzle:', error)

    throw createError({
      statusCode: 500,
      message: 'Error interno al escribir en la base de datos.'
    })
  }
})
