<script setup lang="ts">
import type { NuxtError } from '#app'

// import { ref, reactive } from 'vue'
const { refreshSession } = useSAPAuth()

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  roles: ['user']
})

const toast = useToast()

// 1. Cargar datos de forma reactiva desde el backend
const { data, refresh } = await useFetch('/api/admin/roles')

// console.log(data?.value.users)

// Estructura de pestañas para Nuxt UI
const tabs = [
  { slot: 'table', label: 'Matriz de Roles Maestros', icon: 'i-heroicons-table-cells' },
  { slot: 'assign', label: 'Asignación a Usuarios (SU01)', icon: 'i-heroicons-user-group' }
]

// 2. Configuración de la Tabla de Roles Maestros
// const columns = [
//   { id: 'name', key: 'name', label: 'Código Técnico (SAP)' },
//   { id: 'description', key: 'description', label: 'Descripción del Perfil' },
//   { id: 'objects_count', key: 'objects_count', label: 'Objetos Incluidos' },
//   { id: 'actions', key: 'actions', label: 'Acción' } // 👈 NUEVA COLUMNA
// ]
const columns = [
  { accessorKey: 'name', header: 'Código Técnico (SAP)' },
  { accessorKey: 'description', header: 'Descripción del Perfil' },
  { accessorKey: 'objects_count', header: 'Objetos Incluidos' },
  { accessorKey: 'actions', header: 'Acción' }
]

// 3. Estado para la asignación interactiva de usuarios
const assignmentState = reactive({
  selectedUser: null as { id: number, email: string, roles: string[] } | null,
  selectedRoles: [] as string[]
})
const isSavingAssignment = ref(false)

// Cargar los roles del usuario seleccionado al formulario flotante
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const selectUserForEdit = (user: any) => {
  assignmentState.selectedUser = user
  assignmentState.selectedRoles = [...user.roles]
}

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
      description: 'Autorizaciones de usuario actualizadas con éxito.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    // alert('Autorizaciones de usuario actualizadas con éxito.')
    assignmentState.selectedUser = null
    await refresh() // Refrescar listas con los nuevos cambios
    await refreshSession()
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText,
      icon: 'i-lucide-x',
      color: 'error'
    })
    // alert('Error al guardar las asignaciones.')
  } finally {
    isSavingAssignment.value = false
  }
}

// Agrega esto en tu <script setup>
const rolesItems = computed(() => {
  if (!data.value?.roles) return []

  // Convertimos cada rol en el formato { label: 'Z_ADMIN', id: 'Z_ADMIN' }
  return data.value.roles.map((r: { name: string }) => ({
    label: r.name,
    id: r.name
  }))
})
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <!-- <UContainer class="py-10 max-w-6xl"> -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1
          class="text-2xl font-black text-gray-900 dark:text-white"
        >
          Gobernanza de Accesos de Seguridad
        </h1>
        <p
          class="text-sm text-gray-500"
        >
          Administra la asignación masiva y el mapeo de transacciones corporativas
        </p>
      </div>
      <UButton
        to="/admin/settings/create-role"
        color="primary"
        icon="i-heroicons-plus-circle"
      >
        Crear Nuevo Rol Maestro
      </UButton>
    </div>

    <!-- Navegación por pestañas -->
    <UTabs
      :items="tabs"
      class="w-full"
    >
      <!-- PESTAÑA 1: TABLA GENERAL DE ROLES MAESTROS -->
      <template #table>
        <UCard class="mt-4">
          <UTable
            :data="data?.roles || []"
            :columns="columns"
          >
            <!-- CORRECCIÓN NUXT 4: El slot ahora es #[id]-cell en lugar de #[key]-data -->
            <template #name-cell="{ row }">
              <span class="font-mono font-bold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded text-xs border border-primary-200 dark:border-primary-800">
                {{ row.original.name }} <!-- CORRECCIÓN: TanStack encapsula la fila en 'original' -->
              </span>
            </template>

            <!-- CORRECCIÓN NUXT 4: El slot cambia a #objects_count-cell -->
            <template #objects_count-cell="{ row }">
              <UBadge
                size="xs"
                color="neutral"
                variant="solid"
              >
                <!-- Parseamos el string JSON antes de medir su longitud -->
                <!-- Forzamos el cast a 'any' para que TypeScript no bloquee la propiedad .length -->
                {{
                  typeof row.original.authorizations === 'string'
                    ? (JSON.parse(row.original.authorizations) as any[]).length
                    : (row.original.authorizations as any[])?.length || 0
                }} Objetos
                <!-- {{ row.original.authorizations?.length || 0 }} Objetos -->
              </UBadge>
            </template>

            <!-- NUEVO SLOT PARA LA COLUMNA DE ACCIONES -->
            <template #actions-cell="{ row }">
              <UButton
                :to="`/admin/settings/roles/${row.original.name}`"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="xs"
                label="Editar Matriz"
              />
            </template>

            <!-- Opcional: Renderizador por defecto si la columna description no requiere HTML personalizado -->
          </UTable>
        </UCard>
      </template>

      <!-- PESTAÑA 2: ASIGNACIÓN A USUARIOS -->
      <template #assign>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <!-- Lista Izquierda: Usuarios del Sistema -->
          <UCard class="md:col-span-2">
            <template #header>
              <h3
                class="font-semibold text-sm"
              >
                Directorio Global de Usuarios
              </h3>
            </template>

            <div class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-for="user in data?.users"
                :key="user.id"
                class="p-3 flex
                justify-between
                items-center
                hover:bg-gray-50
                dark:hover:bg-gray-800/30
                transition-colors
                rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <UAvatar
                    :src="user.avatar"
                    :alt="user.email.toUpperCase()"
                    size="md"
                  />
                  <div>
                    <p
                      class="font-medium
                      text-sm
                      text-gray-900
                      dark:text-white"
                    >
                      {{ user.email }}
                    </p>
                    <div class="flex flex-wrap gap-1 mt-1">
                      <span
                        v-if="user.roles.length === 0"
                        class="text-xs
                        text-gray-400
                        italic"
                      >
                        Sin roles asignados
                      </span>
                      <span
                        v-for="r in user.roles"
                        :key="r"
                        class="text-[10px]
                        bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5
                        rounded
                        font-mono
                        text-gray-600
                        dark:text-gray-300"
                      >
                        {{ r }}
                      </span>
                    </div>
                  </div>
                </div>
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-heroicons-pencil-square"
                  label="Modificar"
                  size="xs"
                  @click="selectUserForEdit(user)"
                />
              </div>
            </div>
          </UCard>

          <!-- Panel Derecho: Formulario Reactivo de Asignación -->
          <UCard
            v-if="assignmentState.selectedUser"
            class="h-fit sticky top-6"
          >
            <template #header>
              <div class="flex justify-between items-center">
                <h3
                  class="font-bold text-sm text-gray-900 dark:text-white"
                >
                  Modificar Autorizaciones
                </h3>
                <UButton
                  color="secondary"
                  variant="ghost"
                  icon="i-heroicons-x-mark"
                  size="xs"
                  @click="assignmentState.selectedUser = null"
                />
              </div>
            </template>

            <div class="space-y-4">
              <div>
                <span class="text-xs text-gray-400 block mb-1">Usuario Destino</span>
                <p class="font-bold text-sm text-primary border-b border-gray-100 dark:border-gray-800 pb-2">
                  {{ assignmentState.selectedUser.email }}
                </p>
              </div>

              <!-- Selector Múltiple Complejo de Nuxt UI -->
              <UFormField
                label="Asignar Roles Maestros Relacionados"
                name="roles-select"
              >
                <USelectMenu
                  v-model="assignmentState.selectedRoles"
                  :items="rolesItems"
                  multiple
                  value-key="id"
                  placeholder="Selecciona uno o varios roles..."
                  searchable
                />
              </UFormField>

              <div class="pt-2">
                <UButton
                  block
                  color="primary"
                  icon="i-heroicons-shield-check"
                  :loading="isSavingAssignment"
                  label="Ejecutar Cambios"
                  @click="saveUserRoles"
                />
              </div>
            </div>
          </UCard>

          <!-- Estado Vacío del Formulario Derecho -->
          <UCard
            v-else
            class="flex flex-col items-center justify-center text-center p-10 bg-gray-50/50 dark:bg-gray-800/10 border border-dashed border-gray-200 dark:border-gray-800"
          >
            <UIcon
              name="i-heroicons-user-plus"
              class="w-8 h-8 text-gray-300 dark:text-gray-700 mb-2"
            />
            <p
              class="text-xs text-gray-400"
            >
              Selecciona un usuario del directorio para alterar sus perfiles de seguridad activos.
            </p>
          </UCard>
        </div>
      </template>
    </UTabs>
  <!-- </UContainer> -->
  </UPageCard>
</template>
