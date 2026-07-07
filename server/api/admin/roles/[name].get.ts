// import { db } from '~/server/database/db'
import { masterRoles } from '#server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // Obtener el nombre del rol desde los parámetros de la URL
  const name = getRouterParam(event, 'name')
  if (!name) {
    throw createError({ statusCode: 400, message: 'Nombre de rol requerido' })
  }

  // Buscar en la base de datos con Drizzle
  const role = await db.query.masterRoles.findFirst({
    where: eq(masterRoles.name, name)
  })

  if (!role) {
    throw createError({ statusCode: 404, message: 'El rol maestro no existe' })
  }

  // Si por alguna razón el driver de la BD entrega un String plano de JSON, lo parseamos
  let cleanAuths = []

  // EVALUACIÓN ULTRA ESTRICTA DE TIPOS
  if (role.authorizations) {
    if (Array.isArray(role.authorizations)) {
      // Caso actual: Drizzle ya lo extrae como un Array de objetos nativo
      cleanAuths = role.authorizations
    } else if (typeof role.authorizations === 'string') {
      // Caso de respaldo: Si viene como texto plano JSON
      try {
        const parsed = JSON.parse(role.authorizations)
        cleanAuths = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        cleanAuths = []
      }
    } else if (typeof role.authorizations === 'object') {
      // Caso alternativo: Viene un único objeto suelto
      cleanAuths = [role.authorizations]
    }
  }

  return {
    name: role.name,
    description: role.description,
    authorizations: cleanAuths // Garantiza un array estructurado al frontend
  }
})
