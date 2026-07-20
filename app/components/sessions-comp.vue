<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const config = useRuntimeConfig()
// console.log({ intervalo: config.public.intervaloTiempoSesiones })

// Inyectamos la sesión del cliente para contrastar cuál es la activa
const { user } = useUserSession()

// 2. Disparador numérico para resetear la caché
const triggerRef = ref(0)

// Consumimos el endpoint que creamos en el paso anterior
const { data: list, refresh } = await useAsyncData(
  'sessions-list-data',
  () => $fetch<any[]>('/api/auth/sessions'),
  {
    watch: [triggerRef],
    lazy: true,
    default: () => [] // Evita que 'list' sea null al arrancar
  }
)

// Función para revocar accesos
async function closeSession(id: string) {
  if (!id) return
  try {
    await $fetch('/api/auth/sessions', {
      method: 'DELETE',
      body: { targetSessionId: id }
    })
    triggerRef.value++
  } catch (err) {
    console.error('Error al revocar la sesión:', err)
  }
}

// Control del temporizador
let refreshInterval: any = null

onMounted(async () => {
  // Disparamos un refresco manual inicial para asegurar que la lista cargue al milisegundo
  await refresh()
  // console.log('🏁 [SESSIONS] Componente montado con éxito en el cliente. Activando temporizador...')

  // 👑 EL RELOJ DE 15 SEGUNDOS INEXTINGUIBLE:
  // Incrementamos el trigger de forma atómica. Esto forzará el repintado en pantalla sí o sí.
  // console.log({ intervalo: config.public.intervaloTiempoSesiones })
  refreshInterval = setInterval(() => {
    triggerRef.value++
    // Imprime un número incremental para que veas en la consola que avanza
    // console.log(`⏰ [SESSIONS] Ciclo ejecutado con éxito. Vuelta número: ${triggerRef.value}`)
  }, config.public.intervaloTiempoSesiones)
  // }, 15000)
})

// Limpieza estricta de memoria al cambiar de pestaña
onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    // console.log('🧹 [SESSIONS] Temporizador destruido limpiamente.')
  }
})
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
        v-for="item in (list || [])"
        :key="item.sesionId"
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
              IP: {{ item.direccionIp }}
              • Conectado: {{ new Date(item.sesionCreadaEn).toLocaleString() }}
              • UltCambio: {{ new Date(item.sesionModificadaA).toLocaleString() }}
              • Correo: {{ item.usuarioEmail }}
            </p>
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
      <!-- Estado visual si no hay sesiones vivas en el array -->
      <div v-if="!(list || []).length" class="p-8 text-center text-sm text-neutral-400 italic">
        Buscando dispositivos activos en PostgreSQL...
      </div>
    </div>
  </div>
</template>
