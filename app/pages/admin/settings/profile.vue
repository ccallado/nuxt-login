<script setup lang="ts">
// Cargamos las sesiones del endpoint
const { data: activeSessions, refresh } = await useFetch('/api/auth/sessions')

// Función para cerrar la sesión seleccionada
async function revokeSession(sessionId: string) {
  await $fetch('/api/auth/sessions', {
    method: 'DELETE',
    body: { targetSessionId: sessionId }
  })

  // Refrescamos la lista de la pantalla
  await refresh()
}
</script>

<template>
  <div class="p-6">
    <h3 class="text-lg font-bold mb-4">
      Dispositivos con sesión abierta
    </h3>

    <div class="space-y-4">
      <div
        v-for="sess in activeSessions"
        :key="sess.sesionId"
        class="flex justify-between items-center p-4 border rounded-lg"
      >
        <div>
          <p class="font-semibold text-sm">
            {{ sess.dispositivo }}
          </p>
          <span class="text-xs text-gray-500">
            IP: {{ sess.direccionIp }}
            • Conectado: {{ new Date(sess.sesionCreadaEn).toLocaleString() }}
            • UltCambio: {{ new Date(sess.sesionModificadaA).toLocaleString() }}
            • Correo: {{ sess.usuarioEmail }}
          </span>
        </div>

        <UButton
          color="error"
          variant="ghost"
          label="Cerrar sesión"
          @click="revokeSession(sess.sesionId)"
        />
      </div>
    </div>
  </div>
</template>
