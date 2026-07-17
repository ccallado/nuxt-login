// server/api/db/users-list.get.ts
import { sql } from 'drizzle-orm'
// import { db } from '../../database/db'

export default defineEventHandler(async (event) => {
  // Aseguramos de forma estricta que la cabecera sea JSON para que no devuelva HTML
  setHeader(event, 'Content-Type', 'application/json')

  try {
    // Consulta directa y RAW a la tabla users de Postgres
    const result = await db.execute(sql.raw(`SELECT id, email FROM "users" ORDER BY email ASC`))
    const cleanUsers = result.rows || result || []

    // console.log('🛢️ [BD SERVER] Lista de usuarios extraída con éxito:', cleanUsers.length)
    return cleanUsers
  } catch (error: any) {
    console.error('❌ Error en query de usuarios:', error.message)
    return []
  }
})
