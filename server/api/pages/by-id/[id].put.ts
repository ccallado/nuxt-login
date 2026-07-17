/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/pages/by-id/[id].put.ts
import { eq } from 'drizzle-orm'
// import { db } from '../../../server/database/db'
import { pages } from '#server/db/schema'
import { createPageSchema } from '#shared/zod/page.schema'

export default defineEventHandler(async (event) => {
  // 1. Capturar el ID único de la página desde los parámetros de la URL
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID de página requerido para la actualización.' })
  }

  // 2. Leer el cuerpo de la petición enviado por el creador visual
  const body = await readBody(event)

  // 3. VALIDACIÓN ESTRICTA: Forzar a Zod a procesar el payload unificado
  const result = createPageSchema.safeParse(body)

  if (!result.success) {
    throw createError({
      statusCode: 422,
      message: 'La estructura de bloques no cumple con el contrato de datos del servidor.',
      data: result.error.flatten() // Devuelve los errores exactos de validación al cliente
    })
  }

  const validatedData = result.data

  try {
    // 4. Sentencia de actualización en PostgreSQL mediante Drizzle ORM
    const [updatedPage] = await db
      .update(pages)
      .set({
        slug: validatedData.slug.replace(/^\/+|\/+$/g, ''), // Limpiar barras diagonales
        title: validatedData.title,
        meta: validatedData.meta || {},
        content: validatedData.content, // Guarda el JSONB íntegro con availableColumns y tableName
        modifiedAt: new Date() // Sincronizar la marca de tiempo de auditoría
      })
      .where(eq(pages.id, id))
      .returning()

    if (!updatedPage) {
      throw createError({ statusCode: 404, message: 'No se encontró ninguna página con el ID especificado en Postgres.' })
    }

    // Retornamos el registro actualizado con éxito hacia el cliente
    return {
      success: true,
      page: updatedPage
    }
  } catch (error: any) {
    console.error('❌ Error crítico en Drizzle PUT:', error.message)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error interno al actualizar el registro en PostgreSQL.'
    })
  }
})
