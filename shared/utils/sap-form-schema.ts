import { z } from 'zod'

export const masterRoleFormSchema = z.object({
  name: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .regex(/^Z_[A-Z0-9_]+$/, 'Debe seguir la nomenclatura SAP (Ej: Z_CONTADOR_GRAL)'),

  description: z.string()
    .min(5, 'La descripción es obligatoria'),

  authorizations: z.array(
    z.object({
      // 👑 DINÁMICO: Ya no depende de un enum hardcodeado, acepta cualquier objeto del maestro
      object: z.string().min(1, 'Selecciona un objeto válido'),

      // 👑 DINÁMICO: Permite mapear de forma flexible cualquier campo técnico (ACTVT, BUKRS, WERKS, etc.)
      fields: z.record(
        z.string(),          // Nombre técnico del campo (clave del objeto)
        z.array(z.string())  // Los tags/valores introducidos por el usuario siempre viajan en arrays
      ).refine((fields) => {
        // Regla de oro SAP: El campo ACTVT siempre debe existir y tener al menos un valor
        return 'ACTVT' in fields && Array.isArray(fields.ACTVT) && fields.ACTVT.length > 0
      }, {
        message: 'Debes asignar al menos una actividad (ACTVT) obligatoria (Ej: 01, 03, *)',
        // Apunta el mensaje de error directamente a la sección de actividades
        path: ['ACTVT']
      })
    })
  ).min(1, 'El rol maestro debe contener al menos un objeto de autorización')
})

export type MasterRoleForm = z.infer<typeof masterRoleFormSchema>
