<template>
  <div class="space-y-6">
    <!-- Encabezado -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Campos Técnicos por Objeto SAP
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Configura los filtros organizacionales dinámicos que gobernarán los formularios PFCG.
        </p>
      </div>
      <UButton
        to="/admin/settings/roles"
        color="neutral"
        variant="ghost"
        icon="i-heroicons-arrow-left"
        label="Volver a Roles"
      />
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- PANEL DE REGISTRO (CREATE) -->
      <div class="lg:col-span-1">
        <div class="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl space-y-4 sticky top-6">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon
              name="i-heroicons-plus-circle"
              class="text-primary"
            />
            Asociar Nuevo Campo
          </h3>

          <UForm
            :state="formState"
            class="space-y-4"
            @submit="onCreateField"
          >
            <!-- Selector del Objeto Padre -->
            <UFormField
              label="Objeto SAP Superior"
              required
            >
              <USelectMenu
                v-model="formState.objectName"
                :items="sapObjectsList"
                searchable
                placeholder="Selecciona el objeto maestro..."
              />
            </UFormField>

            <!-- Código Técnico del Campo -->
            <UFormField
              label="Campo Técnico (SAP)"
              required
            >
              <UInput
                v-model="formState.fieldName"
                placeholder="Ej: BUKRS, WERKS, VKORG"
                uppercase
              />
            </UFormField>

            <!-- Descripción funcional -->
            <UFormField
              label="Descripción del Campo"
              required
            >
              <UInput
                v-model="formState.description"
                placeholder="Ej: Sociedad Financiera"
              />
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              block
              icon="i-heroicons-document-plus"
              :loading="isSubmitting"
              label="Registrar en Postgres"
            />
          </UForm>
        </div>
      </div>

      <!-- TABLA DE LISTADO Y BORRADO (READ & DELETE) -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between gap-4">
          <!-- Input de búsqueda local rápida -->
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Filtrar por objeto o campo técnico..."
            class="w-full sm:max-w-xs"
          />
        </div>

        <!-- Estado de carga asíncrona -->
        <div
          v-if="status === 'pending'"
          class="p-10 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin w-6 h-6 mx-auto mb-2 text-primary"
          />
          <p class="text-xs">
            Consultando metadatos relacionales...
          </p>
        </div>

        <!-- Tabla de datos Nuxt UI v3 -->
        <UTable
          v-else
          :data="filteredFields"
          :columns="columns"
          class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
        >
          <!-- Customización visual del Objeto SAP Padre -->
          <template #objectName-cell="{ row }">
            <span class="font-mono font-bold text-primary-600 dark:text-primary-400">
              {{ row.original.objectName }}
            </span>
          </template>

          <!-- Customización del Campo Técnico -->
          <template #fieldName-cell="{ row }">
            <span class="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-800 dark:text-gray-200 text-xs border border-gray-200 dark:border-gray-700">
              {{ row.original.fieldName }}
            </span>
          </template>

          <!-- Botón de acciones avanzadas (Delete) -->
          <template #actions-cell="{ row }">
            <!-- Bloqueamos la eliminación de ACTVT por consistencia e integridad SAP -->
            <UButton
              v-if="row.original.fieldName !== 'ACTVT'"
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              size="sm"
              @click="onDeleteField(row.original.objectName, row.original.fieldName)"
            />
            <span
              v-else
              class="text-xs text-gray-400 italic px-2"
            >
              Protegido
            </span>
          </template>
        </UTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { NuxtError } from '#app'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['ADMIN'],
  autact: ['*'],
  autvar: {}
})

const toast = useToast()
const searchQuery = ref('')
const isSubmitting = ref(false)

// 1. Consumir de forma paralela los campos y la configuración de objetos maestros
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: fieldsData, refresh, status } = await useFetch<any[]>('/api/admin/sap-object-fields')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: sapMasterData } = await useFetch<any[]>('/api/admin/sap-objects-configuration')

// Lista plana de objetos para el selector de alta
const sapObjectsList = computed(() => {
  return sapMasterData.value?.map(item => item.objectName) || []
})

// Columns adaptadas a la especificación de TanStack Table de Nuxt UI v3
const columns = [
  { accessorKey: 'objectName', header: 'Objeto Superior' },
  { accessorKey: 'fieldName', header: 'Campo SAP' },
  { accessorKey: 'description', header: 'Descripción Funcional' },
  { accessorKey: 'actions', header: 'Acciones', class: 'text-right' }
]

// Estado reactivo del formulario
const formState = reactive({
  objectName: '',
  fieldName: '',
  description: ''
})

// Filtrado reactivo del lado del cliente para agilizar la navegación de TI
const filteredFields = computed(() => {
  if (!fieldsData.value) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return fieldsData.value

  return fieldsData.value.filter(f =>
    f.objectName.toLowerCase().includes(query)
    || f.fieldName.toLowerCase().includes(query)
    || f.description.toLowerCase().includes(query)
  )
})

// Guardar registro (POST)
const onCreateField = async () => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/sap-object-fields', {
      method: 'POST',
      body: formState
    })

    toast.add({
      title: 'Success',
      description: `Campo ${formState.fieldName} asociado con éxito a ${formState.objectName}.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    // Resetear formulario manteniendo el último objeto seleccionado para cargas masivas
    formState.fieldName = ''
    formState.description = ''

    refresh()
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText || 'Error al guardar.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// Eliminar registro compuesto (DELETE)
const onDeleteField = async (objectName: string, fieldName: string) => {
  if (!confirm(`¿Estás seguro de que deseas eliminar el campo ${fieldName} del objeto ${objectName}?`)) return

  try {
    await $fetch(`/api/admin/sap-object-fields?objectName=${objectName}&fieldName=${fieldName}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Eliminado',
      description: 'El campo organizacional ha sido removido.',
      icon: 'i-lucide-trash',
      color: 'success'
    })

    refresh()
  } catch (error) {
    const err = error as NuxtError
    console.log(err)
    toast.add({
      title: 'Error',
      description: 'No se pudo eliminar el objeto relacional.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}
</script>
