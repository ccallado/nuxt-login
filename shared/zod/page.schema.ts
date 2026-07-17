/* eslint-disable @stylistic/no-multi-spaces */
// shared/zod/page.schema.ts
import { z } from 'zod'

export const createPageSchema = z.object({
  slug: z.string().min(1).regex(/^[a-zA-Z0-9\-_/]+$/),
  title: z.string().min(1),
  meta: z.object({
    layout: z.string().optional().default('default'),
    middleware: z.array(z.string()).optional().default([])
  }).optional(),
  content: z.object({
    blocks: z.array(
      z.object({
        id: z.string(),
        type: z.enum([
          'form-fields',
          'sap-tabs',
          'stat-cards',  // ◄— NUEVO
          'sap-logs',    // ◄— NUEVO
          'code-viewer',  // ◄— NUEVO
          'dynamic-table' // ◄— NUEVO
        ]),
        title: z.string(),
        description: z.string().optional(),

        // Propiedades opcionales si es un Formulario
        formId: z.string().optional(),
        schemaType: z.string().optional(),
        fields: z.array(
          z.object({
            id: z.string(),
            type: z.string(),
            label: z.string(),
            required: z.boolean().optional()
          })
        ).optional(),

        // Propiedades opcionales si es Gestión SAP
        tableTitle: z.string().optional(),
        assignTitle: z.string().optional(),

        // ◄— CORRECCIÓN NUEVA: Permitir y validar de forma explícita la Tabla Dinámica Universal
        tableName: z.string().optional().default('propiedades'),
        availableColumns: z.array(
          z.object({
            id: z.string(),
            label: z.string(),
            visible: z.boolean().optional().default(true)
          })
        ).optional().default([]),

        // 4. [NUEVO] Propiedades para el panel de Indicadores (stat-cards)
        stats: z.array(
          z.object({
            label: z.string(),
            value: z.string(),
            change: z.string().optional(),
            icon: z.string().optional()
          })
        ).optional().default([]),

        // 5. [NUEVO] Propiedades para el Historial de Auditoría (sap-logs)
        logs: z.array(
          z.object({
            admin: z.string(),
            action: z.string(),
            user: z.string().optional().default('Todos'),
            date: z.string()
          })
        ).optional().default([]),

        code: z.string().optional().default(''),
        apiPut: z.string().optional().default('/api/db/save-form?table=propiedades')

      })
    )
  })
})
