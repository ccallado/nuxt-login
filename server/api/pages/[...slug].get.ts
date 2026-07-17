// server/api/pages/[...slug].get.ts
// import { db } from '~/server/database/db'
import { pages } from '../../db/schema'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 1. Forzar a que la respuesta del servidor sea estrictamente un JSON
  setHeader(event, 'Content-Type', 'application/json')

  const rawSlug = getRouterParam(event, 'slug')

  if (!rawSlug) {
    throw createError({ statusCode: 400, message: 'Slug requerido por el servidor.' })
  }

  // Limpiar barras iniciales o finales (ej: "/propiedadess/" -> "propiedadess")
  const cleanSlug = rawSlug.replace(/^\/+|\/+$/g, '')

  try {
    // 2. Consulta directa a PostgreSQL a través del ORM Drizzle
    const [page] = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, cleanSlug))
      .limit(1)

    // Si la consulta en Postgres no arroja resultados
    if (!page) {
      throw createError({
        statusCode: 404,
        message: `La interfaz con el slug '${cleanSlug}' no existe en PostgreSQL.`
      })
    }

    // 3. Devolvemos el registro limpio (Drizzle row object)
    return page

  } catch (error: any) {
    console.error('❌ Error crítico en Drizzle:', error.message)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al conectar con la base de datos Postgres.'
    })
  }
})
