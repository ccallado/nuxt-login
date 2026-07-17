<!-- eslint-disable vue/html-closing-bracket-newline -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const isSaving = ref(false)
const apiErrors = ref<any>(null)

const pageId = computed(() => route.query.id as string || null)
const isEditing = computed(() => pageId.value !== null)

// Estado Único del Formulario con el Array de Bloques
const formState = reactive({
  slug: '',
  title: '',
  meta: { layout: 'dashboard-layout', middleware: ['authenticated'] },
  content: {
    blocks: [] as any[]
  }
})

// Funciones para añadir bloques con propiedades reactivas inicializadas
const addFormBlock = () => {
  formState.content.blocks.push({
    id: `block_${Date.now()}`,
    type: 'form-fields',
    title: 'Nuevo Formulario',
    description: 'Descripción del formulario',
    formId: 'dynamic-form',
    schemaType: 'profile',
    fields: [{ id: 'name', type: 'text', label: 'Nombre', required: true }]
  })
}

const addSapBlock = () => {
  formState.content.blocks.push({
    id: `block_${Date.now()}`,
    type: 'sap-tabs',
    title: 'Gestión de Autorizaciones SAP',
    description: 'Administración de perfiles técnicos.',
    tableTitle: 'Perfiles Existentes',
    assignTitle: 'Maestro de Usuarios (SU01)'
  })
}

// NUEVO: Crea el bloque asegurando que 'tableName' y el array de columnas existan desde el segundo cero
const addDynamicTableBlock = () => {
  formState.content.blocks.push({
    id: `block_${Date.now()}`,
    type: 'dynamic-table',
    title: 'Nuevo Listado Dinámico',
    description: 'Listado con selección de columnas en tiempo real.',
    tableName: 'propiedades', // ◄— Valor por defecto reactivo obligatorio para Postgres
    availableColumns: [
      { id: 'id', label: 'ID Registro', visible: true } // ◄— Array inicializado obligatorio
    ]
  })
}

// CORRECCIÓN CLAVE: Acceso seguro mediante el índice del array reactivo de formState
const addColumnToTableBlock = (blockIndex: number) => {
  if (!formState.content.blocks[blockIndex].availableColumns) {
    formState.content.blocks[blockIndex].availableColumns = []
  }
  formState.content.blocks[blockIndex].availableColumns.push({
    id: `col_${Date.now()}`,
    label: 'Nueva Columna',
    visible: true
  })
}

const removeColumnFromTableBlock = (blockIndex: number, colIndex: number) => {
  formState.content.blocks[blockIndex].availableColumns.splice(colIndex, 1)
}

const removeBlock = (index: number) => {
  formState.content.blocks.splice(index, 1)
}

// Cargar desde PostgreSQL respetando el nuevo esquema unificado
onMounted(async () => {
  if (isEditing.value) {
    try {
      const pageData = await $fetch<any>(`/api/pages/by-id/${pageId.value}`)
      if (pageData) {
        formState.slug = pageData.slug
        formState.title = pageData.title
        if (pageData.meta) formState.meta = { ...pageData.meta }

        if (pageData.content?.blocks) {
          formState.content.blocks = [...pageData.content.blocks]

          // Asegurar que si algún bloque dinámico en la BD no tiene los campos nuevos, se inicialicen en el cliente
          formState.content.blocks.forEach((block) => {
            if (block.type === 'dynamic-table') {
              if (block.tableName === undefined) block.tableName = 'propiedades'
              if (!block.availableColumns) block.availableColumns = [{ id: 'id', label: 'ID Registro', visible: true }]
            }
          })
        }
      }
    } catch (error) {
      toast.add({ title: 'Error', description: 'No se pudo cargar la interfaz.', color: 'error' })
    }
  }
})

const finalPayload = computed(() => formState)

// Dentro de la función handlePublishPage() en pages/admin/page-creator.vue
async function handlePublishPage() {
  isSaving.value = true
  apiErrors.value = null

  // Forzamos el uso de la subcarpeta sin conflictos de comodines
  const url = isEditing.value ? `/api/pages/by-id/${pageId.value}` : '/api/pages/create'
  const method = isEditing.value ? 'PUT' : 'POST'

  try {
    await $fetch(url, {
      method: method,
      // Enviamos directamente el árbol reactivo para que no se pierdan subpropiedades
      body: {
        slug: formState.slug,
        title: formState.title,
        meta: { ...formState.meta },
        content: {
          blocks: formState.content.blocks // Mapeamos el array de bloques editados con sus columnas
        }
      }
    })

    toast.add({
      title: isEditing.value ? '¡Cambios Guardados!' : '¡Página Creada!',
      description: 'La estructura se persistió correctamente en PostgreSQL.',
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })

    if (!isEditing.value) router.push('/admin/pages-list')
  } catch (error: any) {
    if (error.data) apiErrors.value = error.data
    toast.add({ title: 'Error al grabar', description: error.message || 'El servidor rechazó la operación.', color: 'error' })
  } finally {
    isSaving.value = false
  }
}
</script>

<!-- pages/admin/page-creator.vue - TEMPLATE CORREGIDO -->
<template>
  <ClientOnly>
    <div class="h-full w-full overflow-y-auto bg-gray-50 dark:bg-gray-950/20">
      <div class="p-6 max-w-7xl mx-auto space-y-6 pb-24">
        <!-- Encabezado del Creador -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200 dark:border-gray-800 pb-4 gap-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon
                name="i-heroicons-cpu-chip"
                class="text-primary-500"
              />
              {{ isEditing ? 'Modificar Interfaz JSON-DB' : 'Programa Conversor: UI a JSON-DB' }}
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Diseña interfaces de forma visual. El programa generará el JSON estructurado y lo persistirá en Postgres.
            </p>
          </div>
          <UButton
            color="primary"
            icon="i-heroicons-cloud-arrow-up"
            size="lg"
            :loading="isSaving"
            :label="isEditing ? 'Actualizar Cambios en BD' : 'Guardar Nueva Página en BD'"
            class="w-full sm:w-auto justify-center"
            @click="handlePublishPage"
          />
        </div>

        <!-- Alerta de Errores de Validación -->
        <UAlert
          v-if="apiErrors"
          icon="i-heroicons-exclamation-triangle"
          color="error"
          variant="soft"
          title="El servidor rechazó el JSON"
          description="Revisa los campos marcados en rojo. La estructura no coincide con las reglas del backend."
          class="mb-4"
        />

        <!-- Cuadrícula Principal Adaptativa -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- COLUMNA IZQUIERDA: CONTROLES DE CONFIGURACIÓN -->
          <div class="lg:col-span-7 space-y-6">
            <!-- Parámetros de Ruta -->
            <UCard>
              <template #header>
                <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon name="i-heroicons-link" /> Parámetros Obligatorios (Ruta y Metadatos)
                </h3>
              </template>
              <div class="space-y-4">
                <UFormField
                  label="Slug de la Página (URL de acceso)"
                  required
                >
                  <UInput
                    v-model="formState.slug"
                    placeholder="ej: user/profile"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  label="Título Interno de la Página"
                  required
                >
                  <UInput
                    v-model="formState.title"
                    placeholder="ej: Tabla de Lenguetas"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>

            <!-- Card de Componentes Inyectados -->
            <UCard>
              <template #header>
                <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full">
                  <div class="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
                    <UIcon
                      name="i-heroicons-rectangle-group"
                      class="text-xl text-gray-400"
                    />
                    <h3 class="font-semibold text-gray-900 dark:text-white">
                      Componentes de la Interfaz
                    </h3>
                  </div>
                  <div class="flex flex-wrap gap-2 items-center w-full">
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Formulario"
                      @click="addFormBlock"
                    />
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Gestión SAP"
                      @click="addSapBlock"
                    />
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Tabla Dinámica"
                      @click="addDynamicTableBlock"
                    />
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Métricas"
                      @click="addStatBlock"
                    />
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Auditoría"
                      @click="addLogsBlock"
                    />
                    <UButton
                      color="primary"
                      size="sm"
                      icon="i-heroicons-plus"
                      label="Visor Código"
                      @click="addCodeBlock"
                    />
                  </div>
                </div>
              </template>

              <!-- Mensaje si el array de bloques está vacío -->
              <div
                v-if="formState.content.blocks.length === 0"
                class="p-6 text-center text-gray-400 text-xs italic"
              >
                No hay bloques añadidos en esta página. Pulsa un botón superior para inyectar componentes.
              </div>

              <!-- BUCLE DE BLOQUES UNIFICADOS -->
              <div
                v-for="(block, bIndex) in formState.content.blocks"
                :key="block.id"
                class="space-y-4 mb-4 border border-gray-200 dark:border-gray-800 rounded-xl p-4 bg-gray-50/50 dark:bg-gray-900/30"
              >
                <div class="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-2">
                  <span class="text-sm font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <!-- Mapeo dinámico de iconos según el tipo de bloque real -->
                    <UIcon
                      :name="
                        block.type === 'form-fields' ? 'i-heroicons-pencil-square' :
                        block.type === 'sap-tabs' ? 'i-heroicons-table-cells' :
                        block.type === 'stat-cards' ? 'i-heroicons-chart-bar' :
                        block.type === 'sap-logs' ? 'i-heroicons-clock' :
                        block.type === 'code-viewer' ? 'i-heroicons-code-bracket' :
                        'i-heroicons-circle-stack'
                      "
                    />
                    <!-- Mapeo dinámico del título del bloque real -->
                    Bloque #{{ bIndex + 1 }}: {{
                      block.type === 'form-fields' ? 'Formulario' :
                      block.type === 'sap-tabs' ? 'Gestión SAP' :
                      block.type === 'stat-cards' ? 'Métricas / KPIs' :
                      block.type === 'sap-logs' ? 'Historial de Auditoría' :
                      block.type === 'code-viewer' ? 'Visor de Código' : 'Tabla Dinámica Universal'
                    }}
                  </span>
                  <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs" label="Quitar" @click="removeBlock(bIndex)" />
                </div>

                <div class="space-y-3 pt-2">
                  <UFormField label="Título del Bloque">
                    <UInput
                      v-model="block.title"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField label="Descripción / Subtítulo">
                    <UInput
                      v-model="block.description"
                      class="w-full"
                    />
                  </UFormField>

                  <!-- CONFIGURACIÓN ESPECÍFICA: TABLA DINÁMICA -->
                  <div
                    v-if="block.type === 'dynamic-table'"
                    class="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-3"
                  >
                    <UFormField
                      label="Nombre de la Tabla en PostgreSQL"
                      required
                    >
                      <UInput
                        v-model="block.tableName"
                        placeholder="ej: propiedades"
                        icon="i-heroicons-circle-stack"
                        class="w-full"
                      />
                    </UFormField>
                    <div class="space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Definir Columnas de la Tabla:</span>
                        <UButton
                          icon="i-heroicons-plus"
                          size="xs"
                          variant="subtle"
                          label="Añadir Columna"
                          @click="addColumnToTableBlock(bIndex)"
                        />
                      </div>

                      <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <div
                          v-for="(col, cIdx) in block.availableColumns || []"
                          :key="cIdx"
                          class="flex gap-2 items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <UInput
                            v-model="col.id"
                            placeholder="ID campo en BD (ej: email)"
                            size="sm"
                            class="w-1/3"
                          />
                          <UInput
                            v-model="col.label"
                            placeholder="Título cabecera (ej: Correo)"
                            size="sm"
                            class="w-2/3"
                          />
                          <UCheckbox
                            v-model="col.visible"
                            label="Visible"
                          />
                          <UButton
                            icon="i-heroicons-x-mark"
                            color="error"
                            variant="ghost"
                            size="xs"
                            @click="removeColumnFromTableBlock(bIndex, cIdx)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- CONFIGURACIÓN ESPECÍFICA: GESTIÓN SAP -->
                  <div
                    v-if="block.type === 'sap-tabs'"
                    class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3"
                  >
                    <UFormField label="Etiqueta Tabla (Pestaña 1)">
                      <UInput
                        v-model="block.tableTitle"
                        class="w-full"
                      />
                    </UFormField>
                    <UFormField label="Etiqueta Maestro SU01 (Pestaña 2)">
                      <UInput
                        v-model="block.assignTitle"
                        class="w-full"
                      />
                    </UFormField>
                  </div>

                  <!-- CONFIGURACIÓN ESPECÍFICA: FORMULARIO (CORREGIDA Y COMPLETA) -->
                  <div v-if="block.type === 'form-fields'" class="space-y-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <!-- Fila 1: Parámetros técnicos del formulario -->
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <UFormField label="ID Formulario Vue">
                        <UInput v-model="block.formId" class="w-full" />
                      </UFormField>
                      <UFormField label="Validación (Zod)">
                        <UInput v-model="block.schemaType" class="w-full" />
                      </UFormField>
                      <UFormField label="Ruta de Almacenamiento (API)">
                        <UInput v-model="block.apiPut" placeholder="ej: /api/db/save-form?table=propiedades" class="w-full" />
                      </UFormField>
                    </div>

                    <!-- Fila 2: Gestor dinámico para añadir/quitar campos del formulario -->
                    <div class="space-y-2 pt-2">
                      <div class="flex justify-between items-center">
                        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Campos del Formulario:</span>
                        <!-- Botón restaurado para añadir nuevos inputs a este formulario específico -->
                        <UButton
                          icon="i-heroicons-plus"
                          size="xs"
                          variant="subtle"
                          label="Añadir Campo"
                          @click="() => {
                            if (!block.fields) block.fields = []
                            block.fields.push({ id: `campo_${Date.now()}`, type: 'text', label: 'Nuevo Campo', required: false })
                          }"
                        />
                      </div>

                      <!-- Bucle para renderizar cada campo añadido -->
                      <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <div
                          v-for="(field, fIdx) in block.fields || []"
                          :key="fIdx"
                          class="flex flex-col sm:flex-row gap-2 items-center bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800"
                        >
                          <!-- ID Técnico en la Base de Datos (ej: calle, numero) -->
                          <UInput v-model="field.id" placeholder="ID campo (ej: precio)" size="sm" class="w-full sm:w-1/3" />

                          <!-- Etiqueta visual para el usuario final -->
                          <UInput v-model="field.label" placeholder="Etiqueta (ej: Precio Venta)" size="sm" class="w-full sm:w-1/3" />

                          <!-- Tipo de Input (text, email, number, textarea...) -->
                          <USelectMenu
                            v-model="field.type"
                            :items="['text', 'number', 'email', 'textarea']"
                            size="sm"
                            class="w-full sm:w-1/4"
                          />

                          <!-- Checkbox de Obligatorio -->
                          <UCheckbox v-model="field.required" label="Req." class="mx-1" />

                          <!-- Botón para quitar este campo específico -->
                          <UButton
                            icon="i-heroicons-x-mark"
                            color="error"
                            variant="ghost"
                            size="xs"
                            @click="block.fields.splice(fIdx, 1)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- [NUEVO] SUBFORMULARIO EDITABLE: PANEL DE INDICADORES (stat-cards) -->
                  <div v-if="block.type === 'stat-cards'" class="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p class="text-xs text-gray-400 italic">Modifica los valores del panel de indicadores (KPIs):</p>
                    <div v-for="(stat, sIdx) in block.stats || []" :key="sIdx" class="flex flex-col sm:flex-row gap-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                      <UInput v-model="stat.label" placeholder="Nombre Métrica" size="sm" class="w-full sm:w-1/3" />
                      <UInput v-model="stat.value" placeholder="Valor numérico" size="sm" class="w-full sm:w-1/3" />
                      <UInput v-model="stat.change" placeholder="Tendencia (ej: +4%)" size="sm" class="w-full sm:w-1/3" />
                    </div>
                  </div>

                  <!-- [NUEVO] SUBFORMULARIO EDITABLE: TIMELINE DE AUDITORÍA (sap-logs) -->
                  <div v-if="block.type === 'sap-logs'" class="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <p class="text-xs text-gray-400 italic">Configura las filas del historial de auditoría técnica:</p>
                    <div v-for="(log, lIdx) in block.logs || []" :key="lIdx" class="space-y-2 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                      <div class="grid grid-cols-2 gap-2">
                        <UFormField label="Usuario Ejecutor"><UInput v-model="log.admin" size="sm" /></UFormField>
                        <UFormField label="Marca de Tiempo"><UInput v-model="log.date" size="sm" /></UFormField>
                      </div>
                      <UFormField label="Acción técnica realizada o incidente"><UInput v-model="log.action" size="sm" /></UFormField>
                    </div>
                  </div>

                  <!-- [NUEVO] SUBFORMULARIO EDITABLE: VISOR DE CÓDIGO TÉCNICO (code-viewer) -->
                  <div v-if="block.type === 'code-viewer'" class="space-y-3 border-t border-gray-100 dark:border-gray-800 pt-3">
                    <UFormField label="Escribe tu código técnico o texto plano (ABAP / Parámetros):">
                      <UTextarea v-model="block.code" :rows="5" class="font-mono text-xs w-full bg-gray-950 text-amber-400" />
                    </UFormField>
                  </div>
                </div>
              </div>
            </UCard>
          </div>

          <!-- COLUMNA DERECHA: INSPECTOR JSON -->
          <div class="lg:col-span-5 space-y-4 h-auto lg:max-h-screen">
            <div class="flex items-center justify-between px-2">
              <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <UIcon
                  name="i-heroicons-code-bracket"
                  class="text-emerald-500"
                />
                JSON Estructurado Saliente
              </span>
              <span class="text-xs font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500">Validado por Zod</span>
            </div>
            <div class="bg-gray-950 rounded-2xl border border-gray-800 p-4 font-mono text-xs overflow-auto text-emerald-400 h-96 lg:h-[65vh] shadow-inner shadow-black">
              <pre>{{ JSON.stringify(finalPayload, null, 2) }}</pre>
            </div>
            <p class="text-[11px] text-gray-400 text-center px-4">
              Este JSON se guardará íntegro en la columna <code class="text-primary-500 font-mono">content</code> de PostgreSQL.
            </p>
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>
