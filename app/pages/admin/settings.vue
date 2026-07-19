<script lang="ts" setup>
import { computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
// 1. Importamos tu composable de autenticación
import { useSAPAuth } from '~/composables/useSAPAuth'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
  // autobj: ['ADMIN'],
  // autact: ['*'],
  // autvar: ['']
})

// 2. Extendemos el tipo nativo para dar soporte a tus propiedades de SAP
interface CustomNavigationItem extends NavigationMenuItem {
  objReq?: string
  actReq?: string
  varReq?: string
  children?: CustomNavigationItem[]
}

// En tu archivo de Perfil - REEMPLAZAR EL PASO 3 POR ESTA CONSULTA DINÁMICA

const route = useRoute()
const { checkAuthority } = useSAPAuth()

// 3. 👑 CONSULTA DINÁMICA: Traemos los enlaces del submenú directo de PostgreSQL indicando el padre
const { data: dbSubMenu, refresh } = await useAsyncData(
  `submenu-dynamic-navigation`, // Usamos una llave base estable para el canal
  () => $fetch<CustomNavigationItem[][]>(`/api/admin/submenu-items?path=${encodeURIComponent(route.path)}`),
  {
    watch: [() => route.path] // ◄— REFRESH REACTIVO AUTOMÁTICO EN CADA CLIC
  }
)

// 4. Función recursiva para filtrar dinámicamente según checkAuthority (Se queda exactamente igual)
function processMenuItems(items: CustomNavigationItem[]): NavigationMenuItem[] {
  return items.flatMap((item) => {
    const hasNoRestrictions = !item.objReq && !item.actReq && !item.varReq
    const orgFilters = item.varReq ? { FIELD: item.varReq } : undefined

    const isAuthorized = hasNoRestrictions || checkAuthority(
      item.objReq ?? '',
      item.actReq ?? '',
      orgFilters
    )

    if (!isAuthorized) return []

    // Tolerancia al booleano 'exact' que viene de Postgres como string o bit
    const isExact = item.exact === true ||
                    String(item.exact) === 'true' ||
                    String(item.exact) === '1' ||
                    item.to === '/admin/settings' // ◄— Fallback de seguridad estricto para la raíz
    // 3. 👑 PROCESAMIENTO RECURSIVO DE LOS HIJOS (Soporte nativo para children)
    // Si este ítem (ej: 'Páginas') tiene elementos en su array de hijos,
    // los pasamos de nuevo por la función para filtrar también sus permisos SAP.
    let processedChildren: NavigationMenuItem[] | undefined = undefined
    if (item.children && item.children.length > 0) {
      processedChildren = processMenuItems(item.children)
    }

    // 4. CONSTRUCCIÓN DEL OBJETO FINAL COMPATIBLE CON <UNavigationMenu>
    const processedItem: NavigationMenuItem = {
      label: item.label,
      icon: item.icon,
      to: item.to || undefined, // Si no tiene enlace (como 'Páginas'), lo dejamos undefined para que actúe solo como desplegable
      target: item.target || undefined,
      exact: isExact,
      children: processedChildren // 👈 Inyectamos los hijos ya procesados y autorizados
    }

    return [processedItem]
  })
}

// 5. Variable reactiva final que consume el componente UNavigationMenu
const links = computed<NavigationMenuItem[][]>(() => {
  // Si la base de datos aún no responde, devolvemos un array vacío preventivo
  if (!dbSubMenu.value) return [[], []]
  return dbSubMenu.value.map(group => processMenuItems(group))
})
if (import.meta.server) {
  console.log('SSR links:', links.value)
}

if (import.meta.client) {
  console.log('Client links:', links.value)
}
</script>

<template>
  <UDashboardPanel
    id="profile"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Perfil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar
        class="overflow-visible"
      >
        <!-- NOTE: El array reactivo computado 'links' filtrará las pestañas automáticamente aquí -->
        <UNavigationMenu
          :items="links"
          highlight
          class="-mx-1 flex-1"
          :ui="{
            // 👑 CORRECCIÓN MAESTRA PARA NUXT UI v3/v4:
            // Forzamos al contenedor flotante del Popover a no limitar la altura de las sublistas
            popover: {
              content: 'max-h-[none]! h-auto! overflow-visible! min-w-48 shadow-xl border border-gray-800'
            },
            // Aseguramos que la lista interna de links hijos no tenga desbordamiento oculto
            childList: 'max-h-[none]! h-auto! overflow-visible!'
          }"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-7xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
