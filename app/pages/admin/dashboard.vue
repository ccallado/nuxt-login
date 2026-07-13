<script setup lang="ts">
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
  // autobj: ['ADMIN'],
  // autact: ['*'],
  // autvar: {}
})

const { session, user, clear: clearSession } = useUserSession()

async function logout() {
  // console.log('Usuario actual en sesión:', user.value)

  // 👑 CORRECCIÓN: 'sessionId' se encuentra en la raíz de 'session.value', no en 'user.value'
  // Usamos un respaldo alternativo por seguridad en caso de que varíe tu interfaz
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessionId = user.value?.sessionId || (user.value as any)?.sessionId || (user.value as any)?.sessionId

  if (sessionId) {
    try {
      // Notificamos a la API de PostgreSQL para revocar la sesión activa antes de borrar la cookie
      await $fetch('/api/auth/sessions', {
        method: 'DELETE',
        body: { targetSessionId: sessionId }
      })
      // console.log(`Sesión ${sessionId} eliminada de Postgres exitosamente.`)
      await clearSession()
    } catch (error) {
      console.warn('Aviso durante el cierre de sesión (omitido para asegurar la salida):', error)
    } finally {
      user.value = null
      if (session.value) {
        session.value = null
      }
      await navigateTo('/login', { replace: true })
    }
  }
}
</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <!-- <UDashboardToolbar> -->
      <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
      <!-- <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar> -->
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <h1>Bienvenido {{ user?.email }}</h1>
        <u-button @click="logout">
          Logout
        </u-button>
      </div>
    </template>
  </UDashboardPanel>
</template>
