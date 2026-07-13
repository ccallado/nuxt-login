<script lang="ts" setup>
import type { FormSubmitEvent } from '@nuxt/ui'
import { profileSchema } from '#shared/zod/profile.schema'
import type { ProfileSchemaType } from '#shared/zod/profile.schema'

const fileRef = ref<HTMLInputElement>()
const { checkAuthority } = useSAPAuth()

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['USUARIO'],
  autact: ['01'],
  autvar: {}
})

// Nos traemos la sesión del usuario
const { fetch: refreshSession } = useUserSession()

// Pero también podríamos traernos los datos de drizzle
const { data: userDB } = await useFetch('/api/user/profile', {
  method: 'GET'
})

const profileState = reactive<Partial<ProfileSchemaType>>({
  name: userDB?.value?.nombre || '',
  email: userDB?.value?.email || '',
  username: userDB?.value?.name || '',
  avatar: userDB?.value?.avatar || '',
  bio: userDB?.value?.bio || ''
})

// console.log(checkAuthority('F_BKPF_BUK', '01', { BUKRS: '1000' }))

const toast = useToast()
async function onSubmit(event: FormSubmitEvent<ProfileSchemaType>) {
  try {
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: event?.data
    })
    await refreshSession()
  } catch (error) {
    console.error('Error uploading:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to update your settings.',
      icon: 'i-lucide-x',
      color: 'error'
    })
  }

  toast.add({
    title: 'Success',
    description: 'Your settings have been updated.',
    icon: 'i-lucide-check',
    color: 'success'
  })
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  const file = input.files[0]!

  profileState.avatar = URL.createObjectURL(file)

  // Enviar al servidor
  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const response = await $fetch('/api/user/upload-avatar', {
      method: 'PUT',
      body: formData
    })

    // Actualizar con la URL del servidor
    profileState.avatar = response.avatar
  } catch (error) {
    console.error('Error uploading:', error)
  }
}

function onFileClick() {
  fileRef.value?.click()
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profileState"
    @submit="onSubmit"
  >
    <nav>
      <NuxtLink to="/">Inicio</NuxtLink>

      <!-- Este enlace solo lo verá el administrador -->
      <!-- Verificar si puede CREAR (01) en la SOCIEDAD 1000 -->
      <div v-if="checkAuthority('ADMIN', '*', { ROLES: '*' })">
        <NuxtLink to="/admin/dashboard">Configuración avanzada</NuxtLink>
      </div>
    </nav>

    <UPageCard
      title="Profile"
      description="These informations will be displayed publicly."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Grabar cambios"
        color="primary"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Will appear on receipts, invoices, and other communication."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profileState.name"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <div v-if="checkAuthority('ADMIN', '*', { ROLES: '*' })">
        <UFormField
          name="email"
          label="Email"
          description="Used to sign in, for email receipts and product updates."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="profileState.email"
            type="email"
            autocomplete="off"
          />
        </UFormField>
        <USeparator />
        <UFormField
          name="username"
          label="Username"
          description="Your unique username for logging in and your profile URL."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="profileState.username"
            type="username"
            autocomplete="off"
          />
        </UFormField>
        <USeparator />
      </div>
      <UFormField
        name="avatar"
        label="Avatar"
        description="JPG, GIF or PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar
            :src="profileState.avatar"
            :alt="profileState.name"
            size="lg"
          />
          <UButton
            label="Elegir"
            color="primary"
            @click="onFileClick"
          />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          >
        </div>
      </UFormField>
      <USeparator />
      <UFormField
        name="bio"
        label="Bio"
        description="Brief description for your profile. URLs are hyperlinked."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profileState.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
      <!-- Verificar si puede CREAR (01) en la SOCIEDAD 1000 -->
      <div v-if="checkAuthority('F_BKPF_BUK', '01', { BUKRS: '1000' })">
        <USeparator />
        <!-- <UFormField
          name="role"
          label="Roles"
          description="Roles que tiene el usuario"
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInputTags
            v-model="profileState.role"
            placeholder="Escribe y presiona enter..."
            color="primary"
            variant="outline"
            class="w-full"
          />
        </UFormField> -->
      </div>
    </UPageCard>
  </UForm>
</template>
