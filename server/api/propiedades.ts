import { eq } from 'drizzle-orm'
// import { db } from '../db'
import { propiedades } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  const method = event.method

  // 1. LISTAR (GET)
  if (method === 'GET') {
    return await db.select().from(propiedades)
  }

  // 2. CREAR (POST)
  if (method === 'POST') {
    const body = await readBody(event)

    // El id se omite porque PostgreSQL lo autogenera con defaultRandom()
    await db.insert(propiedades).values({
      titulo: body.titulo,
      calle: body.calle,
      numero: body.numero,
      escalera: body.escalera,
      planta: body.planta,
      letra: body.letra,
      descripcion: body.descripcion,
      propietarioId: body.propietarioId
    })

    return { success: true }
  }

  // 3. ACTUALIZAR (PUT)
  if (method === 'PUT') {
    const body = await readBody(event)

    await db.update(propiedades)
      .set({
        titulo: body.titulo,
        calle: body.calle,
        numero: body.numero,
        escalera: body.escalera,
        planta: body.planta,
        letra: body.letra,
        descripcion: body.descripcion,
        propietarioId: body.propietarioId
      })
      .where(eq(propiedades.id, body.id))

    return { success: true }
  }

  // 4. ELIMINAR (DELETE)
  if (method === 'DELETE') {
    const query = getQuery(event)
    const idEliminar = query.id as string

    await db.delete(propiedades).where(eq(propiedades.id, idEliminar))

    return { success: true }
  }
})
