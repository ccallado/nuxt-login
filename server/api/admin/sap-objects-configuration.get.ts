// import { db } from '../../utils/db'
import { sapObjectsMaster, sapObjectFields } from '#server/db/schema'

export default defineEventHandler(async (event) => {
  try {
    // 1. Consultar todos los objetos maestros y sus campos relacionales
    const objetos = await db.select().from(sapObjectsMaster)
    const campos = await db.select().from(sapObjectFields)

    // 2. Agrupar los campos dentro de sus respectivos objetos (Formato esperado por tu Vue)
    const estructuraFormateada = objetos.map(obj => {
      // Filtrar los campos que le pertenecen a este objeto técnico
      const camposDelObjeto = campos
        .filter(c => c.objectName === obj.objectName)
        .map(c => c.fieldName)

      // Garantizar que 'ACTVT' siempre esté presente por estándar SAP
      if (!camposDelObjeto.includes('ACTVT')) {
        camposDelObjeto.unshift('ACTVT')
      }

      return {
        objectName: obj.objectName,
        description: obj.description,
        fields: camposDelObjeto // Ej: ['ACTVT', 'BUKRS']
      }
    })

    return estructuraFormateada
  } catch (error: any) {
    throw createError({
      statusCode: 500,
      message: `Error al cargar configuración SAP: ${error.message}`
    })
  }
})
