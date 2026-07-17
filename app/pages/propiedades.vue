<script lang="ts" setup>
import { computed } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
// 1. Importamos tu composable de autenticación
import { useSAPAuth } from '~/composables/useSAPAuth'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['PROPIEDADES'],
  autact: ['01'],
  autvar: ['']
})

// 2. Extendemos el tipo nativo para dar soporte a tus propiedades de SAP
interface CustomNavigationItem extends NavigationMenuItem {
  objReq?: string
  actReq?: string
  varReq?: string
  children?: CustomNavigationItem[]
}

const { checkAuthority } = useSAPAuth()

// 3. Declaramos los enlaces base usando la interfaz extendida
const rawLinks: CustomNavigationItem[][] = [[{
  label: 'Propiedades',
  icon: 'i-lucide-user',
  to: '/propiedades',
  exact: true,
  objReq: 'PROPIEDADES',
  actReq: '01',
  varReq: ''
}, {
  label: 'Listado',
  icon: 'i-lucide-users',
  to: '/propiedades/propiedadesCrud',
  objReq: 'PROPIEDADES',
  actReq: '01',
  varReq: ''
}]] satisfies CustomNavigationItem[][]

// 4. Función recursiva para filtrar dinámicamente según checkAuthority
function processMenuItems(items: CustomNavigationItem[]): NavigationMenuItem[] {
  return items.flatMap((item) => {
    const hasNoRestrictions = !item.objReq && !item.actReq && !item.varReq
    const orgFilters = item.varReq ? { FIELD: item.varReq } : undefined

    // Ejecutamos tu función con los 3 argumentos que espera el composable
    const isAuthorized = hasNoRestrictions || checkAuthority(
      item.objReq ?? '',
      item.actReq ?? '',
      orgFilters
    )

    if (!isAuthorized) {
      return []
    }

    const processedItem: NavigationMenuItem = { ...item }

    if (item.children) {
      processedItem.children = processMenuItems(item.children)
    }

    return [processedItem]
  })
}

// 5. Variable reactiva final que consume el componente UNavigationMenu
const links = computed<NavigationMenuItem[][]>(() => {
  return rawLinks.map(group => processMenuItems(group))
})
</script>

<template>
  <UDashboardPanel
    id="profile"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Propiedades">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: El array reactivo computado 'links' filtrará las pestañas automáticamente aquí -->
        <UNavigationMenu
          :items="links"
          highlight
          class="-mx-1 flex-1"
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
