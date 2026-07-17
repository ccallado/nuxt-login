// server/api/db/save-form.post.ts
// import { db } from '../../database/db'
import { sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 1. Forzar respuesta JSON limpia hacia el frontend
  setHeader(event, 'Content-Type', 'application/json')

  // 2. Extraer el nombre de la tabla de forma correcta y nativa en Nuxt 4
  const query = getQuery(event)
  const targetTable = (query.table as string) || 'propiedades'

  // 3. Leer el JSON exacto con los datos que el usuario escribió en la pantalla
  const body = await readBody(event)

  if (!body || Object.keys(body).length === 0) {
    throw createError({ statusCode: 400, message: 'El formulario envió datos vacíos.' })
  }

  try {
    // 4. Filtrar y limpiar las propiedades para eliminar campos de control nulos o vacíos
    const activeEntries = Object.entries(body).filter(([_, val]) => val !== '' && val !== null && val !== undefined)

    if (activeEntries.length === 0) {
      throw createError({ statusCode: 400, message: 'No hay campos válidos para rellenar.' })
    }

    // 5. Construir las columnas y los valores escapando strings de forma segura para Postgres
    const columns = activeEntries.map(([key, _]) => `"${key}"`).join(', ')

    const values = activeEntries.map(([_, val]) => {
      if (typeof val === 'number') return val
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE'
      if (!isNaN(Date.parse(String(val))) && String(val).includes('-')) {
        return `'${new Date(String(val)).toISOString()}'::timestamp`
      }

      // Escapamos comillas simples duplicándolas para evitar inyección SQL básica en los textos
      return `'${String(val).replace(/'/g, "''")}'`
    }).join(', ')

    const rawQuery = `INSERT INTO "${targetTable}" (${columns}) VALUES (${values}) RETURNING *`
    // console.log('📝 [SQL EXECUTE] Ejecutando inserción cruda:', rawQuery)

    // 6. Inserción directa en PostgreSQL mediante el motor de Drizzle ORM
    const insertedResult = await db.execute(sql.raw(rawQuery))

    return {
      success: true,
      message: '¡Registro insertado con éxito en PostgreSQL!',
      data: insertedResult.rows || insertedResult
    }
  } catch (error: any) {
    console.error('❌ Error crítico en Drizzle POST Form:', error.message)
    throw createError({
      statusCode: 500,
      message: error.message || 'Error interno al insertar el registro en la base de datos.'
    })
  }
})
