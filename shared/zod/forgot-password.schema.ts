import z from 'zod'

export const forgotPasswordSchema = z
  .object({
    email: z.email('Invalid email').trim(),
  })

export type ForgotPasswordSchemaType = z.ifer<typeof forgotPasswordSchema>
