<!-- eslint-disable @stylistic/no-trailing-spaces -->
<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      v-model:collapsed="collapsed"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

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

    <UDashboardPanel class="flex-1 w-full min-w-0">
      <slot />
    </UDashboardPanel>
  </UDashboardGroup>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useRoute } from 'vue-router'
import { useSAPAuth } from '~/composables/useSAPAuth'

const config = useRuntimeConfig()
const totalSesionesVivas = ref(0)

// Función que consulta el contador rápido
const fetchSessionsCount = async () => {
  try {
    const res = await $fetch<{ total: number }>('/api/admin/sessions-count')
    if (typeof res.total === 'number') {
      totalSesionesVivas.value = res.total
    }
  } catch {
    console.warn('No se pudo actualizar el conteo de sesiones')
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  // 1. Limpieza preventiva: Si por un re-renderizado ya existía un reloj activo, lo destruimos
  if (intervalId) clearInterval(intervalId)

  // 2. Primer disparo inmediato al entrar para que el Badge no salga vacío
  fetchSessionsCount()

  // 3. 👑 EL RELOJ CONTROLADO: Ejecuta la consulta exclusivamente cada 15 segundos
  // console.log({intervaloTiempoSesiones: config.public.intervaloTiempoSesiones})
  intervalId = setInterval(fetchSessionsCount, config.public.intervaloTiempoSesiones)
  // intervalId = setInterval(fetchSessionsCount, 15000)
})

onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
    if (import.meta.dev) {
      console.log('🧹 [LAYOUT] Temporizador de sesiones destruido.')
    }
  }
})

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

// Evitamos reutilizar datos cacheados para obtener siempre la versión más reciente del menú.
const { data: dbMenuResponse } = await useFetch<CustomNavigationItem[][]>('/api/admin/menu-items', {
  getCachedData: () => undefined
})

// Inyectamos el estado de autenticación reactivo de Nuxt
const { loggedIn } = useUserSession()

// FUNCIÓN RECURSIVA: Filtra en el cliente los accesos no autorizados por SAP (Tu lógica intacta)
function processMenuItems(items: CustomNavigationItem[]): NavigationMenuItem[] {
  return items.flatMap((item) => {
    // Si el usuario YA ha iniciado sesión (loggedIn === true) y el enlace actual
    // apunta a '/register', 'login' o es el Home público que no debe ver dentro del panel,
    // lo removemos del array devolviendo un elemento vacío al instante.
    if (loggedIn.value) {
      const pathDestino = item.to?.toString().toLowerCase() || ''
      if (pathDestino === '/register' || pathDestino === '/login') {
        return [] // Desaparece del menú de forma automática
      }
    }

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
    const isSessionItem =
      item.to?.toString().toLowerCase().includes('sesion') ||
      item.label?.toLowerCase().includes('sesion')

    const processedItem: NavigationMenuItem = {
      ...item,
      badge: isSessionItem ? totalSesionesVivas.value : item.badge,
      onSelect: () => {
        open.value = false
      }
    }

    // Inyectamos el cierre del drawer lateral automático para mejorar la UX móvil
    // processedItem.onSelect = () => { open.value = false }

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
