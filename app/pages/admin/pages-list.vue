<!-- pages/admin/pages-list.vue - PARTE 1 -->
<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
})

const toast = useToast()

// 1. Cargar las páginas desde la base de datos
const { data: response, refresh } = await useFetch<any>('/api/pages')
const pagesList = computed(() => response.value?.data || [])

// 2. Definición de Columnas para la Tabla Administrativa
const columns = [
  { id: 'title', label: 'Nombre de la Interfaz' },
  { id: 'slug', label: 'Ruta Activa (Slug)' },
  { id: 'layout', label: 'Layout' },
  { id: 'createdAt', label: 'Fecha Creación' },
  { id: 'actions', label: 'Acciones' }
]

// 3. Estado de carga para el borrado
const deleteLoadingId = ref<string | null>(null)

// 4. Función para eliminar la página dinámicamente
async function deletePage(id: string) {
  if (!confirm('¿Estás seguro de que deseas eliminar esta página? Esto destruirá la interfaz asociada en caliente.')) return

  deleteLoadingId.value = id
  try {
    await $fetch(`/api/pages/by-id/${id}`, {
      method: 'DELETE'
    })

    toast.add({
      title: 'Eliminado',
      description: 'La página se ha borrado de PostgreSQL.',
      color: 'success',
      icon: 'i-heroicons-trash'
    })

    await refresh() // Refresca la tabla en caliente
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'No se pudo eliminar el registro.',
      color: 'error'
    })
  } finally {
    deleteLoadingId.value = null
  }
}

// Función auxiliar para formatear la fecha de Drizzle
function formatDate(dateString: string) {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<!-- pages/admin/pages-list.vue - PARTE 2 -->
<template>
  <NuxtLayout :name="pageData?.meta?.layout || 'dashboard-layout'">
    <UDashboardPanel grow class="flex flex-col min-w-0 w-full">
      <!-- 👑 BARRA SUPERIOR INTEGRADA: Aquí es donde Nuxt UI inyectará de forma AUTOMÁTICA el botón de ocultar sidebar -->
      <UDashboardNavbar :title="pageData?.title || 'Panel Dinámico'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <div class="p-6 space-y-8">
        <!-- Encabezado del Listado -->
        <div class="flex justify-between items-center border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <UIcon name="i-heroicons-queue-list" class="text-primary-500" />
              Matrices y Páginas Dinámicas en Producción
            </h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Control central de interfaces inyectadas por JSON. Puedes previsualizar accesos, layouts asignados y destruir vistas de la base de datos en caliente.
            </p>
          </div>
          <UButton
            to="/admin/page-creator"
            color="primary"
            icon="i-heroicons-plus"
            label="Crear Nueva Interfaz JSON"
          />
        </div>

        <!-- Mensaje si la tabla de PostgreSQL está completamente vacía -->
        <div
          v-if="pagesList.length === 0"
          class="p-12 text-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-400 dark:text-gray-500"
        >
          <UIcon name="i-heroicons-circle-stack" class="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 class="text-sm font-semibold">No hay páginas dinámicas registradas</h3>
          <p class="text-xs mt-1">Usa el creador visual para estructurar tu primer JSON y persistirlo en Postgres.</p>
        </div>

        <!-- Tabla Principal de Control Administrativo (Nuxt UI v3/v4) -->
        <UTable
          v-else
          :data="pagesList"
          :columns="columns"
          class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden"
        >
          <!-- Celda Personalizada: Nombre de la Interfaz -->
          <template #title-cell="{ row }">
            <!-- <div class="font-medium text-gray-900 dark:text-white"> -->
            <div class="font-medium dark:text-white">
              {{ row.original.title }}
            </div>
          </template>

          <!-- Celda Personalizada: Enlace directo al slug dinámico -->
          <template #slug-cell="{ row }">
            <NuxtLink
              :to="`/${row.original.slug}`"
              target="_blank"
              class="text-xs font-mono text-primary-500 hover:underline inline-flex items-center gap-1"
            >
              /{{ row.original.slug }}
              <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-3 h-3" />
            </NuxtLink>
          </template>

          <!-- Celda Personalizada: Layout utilizado en el Meta -->
          <template #layout-cell="{ row }">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-mono text-gray-600 dark:text-gray-300">
              {{ row.original.layout?.layout || 'default' }}
            </span>
          </template>

          <!-- Celda Personalizada: Fecha de Creación formateada -->
          <template #createdAt-cell="{ row }">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(row.original.createdAt) }}
            </span>
          </template>

          <!-- Celda Personalizada: Botones de Acción (Ver e Interceptar Borrado) -->
          <template #actions-cell="{ row }">
            <div class="flex items-center gap-2">
              <!-- Botón Ir a la Página Real -->
              <UButton
                :to="`/${row.original.slug}`"
                color="neutral"
                variant="ghost"
                icon="i-heroicons-eye"
                size="sm"
                label="Ver UI"
              />

              <!-- NUEVO: Botón para Redirigir al Creador en Modo Edición -->
              <UButton
                :to="`/admin/page-creator?id=${row.original.id}`"
                color="primary"
                variant="ghost"
                icon="i-heroicons-pencil-square"
                size="sm"
                label="Modificar"
              />

              <!-- Botón de Destrucción Física en Postgres -->
              <UButton
                color="error"
                variant="ghost"
                icon="i-heroicons-trash"
                size="sm"
                label="Eliminar"
                :loading="deleteLoadingId === row.original.id"
                @click="deletePage(row.original.id)"
              />
            </div>
          </template>
        </UTable>
      </div>
    </UDashboardPanel>
  </NuxtLayout>
</template>
