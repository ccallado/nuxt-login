import z from 'zod'

export const loginSchema = z.object({
  email: z.email('Invalid email'),
  password: z.string('Password is required').min(8, 'Must be at least 8 characters')
})

export type LoginSchemaType = z.output<typeof loginSchema>
