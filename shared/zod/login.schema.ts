import z from 'zod'

export const loginSchema = z
  .object({
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters')
  })

export const loginSchemaConf = z
  .object({
    email: z.email('Invalid email'),
    password: z.string('Password is required').min(8, 'Must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'] // Apunta el error directamente al campo de confirmación
  })

export type LoginSchemaType = z.output<typeof loginSchema>
export type LoginSchemaConfType = z.output<typeof loginSchemaConf>
