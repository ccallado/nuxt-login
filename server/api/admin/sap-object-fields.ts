import { eq, and } from 'drizzle-orm'
// import { db } from '../../utils/db'
import { sapObjectFields } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.method

  // 1. LISTAR TODOS LOS CAMPOS (GET)
  if (method === 'GET') {
    try {
      return await db.select().from(sapObjectFields)
    } catch (error: any) {
      throw createError({ statusCode: 500, message: error.message })
    }
  }

  // 2. REGISTRAR NUEVO CAMPO (POST)
  if (method === 'POST') {
    try {
      const body = await readBody(event)

      // Validación básica
      if (!body.objectName || !body.fieldName || !body.description) {
        throw createError({ statusCode: 400, message: 'Todos los campos son obligatorios' })
      }

      await db.insert(sapObjectFields).values({
        objectName: body.objectName.toUpperCase(),
        fieldName: body.fieldName.toUpperCase(),
        description: body.description
      })

      return { success: true }
    } catch (error: any) {
      // Control de duplicados en clave primaria compuesta
      if (error.code === '23505') {
        throw createError({ statusCode: 400, message: 'Ese campo ya existe en este objeto SAP.' })
      }
      throw createError({ statusCode: 500, message: error.message })
    }
  }

  // 3. ELIMINAR CAMPO (DELETE)
  if (method === 'DELETE') {
    try {
      const query = getQuery(event)
      const objectName = query.objectName as string
      const fieldName = query.fieldName as string

      if (!objectName || !fieldName) {
        throw createError({ statusCode: 400, message: 'Faltan parámetros identificadores' })
      }

      // Al ser clave compuesta, filtramos por ambos campos obligatoriamente
      await db.delete(sapObjectFields).where(
        and(
          eq(sapObjectFields.objectName, objectName),
          eq(sapObjectFields.fieldName, fieldName)
        )
      )

      return { success: true }
    } catch (error: any) {
      throw createError({ statusCode: 500, message: error.message })
    }
  }
})
