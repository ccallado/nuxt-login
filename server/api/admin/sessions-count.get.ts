// server/api/admin/sessions-count.get.ts
import { sql } from 'drizzle-orm'
// import { db } from '../../database/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/json')
  try {
    // Reemplaza "sessions" por el nombre exacto de tu tabla de sesiones
    const result = await db.execute(sql.raw(`SELECT COUNT(*)::int as total FROM "user_sessions"`))
    const rows = result.rows || result || []
    const total = rows[0]?.total ?? 0
    return { total }
  } catch (error) {
    console.error('❌ Error en conteo rápido de sesiones:', error)
    return { total: 0 }
  }
})
