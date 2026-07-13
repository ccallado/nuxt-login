<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header Grams="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

        <!-- 👑 SOLUCIÓN: Renderiza el bloque superior dinámico directo de Postgres -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="menuItems[0]"
          orientation="vertical"
          tooltip
          popover
          :ui="{
            linkTrailingBadge: 'inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-primary-500 text-white dark:bg-primary-600',
            linkTrailingBadgeSize: 'h-5 min-w-[1.25rem]'
          }"
        />

        <!-- 👑 SOLUCIÓN: Renderiza el bloque inferior dinámico directo de Postgres -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="menuItems[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useRoute } from 'vue-router'
import { useSAPAuth } from '~/composables/useSAPAuth'

interface CustomNavigationItem extends NavigationMenuItem {
  objReq?: string
  actReq?: string
  varReq?: string
  badge?: string | number // 👑 CORRECCIÓN 2: Declarar explícitamente el badge en el tipo
  children?: CustomNavigationItem[]
}

const route = useRoute()
const open = ref(false)
const collapsed = ref(false)
const { checkAuthority } = useSAPAuth()

// 1. 👑 CONSULTA MAESTRA: Solicitamos a tu API el árbol estructurado del menú de Postgres
// Usamos 'getCachedData: () => undefined' para forzar el conteo real de sesiones en cada clic
const { data: dbMenuResponse } = await useFetch<CustomNavigationItem[][]>('/api/admin/menu-items', {
  getCachedData: () => undefined
})

// 2. FUNCIÓN RECURSIVA: Filtra en el cliente los accesos no autorizados por SAP (Tu lógica intacta)
function processMenuItems(items: CustomNavigationItem[]): NavigationMenuItem[] {
  return items.flatMap((item) => {
    const hasNoRestrictions = !item.objReq && !item.actReq && !item.varReq
    const orgFilters = item.varReq ? { FIELD: item.varReq } : undefined

    const isAuthorized = hasNoRestrictions || checkAuthority(
      item.objReq ?? '',
      item.actReq ?? '',
      orgFilters
    )

    // Si el usuario no cumple los perfiles del registro, se remueve de la vista de forma invisible
    if (!isAuthorized) {
      return []
    }

    // 👑 CORRECCIÓN 3: Pasamos 'badge' explícitamente para asegurar que Nuxt UI v3 lo renderice
    const processedItem: NavigationMenuItem = {
      ...item,
      badge: item.badge,
      onSelect: () => { open.value = false }
    }

    // Inyectamos el cierre del drawer lateral automático para mejorar la UX móvil
    processedItem.onSelect = () => { open.value = false }

    // Procesamos recursivamente también los hijos (children) mapeados de la tabla
    if (item.children) {
      processedItem.children = processMenuItems(item.children)
    }

    return [processedItem]
  })
}

// 3. 👑 CONEXIÓN EN CASCADA: Mapeamos los dos grupos ([grupoUno, grupoDos]) devueltos por el backend
const menuItems = computed<NavigationMenuItem[][]>(() => {
  if (!dbMenuResponse.value) return [[], []]
  return dbMenuResponse.value.map(group => processMenuItems(group))
})

// Mapeo plano para el buscador global de la aplicación
const groups = computed(() => [{
  id: 'links',
  etiqueta: 'Go to',
  items: menuItems.value.flat().map((item) => {
    const { chip, children, type, defaultOpen, onSelect, ...validProps } = item

    return {
      ...validProps,
      id: item.direccion?.toString() || item.etiqueta,
      chip: typeof chip === 'object' ? chip : undefined
    }
  })
},
{
  id: 'code',
  etiqueta: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>
