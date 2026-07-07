import { z } from 'zod';

// Un subconjunto de tus 50 objetos como ejemplo estricto
export const SAP_OBJECTS_ENUM = [
  'S_USER_GRP', // Gestión de usuarios
  'F_BKPF_BUK', // Documentos contables por sociedad
  'M_MATE_WRK', // Gestión de materiales por centro
  'V_VBAK_VKO' // Documentos de ventas por org. de ventas
  // ... añade aquí tus 50 objetos
] as const

// Esquema Zod para validar la estructura de un objeto de autorización
export const AuthorizationObjectSchema = z.object({
  object: z.enum(SAP_OBJECTS_ENUM),
  fields: z.object({
    ACTVT: z.array(z.string()).min(1), // Ej: ['01', '02']
    BUKRS: z.array(z.string()).optional(), // Sociedad
    WERKS: z.array(z.string()).optional(), // Centro
    VKORG: z.array(z.string()).optional() // Org. Ventas
  }).catchall(z.array(z.string())) // Permite campos dinámicos adicionales
})

export type SAPAuthorization = z.infer<typeof AuthorizationObjectSchema>
