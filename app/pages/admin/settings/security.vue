<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import { passwordSchema } from '#shared/zod/password.schema'
import type { PasswordSchemaType } from '#shared/zod/password.schema'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
})

const password = reactive<Partial<PasswordSchemaType>>({
  current: '',
  new1: '',
  new2: ''
})

const validate = (state: Partial<PasswordSchemaType>): FormError[] => {
  const errors: FormError[] = []
  if (state.current && state.new1 && state.current === state.new1) {
    errors.push({ name: 'new', message: 'Passwords must be different' })
  }
  return errors
}

const toast = useToast()

const { user, clear: clearSession } = useUserSession()

async function onSubmit(event: FormSubmitEvent<PasswordSchemaType>) {
  try {
    await $fetch('/api/user/update-password', {
      method: 'PUT',
      body: event?.data
    })
    toast.add({
      title: 'Success',
      description: 'Your password have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
    await clearSession()
    await navigateTo('/login')
  } catch (error) {
    toast.add({
      title: 'Error',
      description: 'Failed to update your password.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }
}
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <UForm
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onSubmit"
    >
      <UFormField name="current">
        <UInput
          v-model="password.current"
          type="password"
          placeholder="Current password"
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
</template>
