<script setup lang="ts">
// 1. Definir los roles permitidos que recibirá el componente por props
const props = defineProps<{
  roles: ('user' | 'editor' | 'admin')[]
}>()

// 2. Extraer el estado de la sesión de nuxt-auth-utils
const { user, loggedIn } = useUserSession()

// 3. Evaluar si el usuario está logueado y su rol está en la lista permitida
const hasAccess = computed(() => {
  // Asegúrate de validar que existan los datos primero
  if (!loggedIn.value || !user.value || !user.value.role) return false

  // Si user.value.role es un arreglo, usamos .some()
  if (Array.isArray(user.value.role)) {
    return user.value.role.some(r => props.roles.includes(r as any))
  }

  // Si por alguna razón sigue siendo un string único (respaldo)
  return props.roles.includes(user.value.role as any)
})
</script>

<template>
  <!-- Renderiza el contenido del slot únicamente si pasa el control de acceso -->
  <slot v-if="hasAccess" />
</template>
