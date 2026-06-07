import { pgTable, text, serial, timestamp, integer, unique, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().default(false).notNull(),
  password: text(), // Opcional (para usuarios OAuth)
  avatar: text(),
  nombre: text().notNull().default('vacío'),
  bio: text(),
  createdAt: timestamp().notNull().defaultNow(),
  modifiedAt: timestamp().notNull().defaultNow()
})

export const account = pgTable('account', {
  id: serial().primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  provider: text().notNull(), // "github, "google", "email"
  providerAccountId: text().notNull(), // ID del proveedor (GitHub ID, Google ID, etc)
  emailVerified: boolean().default(false).notNull()
}, (table) => [
  // Esto asegura que la combinación de provider y providerAccountId sea irrepetible
  unique('unique_prov_provaccount').on(table.provider, table.providerAccountId)
])
