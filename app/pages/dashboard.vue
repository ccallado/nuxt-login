<script setup lang="ts">

definePageMeta({
  middleware: ['authenticated']
})
const { user, clear: clearSession } = useUserSession()
async function logout() {
  await clearSession()
  await navigateTo('/login')
}
</script>

<template>
  <div>
    <h1>Bienvenido {{ user.name }}</h1>
    <u-button @click="logout">
      Logout
    </u-button>
  </div>
</template>
