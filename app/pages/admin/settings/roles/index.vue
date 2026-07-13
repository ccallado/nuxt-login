<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { NuxtError } from '#app'

const { refreshSession } = useSAPAuth()

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['ADMIN'],
  autact: ['*'],
  autvar: { ROLES: '*' }
})

const toast = useToast()

// 1. Cargar datos de forma unificada desde tu Endpoint centralizado
const { data, refresh } = await useFetch<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roles: Array<{ name: string, description: string, authorizations: any[] }>
  users: Array<{ id: number, email: string, roles: string[] }>
}>('/api/admin/roles')

// Estructura de pestañas adaptada a Nuxt UI v3
const tabs = [
  { slot: 'table', label: 'Matriz de Roles Maestros', icon: 'i-heroicons-table-cells' },
  { slot: 'assign', label: 'Asignación a Usuarios (SU01)', icon: 'i-heroicons-user-group' }
]

// 2. Configuración de columnas utilizando la especificación de TanStack Table para Nuxt UI v3
const columns = [
  { accessorKey: 'name', header: 'Código Técnico (SAP)', class: 'font-mono font-bold' },
  { accessorKey: 'description', header: 'Descripción del Perfil' },
  { accessorKey: 'objects_count', header: 'Objetos Incluidos' },
  { accessorKey: 'actions', header: 'Acción', class: 'text-right' }
]

// 3. Estado de asignación interactiva
const assignmentState = reactive({
  selectedUser: null as { id: number, email: string, roles: string[] } | null,
  selectedRoles: [] as string[]
})
const isSavingAssignment = ref(false)

// Cargar los datos del usuario en el formulario lateral
const selectUserForEdit = (user: { id: number, email: string, roles: string[] }) => {
  assignmentState.selectedUser = user
  // Hacemos una copia limpia para romper referencias reactivas directas mientras edita
  assignmentState.selectedRoles = [...user.roles]
}

// Envío de la asignación del perfil SU01 al servidor
const saveUserRoles = async () => {
  if (!assignmentState.selectedUser) return
  isSavingAssignment.value = true

  try {
    await $fetch('/api/admin/assign-roles', {
      method: 'POST',
      body: {
        userId: assignmentState.selectedUser.id,
        roles: assignmentState.selectedRoles
      }
    })

    toast.add({
      title: 'Success',
      description: `Autorizaciones para ${assignmentState.selectedUser.email} actualizadas.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    assignmentState.selectedUser = null
    await refresh() // Actualiza inmediatamente las listas en pantalla
    await refreshSession() // Fuerza al composable local a recargar los permisos si te auto-asignaste algo
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText || 'Error al guardar asignación.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSavingAssignment.value = false
  }
}

// Mapeo computado para alimentar el USelectMenu dinámicamente
const rolesItems = computed(() => {
  if (!data.value?.roles) return []
  return data.value.roles.map(r => ({
    label: r.name,
    id: r.name
  }))
})

// 1. Tu llamada original useFetch se mantiene igual
// const { data: rolesFetchResponse, refresh } = await useFetch<any>('/api/admin/roles')

// 2. 👑 NUEVO: Creamos una lista computada que calcula el conteo de forma nativa
const rolesConConteo = computed(() => {
  if (!data.value?.roles) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.value.roles.map((rol: any) => {
    // Si authorizations viene como un string JSON desde Postgres, lo parseamos.
    // Si ya viene como un array de objetos, simplemente medimos su longitud (.length).
    let listaAuths = []
    if (typeof rol.authorizations === 'string') {
      try {
        listaAuths = JSON.parse(rol.authorizations)
      } catch (e) {
        console.log(e)
        listaAuths = []
      }
    } else if (Array.isArray(rol.authorizations)) {
      listaAuths = rol.authorizations
    }

    return {
      ...rol,
      // 👑 Inyectamos la clave exacta que espera la columna 'accessorKey: objects_count'
      objects_count: listaAuths.length
    }
  })
})
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado de la página -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Autorizaciones SAP
        </h1>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Administración de matrices técnicas y asignación directa de perfiles a usuarios del sistema.
        </p>
      </div>
    </div>

    <!-- Contenedor de Pestañas (Tabs) de Nuxt UI v3 -->
    <UTabs
      :items="tabs"
      class="w-full"
    >
      <!-- PESTAÑA 1: MATRIZ DE ROLES MAESTROS -->
      <template #table>
        <div class="mt-4 space-y-4">
          <div class="flex justify-between items-center">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Perfiles Técnicos Existentes
            </h2>
            <!-- El botón redirige a la creación de un nuevo rol -->
            <div class="flex items-center gap-2">
              <UButton
                to="/admin/settings/sap-objects"
                color="primary"
                icon="i-heroicons-pencil"
                label="Mantener Objetos de Autorización"
              />
              <UButton
                to="/admin/settings/create-role"
                color="primary"
                icon="i-heroicons-plus"
                label="Crear Nuevo Rol Maestro"
              />
            </div>
          </div>

          <!-- Tabla de Nuxt UI v3 usando TanStack Table interno -->
          <UTable
            :data="rolesConConteo"
            :columns="columns"
            class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
          >
            <!-- Slot personalizado para contar los objetos de la matriz JSON -->
            <template #objects_count-cell="{ row }">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-mono">
                {{ row.original.objects_count }} objetos
              </span>
            </template>

            <!-- Slot para el botón de acción (Modificar) -->
            <template #actions-cell="{ row }">
              <UButton
                :to="`/admin/settings/roles/${row.original.name}`"
                color="primary"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="sm"
                label="Modificar"
              />
            </template>
          </UTable>
        </div>
      </template>

      <!-- PESTAÑA 2: ASIGNACIÓN A USUARIOS (SU01) -->
      <template #assign>
        <div class="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Lista de Usuarios Disponibles -->
          <div class="lg:col-span-2 space-y-4">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Maestro de Usuarios (SU01)
            </h2>

            <div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              <div
                v-for="user in data?.users || []"
                :key="user.id"
                class="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">
                    {{ user.email }}
                  </h4>
                  <!-- Visualizador de los roles técnicos asignados actualmente -->
                  <div class="flex flex-wrap gap-1.5 mt-2">
                    <span
                      v-if="!user.roles || user.roles.length === 0"
                      class="text-xs text-gray-400 italic"
                    >
                      Sin roles asignados
                    </span>
                    <span
                      v-for="role in user.roles"
                      :key="role"
                      class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-mono text-xs rounded"
                    >
                      {{ role }}
                    </span>
                  </div>
                </div>

                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-heroicons-user-plus"
                  size="sm"
                  label="Asignar Roles"
                  @click="selectUserForEdit(user)"
                />
              </div>
            </div>
          </div>

          <!-- Panel Lateral Flotante / Formulario de Asignación Activa -->
          <div class="lg:col-span-1">
            <div
              v-if="assignmentState.selectedUser"
              class="sticky top-6 p-5 border border-primary-200 dark:border-primary-900/50 bg-primary-50/30 dark:bg-primary-950/10 rounded-2xl space-y-4"
            >
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-shield-check"
                    class="text-primary"
                  />
                  Modificar Usuario
                </h3>
                <p class="text-xs text-gray-500 font-mono mt-1 break-all">
                  {{ assignmentState.selectedUser.email }}
                </p>
              </div>

              <!-- Selector múltiple nativo de Nuxt UI v3 -->
              <UFormField
                label="Selecciona los Roles Maestros"
                required
              >
                <USelectMenu
                  v-model="assignmentState.selectedRoles"
                  :items="rolesItems"
                  value-attribute="id"
                  value-key="id"
                  multiple
                  placeholder="Escoge uno o más perfiles..."
                  class="w-full"
                  searchable
                />
              </UFormField>

              <!-- Botones de Control de la Asignación -->
              <div class="flex gap-2 pt-2">
                <UButton
                  color="primary"
                  class="flex-1 justify-center"
                  icon="i-heroicons-document-check"
                  :loading="isSavingAssignment"
                  label="Guardar SU01"
                  @click="saveUserRoles"
                />
                <UButton
                  color="neutral"
                  variant="ghost"
                  label="Cancelar"
                  @click="assignmentState.selectedUser = null;"
                />
              </div>
            </div>

            <!-- Placeholder si no hay ningún usuario seleccionado en el panel lateral -->
            <div
              v-else
              class="p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-center text-gray-400 dark:text-gray-500"
            >
              <UIcon
                name="i-heroicons-user"
                class="w-8 h-8 mx-auto mb-2 opacity-50"
              />
              <p
                class="text-xs"
              >
                Selecciona un usuario de la lista para gestionar sus autorizaciones técnicas.
              </p>
            </div>
          </div>
        </div>
      </template>
    </UTabs>
  </div>
</template>
