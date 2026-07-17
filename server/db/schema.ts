/* eslint-disable @stylistic/no-multi-spaces */
// import { sql } from 'drizzle-orm'
import {
  pgTable, text, serial, timestamp, integer, unique, boolean, primaryKey, uuid, varchar, jsonb
} from 'drizzle-orm/pg-core'
import type { SAPAuthorization } from '#shared/utils/sap-schema'

// Definición de roles válidos
export const rolesEnum = ['user', 'editor', 'admin'] as const

// 1. Maestro de usuarios
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
  authUpdatedAt: timestamp('auth_updated_at').defaultNow().notNull()
})

// 2. Tabla de cuentas de un email (ej: 'google', 'github', 'email')
export const account = pgTable('account', {
  id: serial().primaryKey(),
  userId: integer('user_id').references(() => users.id).notNull(),
  provider: text().notNull(), // "github, "google", "email"
  providerAccountId: text().notNull(), // ID del proveedor (GitHub ID, Google ID, etc)
  emailVerified: boolean().default(false).notNull()
}, table => [
  // Esto asegura que la combinación de provider y providerAccountId sea irrepetible
  unique('unique_prov_provaccount').on(table.provider, table.providerAccountId)
])

// 3. Maestro de Objetos SAP (ej: 'F_BKPF_BUK', 'M_MATE_WRK')
export const sapObjectsMaster = pgTable('sap_objects_master', {
  objectName: text('object_name').primaryKey(), // Ej: 'F_BKPF_BUK'
  description: text('description').notNull()
})

// 4. Definición de campos por cada objeto (Relación 1 a Muchos)
// Esto define qué campos técnicos específicos pertenecen a cada objeto
export const sapObjectFields = pgTable('sap_object_fields', {
  objectName: text('object_name')
    .notNull()
    .references(() => sapObjectsMaster.objectName, { onDelete: 'cascade' }),
  fieldName: text('field_name').notNull(), // Ej: 'ACTVT', 'BUKRS', 'WERKS'
  description: text('description').notNull()
}, table => [
  // Clave primaria compuesta para evitar duplicados del mismo campo en el mismo objeto
  primaryKey({ columns: [table.objectName, table.fieldName] })
])

// 5. Tabla de Roles Maestros (Ej: "Z_CONTADOR_GENERAL", "Z_GESTOR_COMPRAS")
export const masterRoles = pgTable('master_roles', {
  name: text('name').primaryKey(), // El nombre del rol es el identificador único (estilo SAP)
  description: text('description').notNull(),
  // Almacena la colección de objetos de autorización asignados a este rol
  authorizations: text('authorizations')
    .$type<SAPAuthorization[]>()
    .notNull()
})

// 6. Tabla Intermedia: Relación Muchos a Muchos (Usuario tiene N Roles Maestros)
export const usersToRoles = pgTable('users_to_roles', {
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  roleName: text('role_name').notNull().references(() => masterRoles.name, { onDelete: 'cascade' })
}, table => ({
  pk: primaryKey({ columns: [table.userId, table.roleName] })
}))

// 7. Tabla de Sesiones: Controlo a los usuarios que están logados
export const userSessions = pgTable('user_sessions', {
  id: text('id').primaryKey(), // UUID único de la sesión de este navegador
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  device: text('device').notNull(), // User-Agent (Chrome, Safari, etc.)
  ipAddress: text('ip_address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  modifiedAt: timestamp('modified_at').defaultNow().notNull()
})

// 8. Tabla de menu de navegación
export const navigationMenu = pgTable('navigation_menu', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(), // ID Autoincremental nativo
  etiqueta: text('etiqueta').notNull(),                             // Título visible (Ej: 'Sesiones')
  icon: text('icon'),                                         // Icono (Ej: 'i-lucide-settings')
  direccion: text('direccion'),                                             // Ruta de Nuxt (Ej: '/admin/settings')

  // 🔐 Seguridad SAP integrada por fila
  objReq: text('obj_req'),                                    // Objeto SAP requerido (Ej: 'ADMIN')
  actReq: text('act_req'),                                    // Actividad requerida (Ej: '01')
  varReq: text('var_req'),                                    // Filtro de variables organizacionales

  // 📁 Configuración estructural de Nuxt UI v3
  parentId: integer('parent_id'),                             // Permite colgar este ítem dentro de un padre
  isGroupTwo: boolean('is_group_two').default(false).notNull(), // true para mandarlo al bloque de abajo (Feedback/Help)
  displayOrder: integer('display_order').default(0).notNull() // Orden de aparición visual en la barra lateral
})

// 9. Tabla de definición de Páginas
export const pages = pgTable('pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  // NUEVA COLUMNA: Metadatos nativos para el core de Nuxt y Seguridad SAP
  meta: jsonb('meta').$type<{
    middleware?: string[]
    layout?: string
    autobj?: string[]
    autact?: string[]
    autvar?: Record<string, any>
  }>(),
  // Almacenará la configuración de las pestañas, textos, botones y rutas
  content: jsonb('content').$type<{
    header: { title: string, description: string }
    tabs: { slot: string, label: string, icon?: string }[]
    tableTab: {
      title: string
      btnObjectsLabel: string
      btnObjectsTo: string
      btnCreateLabel: string
      btnCreateTo: string
      btnActionLabel: string
    }
    assignTab: {
      title: string
      btnAssignLabel: string
      formTitle: string
      formSelectLabel: string
      formPlaceholder: string
      btnSaveLabel: string
      btnCancelLabel: string
      placeholderText: string
    }
  }>().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// 10. Tabla de propiedades
export const propiedades = pgTable('propiedades', {
  // Genera un UUID automático y único en PostgreSQL
  id: uuid('id').defaultRandom().primaryKey(),
  calle: text('calle').notNull(),
  numero: text('numero'),
  escalera: text('escalera'),
  planta: text('planta'),
  letra: text('letra'),
  descripcion: text('descripcion').notNull(),
  propietarioId: integer('propietarioId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp().notNull().defaultNow(),
  creadaPorId: integer('creadaPorId').notNull().references(() => users.id, { onDelete: 'cascade' }),
  modifiedAt: timestamp().notNull().defaultNow(),
  modificadoPorId: integer('modificadoPorId').notNull().references(() => users.id, { onDelete: 'cascade' })
})
