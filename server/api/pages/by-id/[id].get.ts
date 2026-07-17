// server/api/pages/by-id/[id].get.ts
// import { db } from '~/server/database/db'
import { pages } from '#server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 1. Obtener el ID de los parámetros de la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      message: 'El identificador único (ID) es obligatorio.'
    })
  }

  try {
    // 2. Buscar la fila exacta en PostgreSQL filtrando por el ID (UUID)
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.id, id))
      .limit(1)

    // 3. Si la página no existe en las tablas de Drizzle, lanzar un 404
    if (!page) {
      throw createError({
        statusCode: 404,
        message: 'La página solicitada no existe en la base de datos.'
      })
    }

    // 4. Devolver la fila completa (slug, title, meta y content) al frontend
    return page

  } catch (error: any) {
    console.error('Error al recuperar página por ID:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error interno al leer el registro desde PostgreSQL.'
    })
  }
})
