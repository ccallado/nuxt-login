import { z } from 'zod'
import { SAP_OBJECTS_ENUM } from './sap-schema' // El array de tus 50 objetos

export const masterRoleFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .regex(/^Z_[A-Z0-9_]+$/, 'Debe seguir la nomenclatura SAP (Ej: Z_CONTADOR_GRAL)'),
  description: z.string().min(5, 'La descripción es obligatoria'),
  authorizations: z.array(
    z.object({
      object: z.enum(SAP_OBJECTS_ENUM, {
        errorMap: () => ({ message: 'Selecciona un objeto válido' })
      }),
      fields: z.object({
        ACTVT: z.array(z.string()).min(1, 'Debes asignar al menos una actividad (Ej: 01, 03, *)'),
        BUKRS: z.array(z.string()).optional(), // Sociedades
        WERKS: z.array(z.string()).optional()  // Centros
      })
    })
  ).min(1, 'El rol maestro debe contener al menos un objeto de autorización')
})

export type MasterRoleForm = z.infer<typeof masterRoleFormSchema>
