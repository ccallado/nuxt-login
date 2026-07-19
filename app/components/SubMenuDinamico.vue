<!-- app/components/SubMenuDinamico.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useSAPAuth } from '~/composables/useSAPAuth'

// Extendemos el tipo nativo para dar soporte a tus propiedades de SAP de Postgres
interface CustomNavigationItem extends NavigationMenuItem {
  objReq?: string
  actReq?: string
  varReq?: string
  children?: CustomNavigationItem[]
}

const route = useRoute()
const { checkAuthority } = useSAPAuth()

// 👑 CONSULTA EN CASCADA CON WATCH AUTOMÁTICO:
// El componente vigila route.path. Si cambias entre páginas con menú, se refresca solo.
const { data: dbSubMenu } = await useAsyncData(
  'submenu-dynamic-component-key',
  () => $fetch<CustomNavigationItem[][]>(`/api/admin/submenu-items?path=${encodeURIComponent(route.path)}`),
  { watch: [() => route.path] }
)

// Función recursiva para filtrar dinámicamente según checkAuthority de SAP
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

    // Forzamos el booleano exact estricto para evitar duplicidad de subrayados
    const isExact = item.exact === true ||
                    String(item.exact) === 'true' ||
                    String(item.exact) === '1' ||
                    item.to === route.path

    // Procesamos hijos de forma recursiva (Soporte para pestañas con submenús como 'Páginas')
    let processedChildren: NavigationMenuItem[] | undefined = undefined
    if (item.children && item.children.length > 0) {
      processedChildren = processMenuItems(item.children)
    }

    return [{
      label: item.label,
      icon: item.icon,
      to: item.to || undefined,
      target: item.target || undefined,
      exact: isExact,
      children: processedChildren
    }]
  })
}

// Variable reactiva final filtrada para Nuxt UI
const links = computed<NavigationMenuItem[][]>(() => {
  if (!dbSubMenu.value) return [[], []]
  return dbSubMenu.value.map(group => processMenuItems(group))
})
</script>

<template>
  <!-- Renderizamos el menú oficial con las anulaciones de scroll del Popover para los hijos -->
  <UNavigationMenu
    :items="links"
    highlight
    class="-mx-1 flex-1"
    :ui="{
      popover: {
        content: 'max-h-[none]! h-auto! overflow-visible! min-w-48 shadow-xl border border-gray-800'
      },
      childList: 'max-h-[none]! h-auto! overflow-visible!'
    }"
  />
</template>
