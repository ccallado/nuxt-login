<script lang="ts" setup>
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
  // autobj: ['ADMIN'],
  // autact: ['*'],
  // autvar: ['']
})
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
        <SubMenuDinamico />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-7xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
