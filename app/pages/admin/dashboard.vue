<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
})

const { user, clear: clearSession } = useUserSession()
async function logout() {
  await clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <UDashboardPanel id="settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <h1>Bienvenido {{ user.email }}</h1>
        <u-button @click="logout">
          Logout
        </u-button>
      </div>
    </template>
  </UDashboardPanel>
</template>
