<template>
  <UPageCard
    title="Modificar Rol Maestro"
    description="Configura la matriz técnica de control basada en objetos dinámicos de SAP."
    variant="subtle"
  >
    <!-- Encabezado de la página -->
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

    <!-- 1. Estado de carga visual integrado si la API tarda -->
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

    <!-- 2. Formulario principal (Se muestra solo cuando isLoading es false) -->
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

      <!-- Contenedor dinámico de filas de la Base de Datos -->
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
              @click="removeAuthorizationObject(Number(index))"
            />
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <!-- Selector de Objeto Dinámico de Base de Datos -->
            <UFormField
              :label="`Objeto de Autorización #${Number(index) + 1}`"
              :name="`authorizations.${index}.object`"
              required
            >
              <USelectMenu
                v-model="auth.object"
                :items="sapObjectsList"
                searchable
                placeholder="Seleccionar objeto técnico..."
                @update:model-value="(val) => onObjectChange(Number(index), val)"
              />
            </UFormField>

            <!-- La Actividad siempre se renderiza ya que es obligatoria en SAP -->
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

          <!-- SECCIÓN DINÁMICA: Renderiza los campos específicos según el objeto seleccionado -->
          <div
            v-if="getFieldsForObject(auth.object).length > 0"
            class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 dark:border-gray-800 pt-3"
          >
            <div
              v-for="fieldName in getFieldsForObject(auth.object)"
              :key="fieldName"
            >
              <UFormField
                :label="`${fieldName} (Filtro Organizacional)`"
                :name="`authorizations.${index}.fields.${fieldName}`"
              >
                <UInputTags
                  v-model="auth.fields[fieldName]"
                  :placeholder="`Añadir valores para ${fieldName}...`"
                />
              </UFormField>
            </div>
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
</template>

<script setup lang="ts">
import { reactive, ref, watch, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { masterRoleFormSchema } from '#shared/utils/sap-form-schema'
import type { NuxtError } from '#app'

const { refreshSession } = useSAPAuth()

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['ADMIN'],
  autact: ['*'],
  // autvar: [{ ROLES: '*' }, { USUARIOS: '*' }]
  autvar: { ROLES: '*' }
})

const route = useRoute()
const router = useRouter()
const roleNameParam = route.params.name as string
const toast = useToast()

const isLoading = ref(true)

// Lanzamos ambas peticiones en paralelo protegidas contra bloqueos mutuos
const [roleResponse, masterResponse] = await Promise.all([
  useFetch(`/api/admin/roles/${roleNameParam}`),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  useFetch<any[]>('/api/admin/sap-objects-configuration')
])

const currentRole = roleResponse.data
const roleError = roleResponse.error
const sapMasterData = masterResponse.data

if (roleError.value) {
  router.push('/admin/settings/roles')
}

// Mapeo seguro con encadenamiento opcional para evitar fallos de lectura tempranos
const sapObjectsList = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return sapMasterData.value?.map((item: any) => item.objectName) || []
})

// Estado reactivo inicializado
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const state = reactive<any>({
  name: roleNameParam,
  description: '',
  authorizations: []
})

// Sincronizar de forma profunda los datos provenientes de Postgres
watch(currentRole, async (newRole) => {
  if (newRole) {
    state.description = newRole.description || ''

    if (newRole.authorizations && Array.isArray(newRole.authorizations)) {
      state.authorizations = JSON.parse(JSON.stringify(newRole.authorizations))
    } else {
      state.authorizations = []
    }

    await nextTick()
    isLoading.value = false
  }
}, { immediate: true })

const isSubmitting = ref(false)

// Reconstruir estructura reactiva interna de campos técnicos por índice
const onObjectChange = (index: number, newObjectName: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const configuracionObjeto = sapMasterData.value?.find((o: any) => o.objectName === newObjectName)
  const nuevosCampos: Record<string, string[]> = {}

  if (configuracionObjeto && configuracionObjeto.fields) {
    configuracionObjeto.fields.forEach((fieldName: string) => {
      nuevosCampos[fieldName] = []
    })
  }

  state.authorizations[index].fields = nuevosCampos
}

// Agregar fila validando que el listado maestro no esté vacío
const addAuthorizationObject = () => {
  const listaPlana = sapObjectsList.value
  const primerObjeto = listaPlana.length > 0 ? listaPlana[0] : ''

  state.authorizations.push({
    object: primerObjeto,
    fields: {}
  })

  if (primerObjeto) {
    onObjectChange(state.authorizations.length - 1, primerObjeto)
  }
}

const removeAuthorizationObject = (index: number) => {
  if (state.authorizations.length > 1) {
    state.authorizations.splice(index, 1)
  }
}

// Extraer campos organizacionales excluyendo ACTVT para maquetación separada
const getFieldsForObject = (objectName: string) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match = sapMasterData.value?.find((o: any) => o.objectName === objectName)
  return match?.fields ? match.fields.filter((f: string) => f !== 'ACTVT') : []
}

// Envío a la API con Drizzle
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
    router.push('/admin/settings/roles')
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: `Error al actualizar: ${err.message || 'Error interno'}`,
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
