import { eq } from 'drizzle-orm'
// import { db } from '../../utils/db'
import { sapObjectsMaster, sapObjectFields } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.method

  // 1. LISTAR OBJETOS CON SUS CAMPOS ASOCIADOS (GET)
  if (method === 'GET') {
    try {
      const objetos = await db.select().from(sapObjectsMaster)
      const campos = await db.select().from(sapObjectFields)

      // Retornamos los objetos inyectando de forma nativa sus campos hijos
      return objetos.map(obj => ({
        ...obj,
        campos: campos.filter(c => c.objectName === obj.objectName)
      }))
    } catch (error: any) {
      throw createError({ statusCode: 500, message: error.message })
    }
  }

  // 2. CREAR O ACTUALIZAR (POST)
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { objectName, description, isEditing } = body

      if (!objectName || !description) {
        throw createError({ statusCode: 400, message: 'Datos incompletos.' })
      }

      const upperName = objectName.toUpperCase()

      if (isEditing) {
        // ACTUALIZAR DESCRIPCIÓN
        await db.update(sapObjectsMaster)
          .set({ description })
          .where(eq(sapObjectsMaster.objectName, upperName))
      } else {
        // CREAR NUEVO OBJETO
        await db.insert(sapObjectsMaster).values({
          objectName: upperName,
          description
        })
        // Regla SAP obligatoria: autocrear el campo ACTVT al inicializar el objeto
        await db.insert(sapObjectFields).values({
          objectName: upperName,
          fieldName: 'ACTVT',
          description: 'Actividades de Autorización'
        })
      }

      return { success: true }
    } catch (error: any) {
      if (error.code === '23505') {
        throw createError({ statusCode: 400, message: 'El objeto ya existe en el catálogo.' })
      }
      throw createError({ statusCode: 500, message: error.message })
    }
  }

  // 3. ELIMINAR OBJETO SUPERIOR (DELETE)
  if (method === 'DELETE') {
    try {
      const query = getQuery(event)
      const name = query.objectName as string

      if (!name) throw createError({ statusCode: 400, message: 'ID requerido.' })

      // Al tener ON DELETE CASCADE configurado en Drizzle, se borrarán sus campos automáticamente en Postgres
      await db.delete(sapObjectsMaster).where(eq(sapObjectsMaster.objectName, name))

      return { success: true }
    } catch (error: any) {
      throw createError({ statusCode: 500, message: error.message })
    }
  }
})
