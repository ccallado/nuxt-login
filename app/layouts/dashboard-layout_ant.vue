<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const open = ref(false)

const links = [[{
  label: 'Home',
  icon: 'i-lucide-users',
  to: '/',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Login',
  icon: 'i-lucide-house',
  to: '/login',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Register',
  icon: 'i-lucide-inbox',
  to: '/register',
  badge: '4',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'dashboard',
  icon: 'i-lucide-users',
  to: '/admin/dashboard',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Settings',
  to: '/admin/settings',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Mi perfil',
    to: '/admin/settings',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Usuarios',
    to: '/admin/settings/members',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Sesiones',
    to: '/admin/settings/sesiones',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Roles',
    to: '/admin/settings/roles',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Cambio de contraseña',
    to: '/admin/settings/security',
    onSelect: () => {
      open.value = false
    }
  }]
}], [{
  label: 'Feedback',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
},
{
  label: 'Help & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt-ui-templates/dashboard',
  target: '_blank'
}
]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Go to',
  items: links.flat()
}, {
  id: 'code',
  label: 'Code',
  items: [{
    id: 'source',
    label: 'View page source',
    icon: 'i-simple-icons-github',
    to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${route.path === '/' ? '/index' : route.path}.vue`,
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
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
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
