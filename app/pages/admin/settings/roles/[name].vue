<script setup lang="ts">
import { reactive, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { masterRoleFormSchema, type MasterRoleForm } from '#shared/utils/sap-form-schema'
import { SAP_OBJECTS_ENUM } from '#shared/utils/sap-schema'
import type { NuxtError } from '#app'

const { refreshSession } = useSAPAuth()

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  roles: ['user']
})

const route = useRoute()
const router = useRouter()
const roleNameParam = route.params.name as string
const toast = useToast()

// Bandera de control para forzar el redibujado reactivo del DOM
const isLoading = ref(true)

// 1. Consultar los datos actuales del rol en el servidor
const { data: currentRole, error } = await useFetch(`/api/admin/roles/${roleNameParam}`)

if (error.value) {
  router.push('/admin/settings/roles')
}

// 2. Estado reactivo del formulario
const state = reactive<MasterRoleForm>({
  name: roleNameParam,
  description: '',
  authorizations: []
})

// 3. Sincronizar e hidratar de forma profunda
watch(currentRole, async (newRole) => {
  if (newRole) {
    state.description = newRole.description || ''

    if (newRole.authorizations && Array.isArray(newRole.authorizations)) {
      state.authorizations = JSON.parse(JSON.stringify(newRole.authorizations))
    } else {
      state.authorizations = []
    }

    // Esperamos que Vue asiente los datos y cambiamos la bandera
    await nextTick()
    isLoading.value = false
  }
}, { immediate: true })

const isSubmitting = ref(false)

// Métodos para agregar y remover filas dinámicas
const addAuthorizationObject = () => {
  state.authorizations.push({
    object: 'S_USER_GRP',
    fields: { ACTVT: [], BUKRS: [], WERKS: [] }
  })
}

const removeAuthorizationObject = (index: number) => {
  if (state.authorizations.length > 1) {
    state.authorizations.splice(index, 1)
  }
}

const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: state
    })

    await refreshSession()
    toast.add({
      title: 'Success',
      description: `Rol Maestro ${state.name} actualizado con éxito.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    // alert(`Rol Maestro ${state.name} actualizado con éxito.`)
    router.push('/admin/settings/roles')
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: `Error al actualizar: ${err.message || 'Error interno'}`,
      icon: 'i-lucide-x',
      color: 'error'
    })
    // alert(`Error al actualizar: ${err.message || 'Error interno'}`)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- <UContainer class="py-10 max-w-4xl"> -->
  <!-- <UCard> -->
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <!-- <template #header> -->
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Modificar Rol Maestro
        </h1>
        <p class="text-sm text-gray-500">
          Editando la matriz del perfil técnico:
          <span class="font-mono text-primary font-bold">{{ roleNameParam }}</span>
        </p>
      </div>
      <UButton
        to="/admin/settings/roles"
        color="primary"
        icon="i-heroicons-arrow-left"
      >
        Volver
      </UButton>
    </div>
    <!-- </template> -->

    <!-- Estado de carga visual integrado si la API tarda -->
    <div
      v-if="isLoading"
      class="p-10 text-center text-gray-400"
    >
      <UIcon
        name="i-heroicons-arrow-path"
        class="animate-spin w-6 h-6 mx-auto mb-2 text-primary"
      />
      <p class="text-xs">
        Cargando matriz de autorizaciones...
      </p>
    </div>

    <!--
      SOLUCIÓN: Al usar :key="isLoading" forzamos a Nuxt UI v3 a reconstruir
      el formulario completo con los objetos ya presentes en memoria.
    -->
    <UForm
      v-else
      :key="String(isLoading)"
      :schema="masterRoleFormSchema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormField
          label="Nombre del Rol Maestro"
          name="name"
          required
          class="md:col-span-1"
        >
          <UInput
            v-model="state.name"
            disabled
            class="opacity-60 cursor-not-allowed"
          />
        </UFormField>

        <UFormField
          label="Descripción del Perfil"
          name="description"
          required
          class="md:col-span-2"
        >
          <UInput
            v-model="state.description"
            placeholder="Actualiza el propósito de este rol..."
          />
        </UFormField>
      </div>

      <USeparator label="Matriz de Objetos Modificable" />

      <!-- Contenedor dinámico de filas -->
      <div class="space-y-4">
        <div
          v-for="(auth, index) in state.authorizations"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl relative space-y-4"
        >
          <!-- Botón Eliminar Fila -->
          <div class="absolute top-2 right-2">
            <UButton
              color="error"
              variant="ghost"
              icon="i-heroicons-trash"
              size="xs"
              :disabled="state.authorizations.length === 1"
              @click="removeAuthorizationObject(index)"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <!-- Selector de Objeto -->
            <UFormField
              :label="`Objeto de Autorización #${index + 1}`"
              :name="`authorizations.${index}.object`"
              required
            >
              <!-- Adaptado a la sintaxis :items de Nuxt UI v3 -->
              <USelectMenu
                v-model="auth.object"
                :items="[...SAP_OBJECTS_ENUM]"
                searchable
              />
            </UFormField>

            <!-- Actividades -->
            <UFormField
              label="Actividades (ACTVT)"
              :name="`authorizations.${index}.fields.ACTVT`"
              required
              class="md:col-span-2"
            >
              <UInputTags
                v-model="auth.fields.ACTVT"
                placeholder="Añade actividades y pulsa Enter..."
              />
            </UFormField>
          </div>

          <!-- Campos Contables / Logísticos -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            <UFormField
              label="Sociedades (BUKRS)"
              :name="`authorizations.${index}.fields.BUKRS`"
            >
              <UInputTags
                v-model="auth.fields.BUKRS"
                placeholder="Sociedades permitidas"
              />
            </UFormField>

            <UFormField
              label="Centros (WERKS)"
              :name="`authorizations.${index}.fields.WERKS`"
            >
              <UInputTags
                v-model="auth.fields.WERKS"
                placeholder="Centros logísticos"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div class="flex justify-between items-center pt-4">
        <UButton
          type="button"
          color="primary"
          variant="soft"
          icon="i-heroicons-plus"
          label="Añadir Objeto"
          @click="addAuthorizationObject"
        />

        <UButton
          type="submit"
          color="primary"
          icon="i-heroicons-document-check"
          :loading="isSubmitting"
          label="Guardar Modificaciones"
        />
      </div>
    </UForm>
  </UPageCard>
  <!-- </UCard> -->
  <!-- </UContainer> -->
</template>
