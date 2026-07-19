/* eslint-disable @typescript-eslint/no-explicit-any */
// server/api/db/query.get.ts
import { sql } from 'drizzle-orm'
// import { db } from '../../database/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/json')

  const query = getQuery(event)
  const tableName = query.table as string

  if (!tableName) {
    throw createError({ statusCode: 400, message: 'Falta el parámetro table.' })
  }

  try {
    // 1. Descargar las filas de la tabla física (Límite 100)
    const result = await db.execute(sql.raw(`SELECT * FROM "${tableName}" ORDER BY id DESC LIMIT 100`))
    const cleanRows = Array.isArray(result) ? result : (result.rows || [])

    // 2. DETECCIÓN AUTOMÁTICA EN POSTGRESQL:
    // Consultamos el diccionario de datos de Postgres para saber qué columnas son Foreign Keys que apuntan a la tabla 'users'
    const fkDiscovery = await db.execute(sql.raw(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = '${tableName}'
        AND ccu.table_name = 'users';
    `))

    // Extraemos la lista de nombres de columnas relacionales (ej: ['propietarioId', 'creadaPorId', 'modificadoPorId'])
    const fkRows = fkDiscovery.rows || []
    const userFields = fkRows.map((r: any) => r.column_name)

    // 3. Devolvemos el paquete completo: las filas de datos y la lista de columnas que son usuarios
    return {
      rows: cleanRows,
      userFields: userFields // ◄— El servidor le avisa al frontend qué columnas automatizar
    }
  } catch (error: any) {
    console.error('❌ Error en consulta RAW automatizada:', error.message)
    return { rows: [], userFields: [] }
  }
})
