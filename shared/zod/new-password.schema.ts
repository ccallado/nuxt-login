import z from 'zod';

// export const passwordSchema = z.object({
//   current: z.string()
//     .min(8, 'Must be at least 8 characters')
//     .refine((val) => /[A-Z]/.test(val), {error: 'Must contain an uppercase letter' })
//     .refine((val) => /[0-9]/.test(val), {error: 'Must contain a number' })
//     .refine((val) => /[!@#$%^&*()|<>]/.test(val), {error: 'Must contain a special character' }),
//   new1: z.string()
//     .min(8, 'Must be at least 8 characters')
//     .refine((val) => /[A-Z]/.test(val), {error: 'Must contain an uppercase letter' })
//     .refine((val) => /[0-9]/.test(val), {error: 'Must contain a number' })
//     .refine((val) => /[!@#$%^&*()|<>]/.test(val), {error: 'Must contain a special character' })
// })

export const newpasswordSchema = z.object({
  userId: z.number('El Id es numérico'),
  new1: z.string('Se necesita un string')
    .trim()
    .min(6, 'Must be at least 6 characters'),
  new2: z.string('Se necesita un string')
    .trim()
    .min(6, 'Must be at least 6 characters')
}).refine((data) => data.new1 === data.new2, {
  message: 'Las contraseñas no coinciden',
  path: ['new2'] // Apunta el error al campo de confirmación
})

export type NewpasswordSchemaType = z.output<typeof newpasswordSchema>
