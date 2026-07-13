<script setup lang="ts">
// Inyectamos la sesión del cliente para contrastar cuál es la activa
const { user } = useUserSession()

// Consumimos el endpoint que creamos en el paso anterior
const { data: list, refresh } = await useFetch('/api/auth/sessions')

// Función para revocar accesos
async function closeSession(id: string) {
  await $fetch('/api/auth/sessions', {
    method: 'DELETE',
    body: { targetSessionId: id }
  })
  await refresh() // Actualiza la lista en pantalla
}
</script>

<template>
  <div class="space-y-4">
    <div class="border-b pb-2">
      <h2 class="text-xl font-bold">
        Sesiones del dispositivo
      </h2>
      <p class="text-sm text-neutral-500">
        Historial de navegadores con acceso a tu cuenta.
      </p>
    </div>

    <div class="divide-y border rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
      <div
        v-for="item in list"
        :key="item.id"
        class="flex justify-between items-center p-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
      >
        <div class="flex items-center gap-3">
          <UIcon
            name="i-lucide-monitor"
            class="w-6 h-6 text-neutral-400 shrink-0"
          />
          <div>
            <div class="flex items-center gap-2">
              <p class="font-medium text-sm text-neutral-800 dark:text-neutral-200">
                {{ item.dispositivo }}
              </p>
              <UBadge
                v-if="item.sesionId === user?.sessionId"
                size="xs"
                color="primary"
                variant="subtle"
              >
                Sesión actual
              </UBadge>
            </div>
            <p class="text-xs text-neutral-400">
              IP: {{ item.direccionIp }} • Conectado: {{ new Date(item.sesionCreadaEn).toLocaleString() }} •
              Nombre: {{ item.usuarioNombreReal }}
            </p>
            <!-- <p class="text-xs text-neutral-400">
              Id: {{ item.sesionId }}
            </p> -->
          </div>
        </div>

        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-log-out"
          label="Cerrar sesión"
          @click="closeSession(item.sesionId)"
        />
      </div>
    </div>
  </div>
</template>
