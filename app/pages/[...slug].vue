<!-- eslint-disable @stylistic/no-multi-spaces -->
<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- app/pages/[...slug].vue - SCRIPT SETUP COMPILADO AL 100% -->
<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
// import { profileSchema } from '#shared/zod/profile.schema'
import { reactive, computed, watch, ref } from 'vue'
// import UserSelect from '~/components/UserSelect.vue'

const route = useRoute()
const toast = useToast()
const { fetch: refreshSession } = useUserSession()

// 1. Capturar el slug de la URL limpiando barras diagonales al inicio o al final
const slugString = computed(() => {
  if (!route.params.slug) return 'sap-management'
  const raw = Array.isArray(route.params.slug) ? route.params.slug.join('/') : route.params.slug
  return raw.replace(/^\/+|\/+$/g, '')
})

// console.log('🔍 Motor Dinámico - Buscando en Postgres el slug:', slugString.value)

// 2. Traer el JSON estructurado desde tu API conectada a Drizzle y PostgreSQL
const { data: pageData, error } = await useAsyncData(`page-${slugString.value}`, () =>
  $fetch<any>(`/api/pages/${slugString.value}`, {
    headers: { Accept: 'application/json' }
  })
)

// 3. Estados Reactivos Críticos (¡Declarados una única vez sin duplicados!)
const profileState = reactive<Record<string, any>>({})
// const schemaMap: Record<string, any> = { profile: profileSchema }
const dataRows = reactive<Record<string, any[]>>({})
const selectedColumnsMap = reactive<Record<string, string[]>>({})
const tableUserFields = reactive<Record<string, string[]>>({})
const listaUsuariosDB = ref<{ id: number, email: string }[]>([])

// watch(
//   () => profileState,
//   (newVal) => {
//     console.log('🔄 profileState actualizado (en página):', JSON.stringify(newVal, null, 2))
//   },
//   { deep: true }
// )

// 4. Ciclo de vida Watch: Inicializa y descarga los datos de base de datos
watch(pageData, async (newPage) => {
  if (!newPage?.content?.blocks) return

  // 1. DESCARGA INICIAL DE USUARIOS: Si la lista global está vacía, traemos los correos de Postgres
  if (listaUsuariosDB.value.length === 0) {
    try {
      const usersRes = await $fetch<any[]>('/api/db/users-list')
      // ◄— CHIVATO DE CONTROL: Abre la consola del navegador (F12) para ver qué llega
      // console.log('📡 [FRONTEND USERS] Datos recibidos de /api/users/list:', usersRes)

      if (usersRes && Array.isArray(usersRes)) {
        listaUsuariosDB.value = usersRes
      }
    } catch (err) {
      console.warn('No se pudo descargar la lista de usuarios reales, aplicando usuarios mock.')
      // Fallback base preventivo por si estás depurando sin registros en la tabla users
      listaUsuariosDB.value = [
        { id: 28, email: 'admin@empresa.com' },
        { id: 29, email: 'vecino_testing@correo.com' }
      ]
    }
  }

  // 2. Iteración y configuración de cada bloque inyectado
  for (const block of newPage.content.blocks) {
    // A. Inicializar v-models de formularios dinámicos
    if (block.type === 'form-fields' && block.fields) {
      for (const field of block.fields) {
        if (profileState[field.id] === undefined) {
          // Si el campo es numérico (como propietarioId), lo inicializamos como null o vacío
          profileState[field.id] = null
        }
      }
    }

    // B. Descargar las filas de la tabla física en PostgreSQL
    if (block.type === 'dynamic-table' && block.tableName && !dataRows[block.id]) {
      try {
        dataRows[block.id] = []
        const res = await $fetch<any[]>(`/api/db/query?table=${block.tableName}`)
        if (res) {
          dataRows[block.id] = res.rows || []
          tableUserFields[block.id] = res.userFields || [] // ◄— Guardamos qué columnas son usuarios
        }
      } catch (err) {
        console.warn(`No se pudo leer la tabla física '${block.tableName}', usando datos de respaldo.`);
        dataRows[block.id] = [
          { id: '1', calle: 'pepeillo', numero: '1', escalera: 'NULL', planta: '1', letra: 'A', descripcion: 'Es el piso del vecino', propietarioId: 28 }
        ]
      }
    }

    // C. Inicializar el mapa reactivo únicamente con strings planos de IDs visibles
    if (block.type === 'dynamic-table' && block.availableColumns) {
      if (!selectedColumnsMap[block.id]) {
        selectedColumnsMap[block.id] = block.availableColumns
          .filter((c: any) => c.visible !== false)
          .map((c: any) => String(c.id))
      }
    }
  }
}, { immediate: true })

// 5. Lógica fija complementaria para las pestañas SAP
const rolesConConteo = ref([{ name: 'SAP_ALL', objects_count: 142 }, { name: 'SAP_NEW', objects_count: 12 }])
const columns = [{ id: 'name', label: 'Nombre' }, { id: 'objects_count', label: 'Objetos' }, { id: 'actions', label: 'Acciones' }]
// const userData = ref({ users: [{ id: 1, email: 'admin@empresa.com', roles: ['SAP_ALL'] }] })
// const rolesItems = ref(['SAP_ALL', 'SAP_NEW', 'SAP_FI_USER'])
// const isSavingAssignment = ref(false)
// const assignmentState = reactive({ selectedUser: null as any, selectedRoles: [] as string[] })

// const selectUserForEdit = (user: any) => {
//   assignmentState.selectedUser = user
//   assignmentState.selectedRoles = [...user.roles]
// }

// const saveUserRoles = async () => {
//   isSavingAssignment.value = true
//   await new Promise(resolve => setTimeout(resolve, 800))
//   if (assignmentState.selectedUser) assignmentState.selectedUser.roles = [...assignmentState.selectedRoles]
//   isSavingAssignment.value = false
//   assignmentState.selectedUser = null
// }

// 6. Función helper reparada: filtra basándose en la lista de strings seleccionados
const getVisibleColumns = (block: any) => {
  if (!block || !block.availableColumns) return []

  const activeIds = selectedColumnsMap[block.id] || []

  return block.availableColumns
    .filter((col: any) => activeIds.includes(String(col.id)))
    .map((col: any) => ({
      id: col.id,
      key: col.id,
      label: col.label || col.id
    }))
}

// 7. Actualización directa de strings planos del Select Menu
const updateColumnVisibility = (blockId: string, selectedIds: string[]) => {
  selectedColumnsMap[blockId] = selectedIds
}

// 8. Envío de formularios dinámicos
// En el <script setup> de app/pages/[...slug].vue - ACTUALIZAR EL ONSUBMIT

async function onSubmit(event: FormSubmitEvent<any>, apiPutUrl: string) {
  try {
    // ◄— NUEVO: Clonamos el payload para no romper el diseño visual de la pantalla
    const payloadParaPostgres = { ...profileState }

    // Recorremos los campos y si encontramos un objeto de usuario, extraemos solo su número ID
    Object.keys(payloadParaPostgres).forEach((key) => {
      const value = payloadParaPostgres[key]
      if (value && typeof value === 'object' && 'id' in value) {
        payloadParaPostgres[key] = Number(value.id) // Convertimos el objeto en el ID entero (ej: 29)
      }
    })

    // Lanzamos la inserción hacia PostgreSQL enviando el payload limpio de objetos
    await $fetch(apiPutUrl || '/api/db/save-form?table=propiedades', {
      method: 'POST',
      body: payloadParaPostgres
    })

    toast.add({ title: 'Éxito', description: 'Cambios grabados con éxito.', color: 'success' })

    // Limpiamos los inputs del formulario de forma reactiva (Se queda igual...)
    Object.keys(profileState).forEach((key) => {
      profileState[key] = null
    })

    // Refrescamos la tabla dinámica automáticamente (Se queda igual...)
    if (pageData.value?.content?.blocks) {
      for (const block of pageData.value.content.blocks) {
        if (block.type === 'dynamic-table' && block.tableName) {
          const res = await $fetch<any>(`/api/db/query?table=${block.tableName}`)
          if (res) {
            dataRows[block.id] = res.rows || []

            // ◄— SOLUCIÓN: Re-inyectamos el mapa de IDs seleccionados para disparar
            // el repintado inmediato de las celdas en el motor de Vue 3
            const currentSelected = selectedColumnsMap[block.id] || []
            selectedColumnsMap[block.id] = []
            nextTick(() => {
              selectedColumnsMap[block.id] = currentSelected
            })
          }
        }
      }
    }

    await refreshSession()
  } catch (err) {
    toast.add({ title: 'Error', description: 'No se pudieron guardar los cambios.', color: 'error' })
  }
}
</script>

<!-- app/pages/[...slug].vue - PARTE 2 TOTALMENTE REPARADA -->
<template>
  <!-- ◄— SOLUCIÓN: Forzamos a Nuxt a leer reactivamente el layout de la BD (por defecto 'dashboard-layout') -->
  <NuxtLayout :name="pageData?.meta?.layout || 'dashboard-layout'">
    <UDashboardPanel
      grow
      class="flex flex-col min-w-0 w-full bg-transparent h-full overflow-y-auto"
    >
      <UDashboardNavbar :title="pageData?.title || 'Panel Dinámico'">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
      <!-- 1. Estado de Error si Drizzle o Nitro fallan -->
      <div
        v-if="error"
        class="p-12 text-center max-w-md mx-auto space-y-4"
      >
        <UIcon
          name="i-heroicons-exclamation-circle"
          class="w-12 h-12 text-red-500 mx-auto"
        />
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          Error de Carga
        </h2>
        <p class="text-sm text-gray-500">
          {{ error?.message || 'La ruta especificada no existe en PostgreSQL.' }}
        </p>
        <UButton
          to="/admin/pages-list"
          color="neutral"
          variant="subtle"
          label="Volver al Listado"
        />
      </div>

      <!-- 2. Estado si la página no tiene bloques inyectados -->
      <div
        v-else-if="pageData && (!pageData.content?.blocks || pageData.content.blocks.length === 0)"
        class="p-12 text-center max-w-md mx-auto space-y-2"
      >
        <UIcon
          name="i-heroicons-square-3-stack-3d"
          class="w-12 h-12 text-gray-400 mx-auto opacity-50"
        />
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Página estructuralmente vacía
        </h2>
        <p class="text-xs text-gray-500">
          Esta interfaz existe en Postgres pero no contiene bloques inyectados.
        </p>
      </div>

      <!-- 3. RENDERIZADO PRINCIPAL DE BLOQUES -->
      <div
        v-else-if="pageData"
        class="p-6 space-y-8"
      >
        <ClientOnly>
          <div
            v-for="block in pageData.content?.blocks || []"
            :key="block.id"
            class="space-y-6"
          >
            <!-- COMPONENTE 1: FORMULARIO DINÁMICO (form-fields) -->
            <UForm
              v-if="block.type === 'form-fields'"
              :id="block.formId"
              :schema="null"
              :state="profileState"
              @submit="(e) => onSubmit(e, block.apiPut || '/api/user/profile')"
            >
              <UPageCard
                :title="block.title"
                :description="block.description"
                variant="naked"
                orientation="horizontal"
                class="mb-4"
              >
                <UButton
                  :form="block.formId"
                  label="Grabar cambios"
                  color="primary"
                  type="submit"
                  class="w-fit lg:ms-auto"
                />
              </UPageCard>

              <!-- SECCIÓN DE CAMPOS DEL FORMULARIO CON DISEÑO EN CUADRÍCULA COMPACTA -->
              <UPageCard
                variant="subtle"
                class="p-6"
              >
                <!-- ◄— CAMBIO CLAVE: Creamos una malla (Grid) de 1 columna en móvil, 2 en tablets y 3 en monitores grandes -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                  <div
                    v-for="field in block.fields || []"
                    :key="field.id"
                    :class="field.type === 'textarea' ? 'md:col-span-2 lg:col-span-3' : ''"
                  >
                    <!-- Eliminamos el USeparator horizontal que rompía el flujo visual -->
                    <!-- El contenedor UFormField ahora organiza de forma vertical la etiqueta y su caja de texto -->
                    <UFormField
                      :name="field.id"
                      :label="field.label"
                      :required="field.required"
                      class="flex flex-col gap-1.5 w-full"
                    >
                      <!-- CONDICIÓN 1: Textarea común -->
                      <UTextarea
                        v-if="field.type === 'textarea'"
                        v-model="profileState[field.id]"
                        :rows="3"
                        class="w-full"
                      />

                      <!-- CONDICIÓN 2 AUTOMÁTICA: CONTROL POR OBJETOS DE NUXT UI v3 -->
                      <USelectMenu
                        v-else-if="tableUserFields[block.id]?.includes(field.id) || field.id.toLowerCase().endsWith('id')"
                        v-model="profileState[field.id]"
                        :items="listaUsuariosDB"
                        label-key="email"
                        by="id"
                        searchable
                        placeholder="Buscar usuario en la tabla users..."
                        :portal="false"
                        class="w-full"
                      >
                        <!-- 1. SLOT DE CABECERA DIRECTO Y SEGURO: Lee el email directo del objeto seleccionado -->
                        <template #label>
                          {{ JSON.stringify(profileState[field.id]) }}
                        </template>
                        <!-- 2. SLOT DE FILAS -->
                        <template #item="{ item }">
                          <span class="text-sm font-normal text-gray-900 dark:text-gray-100">
                            {{ item.email }}
                          </span>
                        </template>
                      </USelectMenu>

                      <!-- CONDICIÓN 3: Inputs comunes de texto/número restantes -->
                      <UInput
                        v-else
                        v-model.number="profileState[field.id]"
                        :type="field.type"
                        autocomplete="off"
                        class="w-full"
                      />
                    </UFormField>
                  </div>
                </div>
              </UPageCard>
            </UForm>

            <!-- COMPONENTE 2: GESTIÓN DE ROLES SAP (sap-tabs) -->
            <div
              v-else-if="block.type === 'sap-tabs'"
              class="space-y-6"
            >
              <div class="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                    {{ block.title }}
                  </h1>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ block.description }}
                  </p>
                </div>
              </div>
              <UTabs
                :items="[{ slot: 'table', label: block.tableTitle || 'Matriz de Roles' }, { slot: 'assign', label: block.assignTitle || 'Asignación SU01' }]"
                class="w-full"
              >
                <template #table>
                  <div class="mt-4 space-y-4">
                    <UTable
                      :data="rolesConConteo"
                      :columns="columns"
                      class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden bg-white dark:bg-gray-900"
                    />
                  </div>
                </template>
              </UTabs>
            </div>

            <!-- [CORREGIDO] COMPONENTE 3: PANEL DE INDICADORES (stat-cards) -->
            <div
              v-if="block.type === 'stat-cards'"
              class="space-y-3"
            >
              <div class="border-b border-gray-200 dark:border-gray-800 pb-2">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ block.title }}
                </h2>
                <p
                  v-if="block.description"
                  class="text-xs text-gray-500"
                >
                  {{ block.description }}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                  v-for="(stat, idx) in block.stats || []"
                  :key="idx"
                  class="p-4 bg-gray-900/50 border border-gray-800 rounded-xl flex items-center justify-between shadow-sm"
                >
                  <div class="space-y-1">
                    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      {{ stat.label }}
                    </p>
                    <div class="flex items-baseline gap-2">
                      <span class="text-2xl font-bold font-mono text-white">
                        {{ stat.value }}
                      </span>
                      <span
                        v-if="stat.change"
                        class="text-xs font-medium text-green-400"
                      >
                        {{ stat.change }}
                      </span>
                    </div>
                  </div>
                  <div class="p-2 bg-gray-800 rounded-lg text-green-500 flex items-center justify-center">
                    <!-- Fallback a icono genérico si no encuentra el de heroicons -->
                    <UIcon
                      :name="stat.icon || 'i-heroicons-chart-bar'"
                      class="w-6 h-6"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- [CORREGIDO] COMPONENTE 4: TIMELINE DE AUDITORÍA (sap-logs) -->
            <div
              v-else-if="block.type === 'sap-logs'"
              class="space-y-3"
            >
              <div class="border-b border-gray-200 dark:border-gray-800 pb-2">
                <h2
                  class="text-lg font-bold text-gray-900 dark:text-white"
                >
                  {{ block.title }}
                </h2>
                <p
                  v-if="block.description"
                  class="text-xs text-gray-500"
                >
                  {{ block.description }}
                </p>
              </div>

              <div class="border border-gray-800 rounded-xl p-4 bg-gray-900/50 space-y-4">
                <div
                  v-for="(log, idx) in block.logs || []"
                  :key="idx"
                  class="flex items-start gap-4 border-l-2 border-gray-800 pl-4 relative ml-2"
                >
                  <!-- Punto del timeline usando clases nativas de Tailwind v4 -->
                  <div class="absolute w-2.5 h-2.5 bg-green-500 rounded-full -left-1.5 top-1.5 shadow shadow-green-500/50" />

                  <div class="flex-1 text-xs space-y-1">
                    <div class="flex justify-between items-center w-full">
                      <span class="font-mono font-bold text-gray-200 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">{{ log.admin }}</span>
                      <span class="text-[10px] text-gray-500 font-mono">{{ log.date }}</span>
                    </div>
                    <p class="text-gray-300 pt-1">
                      {{ log.action }}
                      <span
                        v-if="log.user && log.user !== 'Todos'"
                        class="font-mono text-green-400"
                      >
                        ➔ Destinatario: {{ log.user }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- COMPONENTE 5: VISOR DE CÓDIGO TÉCNICO (code-viewer) -->
            <div
              v-else-if="block.type === 'code-viewer'"
              class="border border-gray-800 rounded-2xl p-4 font-mono text-xs text-amber-400 overflow-x-auto"
            >
              <pre>{{ block.code }}</pre>
            </div>

            <!-- COMPONENTE 6: TABLA CON COLUMNAS SELECCIONABLES (dynamic-table) -->
            <div
              v-else-if="block.type === 'dynamic-table'"
              class="space-y-4"
            >
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ block.title || 'Listado de Datos' }}
                  </h2>
                  <p
                    v-if="block.description"
                    class="text-xs text-gray-500"
                  >
                    Conectado a PostgreSQL: <code class="text-primary-500 font-mono">{{ block.tableName }}</code>
                  </p>
                </div>

                <!-- SELECTOR DE COLUMNAS CONFIGURADO CON STRINGS PLANOS COMPATIBLE NUXT UI v3/v4 -->
                <USelectMenu
                  :model-value="selectedColumnsMap[block.id] || []"
                  multiple
                  :items="(block.availableColumns || []).map((c: { id: any }) => String(c.id))"
                  class="w-full sm:w-48"
                  placeholder="Columnas..."
                  @update:model-value="(selectedIds: any) => updateColumnVisibility(block.id, selectedIds)"
                >
                  <template #label>
                    <!-- Traducir los IDs a etiquetas amigables para el botón superior -->
                    <span class="text-xs">
                      Columnas Visibles ({{ (selectedColumnsMap[block.id] || []).length }})
                    </span>
                  </template>
                </USelectMenu>
              </div>

              <!-- LA TABLA DINÁMICA DE REGISTROS CON MAPEO ESTABLE -->
              <div class="border border-gray-200 dark:border-gray-800 rounded-xl overflow-x-auto bg-white dark:bg-gray-900 shadow-sm w-full">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-sm">
                  <!-- CABECERA DE LA TABLA -->
                  <thead class="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 font-medium text-xs uppercase tracking-wider">
                    <tr>
                      <!-- CORRECCIÓN 1: Pasamos el objeto block completo -->
                      <th
                        v-for="col in getVisibleColumns(block)"
                        :key="col.id"
                        class="px-4 py-3"
                      >
                        {{ col.label }}
                      </th>
                    </tr>
                  </thead>

                  <!-- FILAS DE LA TABLA -->
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-800 text-gray-900 dark:text-gray-100">
                    <tr
                      v-for="(row, rIdx) in (dataRows[block.id] || [])"
                      :key="rIdx"
                      class="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
                    >
                      <!-- CORRECCIÓN 2: Pasamos el objeto block completo -->
                      <td
                        v-for="col in getVisibleColumns(block)"
                        :key="col.id"
                        class="px-4 py-3 font-mono text-xs whitespace-nowrap"
                      >
                        {{ row[col.key] !== null && row[col.key] !== undefined ? row[col.key] : '-' }}
                      </td>
                    </tr>

                    <tr v-if="!(dataRows[block.id] || []).length">
                      <td
                        :colspan="getVisibleColumns(block).length || 1"
                        class="px-4 py-8 text-center text-xs text-gray-400 italic"
                      >
                        No se encontraron registros en la tabla física de PostgreSQL.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </ClientOnly>
      </div>

      <div
        v-else
        class="p-12 text-center text-xs font-mono text-gray-400 animate-pulse"
      >
        Consultando registros en PostgreSQL mediante Drizzle ORM...
      </div>
    </UDashboardPanel>
  </NuxtLayout>
</template>
