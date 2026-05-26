<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { loginSchemaConf } from '#shared/zod/login.schema'
import type { LoginSchemaConfType } from '#shared/zod/login.schema'
import type { NuxtError } from '#app'

definePageMeta({
  middleware: ['authenticated']
})

const { fetch: refreshSession } = useUserSession()

const toast = useToast()
const serverError = ref<string | undefined>(undefined)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Enter your email',
  required: true,
  defaultValue: 'ccallado@hotmail.com'
}, {
  name: 'password',
  label: 'Password',
  type: 'password',
  placeholder: 'Enter your password',
  required: true,
  defaultValue: '12341234'
}, {
  name: 'confirmPassword',
  label: 'Confirm Password',
  type: 'password',
  placeholder: 'Confirm your password',
  required: true,
  defaultValue: '12341234'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: 'Login with GitHub' })
  }
}]

async function onSubmit(payload: FormSubmitEvent<LoginSchemaConfType>) {
  try {
    const response = await $fetch('/api/register', {
      method: 'POST',
      body: {
        email: payload.data.email,
        password: payload.data.password
      }
    })
    toast.add({ title: 'Success', description: 'Login successful' })
    console.log({ response })
    await refreshSession()
    await navigateTo('/admin/dashboard')
  } catch (error) {
    const err = error as NuxtError
    toast.add({ title: 'Error', description: err.statusMessage, color: 'error' })
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4">
    <!-- <pre>
      user: {{ user }} loggedIn: {{ loggedIn }}
    </pre> -->
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="loginSchemaConf"
        :fields="fields"
        :providers="providers"
        title="Welcome back!"
        icon="i-lucide-lock"
        @submit="onSubmit"
      >
        <!-- <template #description>
          Don't have an account?
          <ULink
            to="#"
            class="text-primary font-medium"
          >
            Sign up
          </ULink>.
        </template> -->
        <!-- <template #password-hint>
          <ULink
            to="#"
            class="text-primary
            font-medium"
            tabindex="-1"
          >Forgot password?
          </ULink>
        </template> -->
        <template #validation>
          <UAlert
            v-if="serverError"
            color="error"
            icon="i-lucide-info"
            :title="serverError"
          />
        </template>
        <template #footer>
          By signing in, you agree to our
          <ULink
            to="#"
            class="text-primary
            font-medium"
          >Terms of Service</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
