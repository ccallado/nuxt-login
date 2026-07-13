import { z } from 'zod'

// Esquema Zod Dinámico: Ya no depende de un enum hardcodeado
export const DynamicAuthorizationSchema = z.object({
  // Admite cualquier objeto SAP insertado en tu base de datos
  object: z.string().min(1),

  // Fuerza a que 'fields' sea un objeto dinámico donde cada clave
  // (sea ACTVT, BUKRS, o cualquier otra) contenga obligatoriamente un array de strings
  fields: z.record(
    z.string(), // Nombre del campo técnico (ej: 'BUKRS')
    z.array(z.string()) // Valores autorizados (ej: ['1000', '2000'] o ['*'])
  ).refine((fields) => {
    // Validación de negocio: Todo objeto de autorización SAP debe tener al menos la actividad (ACTVT)
    return 'ACTVT' in fields && Array.isArray(fields.ACTVT) && fields.ACTVT.length > 0
  }, {
    message: 'El campo "ACTVT" es obligatorio y debe contener al menos una actividad.'
  })
})

// Tipado inferido idéntico para que no rompa tu backend ni tu frontend
export type SAPAuthorization = z.infer<typeof DynamicAuthorizationSchema>
