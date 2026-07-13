/* eslint-disable @typescript-eslint/no-explicit-any */
// import { db } from '../../utils/db'
import { navigationMenu, userSessions } from '#server/db/schema'
import { asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  try {
    // 1. Consultar todos los registros del menú ordenados y el recuento de sesiones activas
    const rawDbItems = await db.select().from(navigationMenu).orderBy(asc(navigationMenu.displayOrder))
    const sesiones = await db.select().from(userSessions)
    const totalSesiones = sesiones.length

    // 2. Función auxiliar para estructurar los elementos en forma de árbol (recursivo para submenús)
    const buildTree = (parentId: number | null, isGroupTwoBlock: boolean): any[] => {
      return rawDbItems
        .filter(item => item.parentId === parentId && item.isGroupTwo === isGroupTwoBlock)
        .map(item => {
          const node: any = {
            label: item.etiqueta,
            icon: item.icon || undefined,
            to: item.direccion || undefined,
            objReq: item.objReq || undefined,
            actReq: item.actReq || undefined,
            varReq: item.varReq || undefined,
            // 👑 CORRECCIÓN 1: Conservar el badge si la base de datos lo trae por defecto
            badge: item.badge || undefined
          }

          // 👑 INTERCEPCIÓN EN CALIENTE: Si es el enlace de sesiones, le inyectamos el badge en vivo
          if (item.direccion === '/admin/settings/sesiones') {
            node.badge = sesiones.length
          }

          // Buscar si este elemento tiene hijos asignados en la tabla
          const hijos = buildTree(item.id, isGroupTwoBlock)
          if (hijos.length > 0) {
            node.children = hijos
            node.type = 'trigger' // Requerido por Nuxt UI v3 para menús desplegables
            node.defaultOpen = true
          }

          return node
        })
    }

    // 3. Separar las dos grandes matrices ([][]) que requiere la maquetación de tu barra lateral
    const grupoUno = buildTree(null, false) // Raíces del bloque superior (Home, Dashboard, Settings...)
    const grupoDos = buildTree(null, true) // Raíces del bloque inferior (Feedback, Help...)

    return [grupoUno, grupoDos]
  } catch (error: any) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }
})
