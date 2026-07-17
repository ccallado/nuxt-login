// server/api/pages/[id].delete.ts
// import { db } from '~/server/database/db'
import { pages } from '#server/db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido.' })
  }

  try {
    const [deletedPage] = await db
      .delete(pages)
      .where(eq(pages.id, id))
      .returning()

    if (!deletedPage) {
      throw createError({ statusCode: 404, message: 'La página no existe.' })
    }

    return {
      success: true,
      message: 'Página eliminada correctamente de PostgreSQL.'
    }
  } catch (error) {
    console.error('Error al eliminar página:', error)
    throw createError({
      statusCode: 500,
      message: 'Error interno al intentar borrar la página.'
    })
  }
})
