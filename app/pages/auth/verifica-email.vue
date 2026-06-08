<script setup lang="ts">
const route = useRoute()
const token = route.query.token

const { fetch: refreshSession } = useUserSession()

try {
  const { data, erroro } = await useFetch('/api/user/verify-email', {
    method: 'POST',
    body: { token }
  })
  // console.log(data.value)
  const email = data.value.mail
  // console.log(email)
  await refreshSession()
  await navigateTo('/admin/dashboard')
} catch (error) {
  const err = error as NuxtError
  throw createError({
    statusCode: 400,
    message: err.statusText
  })
}
</script>

<template>
  <div>
    .
  </div>
</template>
