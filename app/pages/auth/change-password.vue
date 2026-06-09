<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { newpasswordSchema } from '#shared/zod/new-password.schema'
import type { NewpasswordSchemaType } from '#shared/zod/new-password.schema'
import type { NuxtError } from '#app'

// definePageMeta({
//   middleware: ['authenticated'],
//   layout: 'dashboard-layout',
//  roles: ['user']
// })

const toast = useToast()
const route = useRoute()
const token = route.query.token
const loading = ref(false)

const password = reactive<Partial<NewpasswordSchemaType>>({
  userId: 0,
  new1: '',
  new2: ''
})

try {
  const { data, erroro } = await useFetch('/api/user/verify-token', {
    method: 'POST',
    body: { token }
  })
  password.userId = data.value.userId
} catch (error) {
  const err = error as NuxtError
  throw createError({
    statusCode: 400,
    message: err.statusText
  })
}

if (password.userId === 0) {
  // mostrar error o redirigir
  throw createError({
    statusCode: 400,
    message: 'Token inválido o expirado'
  })
}

async function onSubmit(event: FormSubmitEvent<NewpasswordSchemaType>) {
  try {
    loading.value = true
    await $fetch('/api/user/update-new-password', {
      method: 'PUT',
      body: event?.data
    })
    toast.add({
      title: 'Success',
      description: 'Your password have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    await navigateTo('/login')
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText || 'Failed to update your password.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-screen">
    <UPageCard
      title="Password"
      description="Escribe tu nueva contraseña."
      variant="subtle"
    >
      <UForm
        :schema="newpasswordSchema"
        :state="password"
        :loading="loading"
        class="flex flex-col gap-4 max-w-xs"
        @submit="onSubmit"
      >
        <UFormField name="userId">
          <UInput
            v-model="password.userId"
            type="hidden"
            placeholder="Id del usuario"
            class="w-full"
          />
        </UFormField>

        <UFormField name="new1">
          <UInput
            v-model="password.new1"
            type="password"
            placeholder="New password"
            class="w-full"
          />
        </UFormField>

        <UFormField name="new2">
          <UInput
            v-model="password.new2"
            type="password"
            placeholder="Retype new password"
            class="w-full"
          />
        </UFormField>

        <UButton
          label="Update"
          class="w-fit"
          type="submit"
        />
      </UForm>
    </UPageCard>

    <!-- <UPageCard
      title="Account"
      description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
      class="bg-linear-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <UButton
          label="Delete account"
          color="error"
        />
      </template>
    </UPageCard> -->
  </div>
</template>
