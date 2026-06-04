<script setup lang="ts">
import { forgotPasswordSchema } from '#shared/zod/forgot-password.schema'
import type { ForgotPasswordSchemaType } from '#shared/zod/forgot-password.schema'
import type { NuxtError } from '#app'

const toast = useToast()

const state = reactive({ email: 'ccallado@hotmail.com' })

const onSubmit = async (event: { data: ForgotPasswordSchemaType }) => {
  try {
    await $fetch('/api/user/forgot-password', {
      method: 'POST',
      body: event.data
    })
    toast.add({
      title: 'Success',
      description: 'If the email exist, a reset link has been sent.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: err.statusText || 'No es un correo válido',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-screen">
    <UPageCard
      class="w-full max-w-md"
      title="Forgot Password"
      description="Enter your email to receive a password reset link"
      variant="subtle"
    >
      <UForm
        :schema="forgotPasswordSchema"
        :state="state"
        class="flex flex-col gap-4"
        @submit="onSubmit"
      >
        <UFormField name="email">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="Enter your email"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          class="w-full"
        >
          Send Reset Link
        </UButton>
      </UForm>
    </UPageCard>
  </div>
</template>
