import z from 'zod';

export const profileSchema = z.object({
  username: z.string().trim().min(2, 'Too short').max(100, 'Máximo de 100').lowercase(),
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Too short'),
  avatar: z.string().optional(),
  bio: z.string().optional()
})

export type ProfileSchemaType = z.output<typeof profileSchema>
