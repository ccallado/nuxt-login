// server/api/pages/index.get.ts
// import { db } from '~/server/database/db'
import { pages } from '#server/db/schema'
import { desc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // Recuperamos las columnas principales para el listado de control
    const allPages = await db
      .select({
        id: pages.id,
        slug: pages.slug,
        title: pages.title,
        createdAt: pages.createdAt,
        layout: pages.meta
      })
      .from(pages)
      .orderBy(desc(pages.createdAt))

    return {
      success: true,
      data: allPages
    }
  } catch (error) {
    console.error('Error al listar páginas:', error)
    throw createError({
      statusCode: 500,
      message: 'No se pudo cargar el listado de páginas.'
    })
  }
})
