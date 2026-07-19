<script lang="ts" setup>
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['PROPIEDADES'],
  autact: ['01'],
  autvar: ['']
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

      <UDashboardToolbar
        class="overflow-visible"
      >
        <SubMenuDinamico />        <!-- NOTE: El array reactivo computado 'links' filtrará las pestañas automáticamente aquí -->
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-7xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
