import { sql } from 'drizzle-orm'
import { pgTable, text, serial, timestamp, integer, unique, boolean, primaryKey, uuid } from 'drizzle-orm/pg-core'
import type { SAPAuthorization } from '#shared/utils/sap-schema'

// Definición de roles válidos
export const rolesEnum = ['user', 'editor', 'admin'] as const

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
  modifiedAt: timestamp().notNull().defaultNow(),
  role: text('role', { enum: rolesEnum })
    .array() // 👈 Transforma el campo en un array nativo (text[])
    .notNull()
    .default(sql`ARRAY['user']::text[]`)
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

// 2. Tabla de Roles Maestros (Ej: "Z_CONTADOR_GENERAL", "Z_GESTOR_COMPRAS")
export const masterRoles = pgTable('master_roles', {
  name: text('name').primaryKey(), // El nombre del rol es el identificador único (estilo SAP)
  description: text('description').notNull(),
  // Almacena la colección de objetos de autorización asignados a este rol
  authorizations: text('authorizations')
    .$type<SAPAuthorization[]>()
    .notNull()
})

// 3. Tabla Intermedia: Relación Muchos a Muchos (Usuario tiene N Roles Maestros)
export const usersToRoles = pgTable('users_to_roles', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleName: text('role_name').notNull().references(() => masterRoles.name, { onDelete: 'cascade' })
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleName] }),
}))

// Tabla de propiedades
export const propiedades = pgTable('propiedades', {
  // Genera un UUID automático y único en PostgreSQL
  id: uuid('id').defaultRandom().primaryKey(),
  calle: text('calle').notNull(),
  numero: text('número'),
  escalera: text('escalera'),
  planta: text('planta'),
  letra: text('letra'),
  descripcion: text('descripción').notNull(),
  propietarioId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp().notNull().defaultNow(),
  creadaPorId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  modifiedAt: timestamp().notNull().defaultNow(),
  modificadoPorId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
})
