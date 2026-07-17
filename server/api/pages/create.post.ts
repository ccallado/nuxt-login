/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/pages/create.post.ts
// import { db } from '~/server/database/db'
import { pages } from '#server/db/schema'
import { createPageSchema } from '#shared/zod/page.schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod' // ◄— Asegúrate de importar 'z'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 1. Validar el cuerpo de la petición contra el esquema de Zod
  const result = createPageSchema.safeParse(body)

  // 2. Si la validación falla, retornar los errores granulares de Zod
  if (!result.success) {
    throw createError({
      statusCode: 422, // Unprocessable Entity
      message: 'Estructura JSON inválida',
      data: z.treeifyError(result.error)
    })
  }

  // 3. Extraer los datos limpios y tipados por Zod
  const { slug, title, meta, content } = result.data

  try {
    // 4. Evitar duplicados del Slug en PostgreSQL
    const [existingPage] = await db
      .select()
      .from(pages)
      .where(eq(pages.slug, slug))
      .limit(1)

    if (existingPage) {
      throw createError({
        statusCode: 409,
        message: `El slug '${slug}' ya está en uso.`
      })
    }

    // 5. Inserción segura en la base de datos con Drizzle
    const [insertedPage] = await db
      .insert(pages)
      .values({
        slug: slug.trim(),
        title: title.trim(),
        meta: meta || {},
        content: content
      })
      .returning()

    return {
      success: true,
      message: 'Página validada, guardada y lista para renderizar.',
      data: insertedPage
    }
  } catch (error: any) {
    console.error('Error en Drizzle:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error al persistir la página.'
    })
  }
})
