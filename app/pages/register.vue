<script setup lang="ts">
import type { FormSubmitEvent, AuthFormField } from '@nuxt/ui'
import { loginSchemaConf } from '#shared/zod/login.schema'
import type { LoginSchemaConfType } from '#shared/zod/login.schema'
import type { NuxtError } from '#app'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'default-layout'
})

const { fetch: refreshSession } = useUserSession()

const toast = useToast()
const loading = ref(false)

const serverError = ref<string | undefined>(undefined)

const fields: AuthFormField[] = [{
  name: 'email',
  type: 'email',
  label: 'Email',
  placeholder: 'Introduce tu email',
  required: true,
  defaultValue: 'ccallado@hotmail.com'
}, {
  name: 'password',
  label: 'Contraseña',
  type: 'password',
  placeholder: 'Introduce tu contraseña',
  required: true,
  defaultValue: '12341234'
}, {
  name: 'confirmPassword',
  label: 'Confirma la Contraseña',
  type: 'password',
  placeholder: 'Confirma tu contraseña',
  required: true,
  defaultValue: '12341234'
}]

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    window.location.href = '/api/auth/google'
    toast.add({ title: 'Google', description: 'Login with Google' })
  }
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    window.location.href = '/api/auth/github'
    // toast.add({ title: 'GitHub', description: 'Login with GitHub' })
  }
}]

async function onSubmit(payload: FormSubmitEvent<LoginSchemaConfType>) {
  try {
    loading.value = true
    const response = await $fetch('/api/user/register', {
      method: 'POST',
      body: {
        email: payload.data.email,
        password: payload.data.password
      }
    })
    toast.add({ title: 'Atención', description: 'Verifique el correo.' })
    // await refreshSession()
    // await navigateTo('/admin/dashboard')
  } catch (error) {
    const err = error as NuxtError
    toast.add({ title: 'Error', description: err.statusText, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 h-screen">
    <!-- <pre>
      user: {{ user }} loggedIn: {{ loggedIn }}
    </pre> -->
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="loginSchemaConf"
        :fields="fields"
        :providers="providers"
        :loading="loading"
        title="¡Bienvenido!"
        icon="i-lucide-lock"
        @submit="onSubmit"
      >
        <!-- <template #description>
          ¿No tienes una cuenta?
          <ULink
            to="#"
            class="text-primary font-medium"
          >
            Regístrate
          </ULink>.
        </template> -->
        <!-- <template #password-hint>
          <ULink
            to="#"
            class="text-primary
            font-medium"
            tabindex="-1"
          >¿Olvidaste la contraseña?
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
          Al iniciar sesión, aceptas nuestros términos y condiciones.
          <ULink
            to="#"
            class="text-primary
            font-medium"
          >Condiciones del servicio</ULink>.
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>
