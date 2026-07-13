<template>
  <div class="space-y-6">
    <!-- Encabezado Principal -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Diccionario de Objetos SAP
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          CRUD estructural del maestro de autorizaciones y asignación directa de campos relacionales.
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
      <!-- COLUMNA 1 Y 2: LISTADO DE OBJETOS REGISTRADOS -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between">
          <UInput
            v-model="searchQuery"
            icon="i-heroicons-magnifying-glass"
            placeholder="Buscar objeto SAP (Ej: F_BKPF)..."
            class="w-full sm:max-w-xs"
          />
          <UButton
            color="primary"
            icon="i-heroicons-plus"
            label="Nuevo Objeto Superior"
            @click="initNewObjectForm"
          />
        </div>

        <div
          v-if="status === 'pending'"
          class="p-10 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl"
        >
          <UIcon
            name="i-heroicons-arrow-path"
            class="animate-spin w-6 h-6 mx-auto mb-2 text-primary"
          />
          <p
            class="text-xs"
          >
            Sincronizando diccionario de datos con Postgres...
          </p>
        </div>

        <!-- Tabla Maestra Nuxt UI v3 -->
        <UTable
          v-else
          :data="filteredObjects"
          :columns="columns"
          class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
        >
          <template #objectName-cell="{ row }">
            <span class="font-mono font-bold text-primary-600 dark:text-primary-400">{{ row.original.objectName }}</span>
          </template>

          <template #campos-cell="{ row }">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="c in row.original.campos"
                :key="c.fieldName"
                class="px-1.5 py-0.5 font-mono text-[10px] rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
              >
                {{ c.fieldName }}
              </span>
            </div>
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="sm"
                @click="selectObjectForEdit(row.original)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                size="sm"
                @click="onDeleteObject(row.original.objectName)"
              />
            </div>
          </template>
        </UTable>
      </div>

      <!-- COLUMNA 3: PANEL DINÁMICO LATERAL (MANTENEDOR INTEGRADO) -->
      <div class="lg:col-span-1">
        <div class="p-5 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-2xl space-y-5 sticky top-6">
          <!-- Título Dinámico según el estado -->
          <div>
            <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon
                :name="isEditing ? 'i-heroicons-pencil' : 'i-heroicons-plus-circle'"
                class="text-primary"
              />
              {{ isEditing ? `Gestionar: ${objectForm.objectName}` : 'Registrar Objeto SAP' }}
            </h3>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ isEditing ? 'Modifica propiedades y asignación de campos técnicos.' : 'Añade una nueva clase superior a la BD.' }}
            </p>
          </div>

          <!-- BLOQUE A: FORMULARIO DEL OBJETO PADRE -->
          <UForm
            :state="objectForm"
            class="space-y-4"
            @submit="onSaveObject"
          >
            <UFormField
              label="Código Técnico del Objeto"
              required
            >
              <UInput
                v-model="objectForm.objectName"
                placeholder="Ej: S_USER_GRP"
                :disabled="isEditing"
                uppercase
              />
            </UFormField>

            <UFormField
              label="Descripción del Objeto"
              required
            >
              <UInput
                v-model="objectForm.description"
                placeholder="Ej: Contabilidad de Sociedades"
              />
            </UFormField>

            <UButton
              type="submit"
              color="primary"
              block
              :loading="isSubmitting"
              :label="isEditing ? 'Actualizar Encabezado' : 'Guardar en Base de Datos'"
            />
          </UForm>

          <!-- BLOQUE B: SUB-CRUD DE CAMPOS TÉCNICOS (SOLO EN MODO EDICIÓN) -->
          <div
            v-if="isEditing"
            class="border-t border-gray-100 dark:border-gray-800 pt-4 space-y-4"
          >
            <h4 class="text-xs font-bold uppercase tracking-wider text-gray-500">
              Campos Técnicos Asignados
            </h4>

            <!-- Mini Formulario de Alta Rápida de Campo Hijo -->
            <div class="flex gap-2">
              <UInput
                v-model="newFieldName"
                placeholder="CAMPO (Ej: BUKRS)"
                class="flex-1 font-mono"
                uppercase
                size="sm"
              />
              <UButton
                color="neutral"
                variant="subtle"
                icon="i-heroicons-plus"
                size="sm"
                @click="onAddSubField"
              />
            </div>

            <!-- Listado Local de Campos del Objeto con Borrado Dinámico -->
            <div class="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto bg-gray-50/50 dark:bg-gray-800/30">
              <div
                v-for="c in selectedObjectFields"
                :key="c.fieldName"
                class="p-2 flex items-center justify-between text-xs font-mono"
              >
                <span class="font-bold text-gray-700 dark:text-gray-300">{{ c.fieldName }}</span>
                <UButton
                  v-if="c.fieldName !== 'ACTVT'"
                  color="error"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  @click="onDeleteSubField(c.fieldName)"
                />

                <span
                  v-else
                  class="text-[10px] text-primary italic px-1"
                >
                  Fijo
                </span>
              </div>
            </div>
          </div>
        </div>
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
const isEditing = ref(false)
const isSubmitting = ref(false)
const newFieldName = ref('')

// 1. Cargar la estructura unificada (Padre con sus Arrays Hijos)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: objectsData, refresh, status } = await useFetch<any[]>('/api/admin/sap-objects-master')

const columns = [
  { accessorKey: 'objectName', header: 'Objeto Superior' },
  { accessorKey: 'description', header: 'Descripción' },
  { accessorKey: 'campos', header: 'Campos Técnicos Registrados' },
  { accessorKey: 'actions', header: 'Acciones', class: 'text-right' }
]

// Estado reactivo del formulario principal
const objectForm = reactive({
  objectName: '',
  description: ''
})

// Buscador reactivo en cliente
const filteredObjects = computed(() => {
  if (!objectsData.value) return []
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return objectsData.value

  return objectsData.value.filter(o =>
    o.objectName.toLowerCase().includes(query)
    || o.description.toLowerCase().includes(query)
  )
})

// Retorna los campos del objeto que tenemos cargado actualmente en edición
const selectedObjectFields = computed(() => {
  if (!isEditing.value) return []
  const current = objectsData.value?.find(o => o.objectName === objectForm.objectName)
  return current?.campos || []
})

// Inicializar el formulario para un alta limpia
const initNewObjectForm = () => {
  isEditing.value = false
  objectForm.objectName = ''
  objectForm.description = ''
}

// Cargar un objeto existente en el panel derecho para edición y manejo de campos
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectObjectForEdit = (objeto: any) => {
  isEditing.value = true
  objectForm.objectName = objeto.objectName
  objectForm.description = objeto.description
}

// OPERACIÓN 1: Guardar Objeto Superior (POST)
const onSaveObject = async () => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/sap-objects-master', {
      method: 'POST',
      body: { ...objectForm, isEditing: isEditing.value }
    })

    toast.add({
      title: 'Catálogo Actualizado',
      description: `El objeto ${objectForm.objectName} se procesó de forma correcta.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    if (!isEditing.value) initNewObjectForm()
    refresh()
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText || 'Error en la petición.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

// OPERACIÓN 2: Eliminar Objeto Completo (DELETE)
const onDeleteObject = async (name: string) => {
  if (!confirm(`¿Eliminar ${name}? Esto borrará en cascada todas sus asignaciones de campos.`)) return

  try {
    await $fetch(`/api/admin/sap-objects-master?objectName=${name}`, { method: 'DELETE' })
    toast.add({
      title: 'Objeto Eliminado',
      description: 'Se removió ${name} del sistema.',
      icon: 'i-lucide-trash',
      color: 'success'
    })
    if (objectForm.objectName === name)
      initNewObjectForm()
    refresh()
  } catch (error) {
    console.log(error)
    toast.add({
      title: 'Error',
      description: 'No se pudo eliminar el objeto maestro.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}

// OPERACIÓN 3: Agregar Campo Técnico desde el Panel de Edición
const onAddSubField = async () => {
  const fName = newFieldName.value.toUpperCase().trim()
  if (!fName) return
  try {
    // Reutilizamos el endpoint atómico de campos técnicos que creaste antes
    await $fetch('/api/admin/sap-object-fields', {
      method: 'POST',
      body: {
        objectName: objectForm.objectName,
        fieldName: fName,
        description: 'Filtro Organizacional para ${fName}'
      }
    })
    newFieldName.value = ''
    refresh()
    // Recarga los datos y actualiza los tags y la lista interna automáticamente
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.statusText || 'Ese campo ya existe.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}

// OPERACIÓN 4: Remover Campo Técnico desde el Panel de Edición
const onDeleteSubField = async (fName: string) => {
  try {
    await $fetch(`/api/admin/sap-object-fields?objectName=${objectForm.objectName}&fieldName=${fName}`, { method: 'DELETE' })
    refresh()
  } catch (error) {
    console.log(error)
    toast.add({
      title: 'Error',
      description: 'Error al desvincular campo.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}
</script>
