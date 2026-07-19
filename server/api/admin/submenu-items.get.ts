// server/api/admin/submenu-items.get.ts
import { sql } from 'drizzle-orm'
// import { db } from '../../database/db'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/json')

  const query = getQuery(event)
  let currentPath = query.path as string

  // console.log({ currentPath })
  if (!currentPath) {
    return [[], []]
  }

  // // Función helper interna para lanzar la consulta relacional a Postgres
  // async function getSubmenuItems(path: string) {
  //   const result = await db.execute(sql.raw(`
  //     SELECT
  //             etiqueta as label, icon, direccion as to, obj_req, act_req, var_req, parent_id, is_group_two, display_order
  //           FROM navigation_menu
  //           WHERE parent_id = (
  //                   SELECT id FROM "navigation_menu" WHERE direccion = '${path}' LIMIT 1
  //                 )
  //           ORDER BY display_order ASC
  //   `))
  //   return result.rows || result || []
  // }

  // try {

  //   }
  // Función interna para descargar tanto las pestañas principales como sus subelementos (hijos)
  async function fetchMenuTree(path: string) {
    // 1. Localizamos primero el ID del menú raíz (ej: '/admin/settings')
    const parentLookup = await db.execute(sql.raw(`
      SELECT id FROM "navigation_menu" WHERE direccion = '${path}' LIMIT 1
    `))
    // console.log({ parentLookup })
    const parentRows = parentLookup.rows || parentLookup || []
    if (parentRows.length === 0) return []

    const rootId = parentRows[0].id

    // 2. CONSULTA EN CASCADA COMPLETA:
    // Seleccionamos las pestañas que cuelgan del nodo raíz O que cuelgan de un hijo del nodo raíz
    const result = await db.execute(sql.raw(`
      SELECT
        id, etiqueta as label, icon, direccion as to, true as exact, obj_req as objReq, act_req as actReq, var_req as varReq, is_group_two, parent_id as parentid
      FROM "navigation_menu"
      WHERE parent_id = ${rootId}
         OR parent_id IN (SELECT id FROM "navigation_menu" WHERE parent_id = ${rootId})
      ORDER BY display_order ASC
    `))

    // console.log({ result })
    return result.rows || result || []
  }
  try {
    // Intentamos la descarga con la URL actual
    let rawItems = await fetchMenuTree(currentPath)

    // console.log({ rawItems })
    // console.log({ currentPath })
    // Mecanismo de herencia preventivo si estamos dentro de una subruta
    if (rawItems.length === 0 && currentPath.includes('/')) {
      console.log(`⚠️ URL '${currentPath}' sin submenús. Activando fallback a ruta padre...`)

      const lastSlashIdx = currentPath.lastIndexOf('/')
      const parentPath = currentPath.substring(0, lastSlashIdx)

      console.log(`🔍 [FALLBACK] Reintentando árbol jerárquico con path base: '${parentPath}'`)

      rawItems = await fetchMenuTree(parentPath)
    }

    if (rawItems.length === 0) return [[], []]

    // 3. 👑 CONSTRUCCIÓN DINÁMICA DEL ÁRBOL RECURSIVO (JS)
    const menuMap = new Map<number, any>()
    const processedTree: any[] = []

    // Mapeamos temporalmente todos los registros inicializando su array de hijos vacío
    rawItems.forEach((item: any) => {
      // console.log({ item })
      menuMap.set(item.id, { ...item, children: [] })
    })
    // console.log({ menuMap })
    // Recorremos el mapa para anidar el registro 15 dentro del 16 si coincide el parentId
    rawItems.forEach((item: any) => {
      // console.log({ item })
      const mappedItem = menuMap.get(item.id)
      const pId = item.parentid

      // Si el elemento tiene un padre en este grupo (que no es la raíz global), va a su sub-array
      const tiene = menuMap.has(pId)
      console.log({ pId })
      console.log({ tiene })
      console.log({ item })

      if (pId && menuMap.has(pId)) {
        menuMap.get(pId).children.push(mappedItem)
        console.log({ menuMap })
      } else {
        // Si no tiene padre en esta tanda, es una pestaña principal de primer nivel
        processedTree.push(mappedItem)
        // console.log({ processedTree })
      }
    })
    // console.log({ menuMap })
    console.log({ processedTree })
    // 3. Clasificamos las filas en los dos grupos que exige Nuxt UI (Menú superior y Menú inferior/Documentación)
    const grupoUno = processedTree.filter((r: any) => r.is_group_two === false)
    const grupoDos = processedTree.filter((r: any) => r.is_group_two === true)

    return [grupoUno, grupoDos]
  } catch (error: any) {
    console.error('❌ Error al descargar submenú dinámico:', error.message)
    return [[], []] // Fallback seguro
  }
})
