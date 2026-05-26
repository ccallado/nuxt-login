<script lang="ts" setup>
const { user } = useUserSession()
</script>

<template>
  <div>
    Navbar: {{ user?.email }}
  </div>
</template>
