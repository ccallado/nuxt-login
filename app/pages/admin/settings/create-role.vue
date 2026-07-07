<script setup lang="ts">
import { reactive, ref } from 'vue'
import { masterRoleFormSchema, type MasterRoleForm } from '#shared/utils/sap-form-schema'
import { SAP_OBJECTS_ENUM } from '#shared/utils/sap-schema'
import { useRouter } from 'vue-router'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  roles: ['user']
})

const toast = useToast()
const router = useRouter()

// 1. Inicializar el estado del formulario con la estructura requerida
const state = reactive<MasterRoleForm>({
  name: 'Z_',
  description: '',
  authorizations: [
    {
      object: 'F_BKPF_BUK', // Objeto por defecto para la primera fila
      fields: {
        ACTVT: ['03'], // '03' es Visualizar por defecto en SAP
        BUKRS: ['*'], // '*' equivale a todas las sociedades
        WERKS: []
      }
    }
  ]
})

const isSubmitting = ref(false)

// 2. Funciones para manipular los objetos dinámicamente
const addAuthorizationObject = () => {
  state.authorizations.push({
    object: 'S_USER_GRP',
    fields: {
      ACTVT: [],
      BUKRS: [],
      WERKS: []
    }
  })
}

const removeAuthorizationObject = (index: number) => {
  if (state.authorizations.length > 1) {
    state.authorizations.splice(index, 1)
  }
}

// 3. Envío del formulario al servidor Nuxt / Drizzle
const onSubmit = async () => {
  isSubmitting.value = true
  try {
    // const response = await $fetch('/api/admin/roles', {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: state
    })

    // Notificación de éxito (Ajusta según utilices Nuxt UI Toast)
    toast.add({
      title: 'Success',
      description: `Rol Maestro ${state.name} creado exitosamente.`,
      icon: 'i-lucide-check',
      color: 'success'
    })
    // alert(`Rol Maestro ${state.name} creado exitosamente.`)
    router.push('/admin/settings/roles')
  } catch (error) {
    // TypeScript valida el tipo en tiempo de compilación
    const errorMessage = error instanceof Error ? error.message : 'No se pudo guardar el rol'

    toast.add({
      title: 'Error',
      description: `Error: ${errorMessage || 'No se pudo guardar el rol'}`,
      icon: 'i-lucide-x',
      color: 'error'
    })
    // alert(`Error: ${error.message || 'No se pudo guardar el rol'}`)
  } finally {
    isSubmitting.value = false
    await navigateTo('/admin/settings/roles')
  }
}
</script>

<template>
  <UPageCard>
    <!-- Eliminamos el template #header y usamos los atributos nativos estructurados -->
    <template #header>
      <!-- Añadimos 'static' al div para que el Badge busque el borde real de la tarjeta UPageCard -->
      <div class="static">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            Generador de Roles Maestros (PFCG)
          </h1>
          <p class="text-sm text-gray-500">
            Configura perfiles globales emulando la matriz de autorizaciones de SAP
          </p>
        </div>

        <!-- Este Badge romperá el contenedor y se alineará perfectamente a la derecha -->
        <UBadge
          color="primary"
          variant="subtle"
          class="absolute top-6 right-6 whitespace-nowrap"
        >
          50 Objetos Soportados
        </UBadge>
      </div>
    </template>

    <!-- Tu <UForm> actual continúa exactamente igual aquí abajo -->
    <!-- Formulario Principal de Nuxt UI -->
    <UForm
      :schema="masterRoleFormSchema"
      :state="state"
      class="space-y-6"
      @submit="onSubmit"
    >
      <!-- Datos de Identificación -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UFormField
          label="Nombre del Rol Maestro"
          name="name"
          required
          class="md:col-span-1"
        >
          <UInput
            v-model="state.name"
            placeholder="Ej: Z_CONTADOR_AVANZADO"
            uppercase
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
            placeholder="Acceso de lectura/escritura a finanzas y control de almacén"
          />
        </UFormField>
      </div>

      <USeparator label="Objetos de Autorización Asignados" />

      <!-- Listado Dinámico de Objetos (Filas del Perfil) -->
      <div class="space-y-4">
        <div
          v-for="(auth, index) in state.authorizations"
          :key="index"
          class="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl relative space-y-4"
        >
          <!-- Botón para eliminar fila -->
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

          <!-- Fila: Selector de Objeto -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <UFormField
              :label="`Objeto de Autorización #${index + 1}`"
              :name="`authorizations.${index}.object`"
              required
            >
              <USelectMenu
                v-model="auth.object"
                :options="[...SAP_OBJECTS_ENUM]"
                searchable
                placeholder="Buscar entre los 50 objetos..."
              />
            </UFormField>

            <!-- Fila: Actividades (ACTVT) -->
            <UFormField
              label="Actividades (ACTVT)"
              :name="`authorizations.${index}.fields.ACTVT`"
              required
              class="md:col-span-2"
            >
              <UInputTags
                v-model="auth.fields.ACTVT"
                placeholder="Escribe '01', '02', '03' o '*' y pulsa Enter..."
              />
            </UFormField>
          </div>

          <!-- Campos Organizacionales Condicionales (Filtros Avanzados SAP) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3">
            <UFormField
              label="Sociedades permitidas (BUKRS)"
              :name="`authorizations.${index}.fields.BUKRS`"
            >
              <UInputTags
                v-model="auth.fields.BUKRS"
                placeholder="Ej: 1000, 2000, o '*' para todas"
                color="neutral"
              />
            </UFormField>

            <UFormField
              label="Centros logísticos (WERKS)"
              :name="`authorizations.${index}.fields.WERKS`"
            >
              <UInputTags
                v-model="auth.fields.WERKS"
                placeholder="Ej: ES01, MX02"
                color="secondary"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <!-- Acciones Inferiores -->
      <div class="flex justify-between items-center pt-4">
        <UButton
          type="button"
          color="primary"
          variant="soft"
          icon="i-heroicons-plus"
          label="Añadir Objeto de Autorización"
          @click="addAuthorizationObject"
        />

        <UButton
          type="submit"
          color="primary"
          icon="i-heroicons-check-circle"
          :loading="isSubmitting"
          label="Guardar Rol Maestro en Base de Datos"
        />
      </div>
    </UForm>
  </UPageCard>
</template>
