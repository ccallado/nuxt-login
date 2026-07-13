<script setup lang="ts">
import { computed, ref } from 'vue'
import type { NavigationMenuItem } from '@nuxt/ui'
import { useRoute } from 'vue-router'
// 1. Importación de tu composable
import { useSAPAuth } from '~/composables/useSAPAuth'

interface CustomNavigationItem extends NavigationMenuItem {
  objReq?: string
  actReq?: string
  varReq?: string
  children?: CustomNavigationItem[]
}

const route = useRoute()
const open = ref(false)
const collapsed = ref(false)
const { checkAuthority } = useSAPAuth()

// 1. 👑 NUEVO: Consultamos las sesiones en tiempo real desde tu API de Postgres
const { data: sesionesData } = await useFetch<any[]>('/api/auth/sessions')

// 2. 👑 TRANSFORMACIÓN: rawItems ahora es un computed para admitir el conteo dinámico
// Estructura original de dos bloques independientes de menús ([][])
const rawItems = computed<CustomNavigationItem[][]>(() => {
  // Calculamos la longitud del array de Postgres de forma segura devolviendo un string
  const totalSesiones = sesionesData.value?.length ? String(sesionesData.value.length) : '0'

  return [
    [{
      label: 'Home',
      icon: 'i-lucide-house',
      to: '/',
      onSelect: () => { open.value = false }
    }, {
      label: 'Login',
      icon: 'i-lucide-users',
      to: '/login',
      onSelect: () => { open.value = false }
    }, {
      label: 'Register',
      icon: 'i-lucide-inbox',
      to: '/register',
      onSelect: () => { open.value = false }
    }, {
      label: 'dashboard',
      icon: 'i-lucide-settings', // 👑 Corregido icono duplicado en tu objeto original
      objReq: 'USUARIO',
      actReq: '01',
      varReq: '',
      to: '/admin/dashboard',
      onSelect: () => { open.value = false }
    }, {
      label: 'Settings',
      to: '/admin/settings',
      objReq: 'ADMIN',
      actReq: '01',
      varReq: '',
      icon: 'i-lucide-settings',
      defaultOpen: true,
      type: 'trigger',
      children: [{
        label: 'Mi perfil',
        to: '/admin/settings',
        exact: true,
        onSelect: () => { open.value = false }
      }, {
        label: 'Usuarios',
        to: '/admin/settings/members',
        objReq: 'ADMIN',
        actReq: '01',
        varReq: '',
        onSelect: () => { open.value = false }
      }, {
        label: 'Sesiones',
        to: '/admin/settings/sesiones',
        objReq: 'ADMIN',
        actReq: '01',
        varReq: '',
        // 👑 INYECCIÓN DINÁMICA: Reemplazamos el '4' estático por el conteo real de Postgres
        badge: totalSesiones,
        onSelect: () => { open.value = false }
      }, {
        label: 'Roles',
        to: '/admin/settings/roles',
        objReq: 'ADMIN',
        actReq: '01',
        varReq: '',
        onSelect: () => { open.value = false }
      }, {
        label: 'Cambio de Contraseña',
        to: '/admin/settings/security',
        objReq: 'USUARIO',
        actReq: '01',
        varReq: '',
        onSelect: () => { open.value = false }
      }]
    }, {
      label: 'Propiedades',
      to: '/propiedades',
      icon: 'i-lucide-house-plus',
      objReq: 'USUARIO',
      actReq: '01',
      varReq: '',
      onSelect: () => { open.value = false }
    }],
    [{
      label: 'Feedback',
      icon: 'i-lucide-message-circle',
      to: 'https://github.com',
      target: '_blank'
    }, {
      label: 'Help & Support',
      icon: 'i-lucide-info',
      to: 'https://github.com',
      target: '_blank'
    }]
  ]
})

// Nueva función recursiva que FILTRA (remueve) los ítems no autorizados
function processMenuItems(items: CustomNavigationItem[]): NavigationMenuItem[] {
  return items.flatMap((item) => {
    const hasNoRestrictions = !item.objReq && !item.actReq && !item.varReq

    // Construimos el filtro organizacional basándonos en varReq.
    // Como tu función en el composable evalúa Object.entries(orgFilters),
    // mapeamos varReq a la clave técnica de campo que use tu sistema (ej: 'FIELD' o tu clave SAP).
    const orgFilters = item.varReq ? { FIELD: item.varReq } : undefined

    // 🌟 CORRECCIÓN CLAVE: Enviamos parámetros separados a checkAuthority en lugar de un objeto único
    const isAuthorized = hasNoRestrictions || checkAuthority(
      item.objReq ?? '',
      item.actReq ?? '',
      orgFilters
    )

    // Si no está autorizado, devolvemos un array vacío para que flatMap lo elimine
    if (!isAuthorized) {
      return []
    }

    const processedItem: NavigationMenuItem = { ...item }

    // Procesamos recursivamente también los submenús (children)
    if (item.children) {
      processedItem.children = processMenuItems(item.children)
    }

    return [processedItem]
  })
}

// Mapeamos los dos grupos independientes
const menuItems = computed<NavigationMenuItem[][]>(() => {
  return rawItems.value.map(group => processMenuItems(group))
})

// Mapeo plano para el buscador global de la app
const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: menuItems.value.flat().map((item) => {
    // Extraemos propiedades potencialmente conflictivas para el buscador
    const { chip, children, type, defaultOpen, onSelect, ...validProps } = item

    return {
      ...validProps,
      id: item.to?.toString() || item.label,
      // Si chip existía y era un objeto, lo preservamos; si era booleano, lo descartamos
      chip: typeof chip === 'object' ? chip : undefined
    }
  })
},
{
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
    target: '_blank'
  }]
}])
</script>

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
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />
        <!-- Renderiza solo los enlaces autorizados del primer grupo -->
        <UNavigationMenu
          :collapsed="collapsed"
          :items="menuItems[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <!-- Renderiza solo los enlaces autorizados del segundo grupo -->
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
