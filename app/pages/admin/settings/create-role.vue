<template>
  <UPageCard variant="subtle">
    <!-- 👑 SOLUCIÓN: Agregamos flex y w-full al contenedor principal -->
    <div class="flex items-center justify-between w-full mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
      <!-- Contenedor izquierdo: Textos -->
      <div class="space-y-1">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">
          Generador de Roles Maestros (PFCG)
        </h1>
        <p class="text-sm text-gray-500">
          Configura perfiles globales emulando la matriz de autorizaciones de SAP
        </p>
      </div>

      <!-- 👑 CONTENEDOR DERECHO: ml-auto los empuja al final del todo de forma obligatoria -->
      <div class="flex items-center gap-3">
        <UBadge
          color="primary"
          variant="subtle"
          class="whitespace-nowrap"
        >
          Objetos Dinámicos
        </UBadge>

        <UButton
          to="/admin/settings/roles"
          color="neutral"
          variant="ghost"
          icon="i-heroicons-arrow-left"
          label="Volver a Roles"
        />
      </div>
    </div>

    <!-- 👑 SOLUCIÓN PARTE 1: Envolvemos en ClientOnly para evitar que el SSR de Nuxt intente pre-renderizar componentes dinámicos en el servidor -->
    <ClientOnly>
      <!-- Estado de Carga Inicial Estricto -->
      <div
        v-if="status === 'pending'"
        class="p-10 text-center text-gray-400"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin w-6 h-6 mx-auto mb-2 text-primary"
        />
        <p class="text-xs">
          Cargando base de datos de objetos SAP...
        </p>
      </div>

      <!-- 👑 SOLUCIÓN PARTE 2: Agregamos una salvaguarda en el v-else asegurando que sapMasterData ya contenga información útil -->
      <UForm
        v-else-if="sapMasterData && sapMasterData.length > 0"
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

        <!-- Listado Dinámico de Objetos -->
        <div class="space-y-4">
          <div
            v-for="(auth, index) in state.authorizations"
            :key="index"
            class="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl relative space-y-4"
          >
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

            <!-- Campos Organizacionales Dinámicos -->
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

      <!-- Estado de control secundario si Postgres no devolviese objetos maestros -->
      <div
        v-else
        class="p-10 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-gray-400"
      >
        <UIcon
          name="i-heroicons-exclamation-triangle"
          class="w-8 h-8 mx-auto mb-2 text-warning"
        />
        <p
          class="text-sm"
        >
          El Diccionario de Datos SAP está vacío. Registra objetos superiores primero.
        </p>
      </div>
    </ClientOnly>
  </UPageCard>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { masterRoleFormSchema } from '#shared/utils/sap-form-schema'
import type { NuxtError } from '#app'

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['ADMIN'],
  autact: ['*'],
  autvar: {}
})

const toast = useToast()
const router = useRouter()
const isSubmitting = ref(false)

// 1. Cargar la configuración de objetos maestros desde el nuevo endpoint de Postgres
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: sapMasterData, status } = await useFetch<any[]>('/api/admin/sap-objects-configuration')

// Mapear los nombres técnicos planos para el USelectMenu
const sapObjectsList = computed(() => {
  return sapMasterData.value?.map(item => item.objectName) || []
})

// 2. Estado reactivo dinámico libre de enums hardcodeados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const state = reactive<any>({
  name: 'Z_',
  description: '',
  authorizations: []
})

// Auxiliar para extraer los campos organizacionales (excluyendo ACTVT)
const getFieldsForObject = (objectName: string) => {
  const match = sapMasterData.value?.find(o => o.objectName === objectName)
  return match?.fields ? match.fields.filter((f: string) => f !== 'ACTVT') : []
}

// 3. Gestionar el cambio estructural de campos respetando la reactividad profunda de Vue 3
const onObjectChange = (index: number, newObjectName: string) => {
  const configuracionObjeto = sapMasterData.value?.find(o => o.objectName === newObjectName)
  const nuevosCampos: Record<string, string[]> = {}

  if (configuracionObjeto && configuracionObjeto.fields) {
    configuracionObjeto.fields.forEach((fieldName: string) => {
      // '03' (Visualizar) asignada por defecto si el campo es ACTVT
      nuevosCampos[fieldName] = fieldName === 'ACTVT' ? ['03'] : []
    })
  }

  state.authorizations[index].fields = nuevosCampos
}

// Controladores para filas dinámicas
const addAuthorizationObject = () => {
  const primerObjeto = sapObjectsList.value[0] || ''

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

// Forzar la inicialización de la primera fila una vez que los datos maestros estén disponibles
onMounted(() => {
  if (state.authorizations.length === 0) {
    // Si la llamada asíncrona ya terminó, inyectamos la primera fila
    if (sapObjectsList.value.length > 0) {
      addAuthorizationObject()
    } else {
      // Salvaguarda por si useFetch aún está resolviendo en cliente
      const unwatch = watch(sapObjectsList, (newList) => {
        if (newList.length > 0) {
          addAuthorizationObject()
          unwatch()
        }
      })
    }
  }
})

// 4. Envío seguro al servidor backend de Nuxt 4
const onSubmit = async () => {
  isSubmitting.value = true
  try {
    await $fetch('/api/admin/roles', {
      method: 'POST',
      body: state
    })

    toast.add({
      title: 'Success',
      description: `Rol Maestro ${state.name} creado exitosamente.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    router.push('/admin/settings/roles')
  } catch (error) {
    const err = error as NuxtError
    toast.add({
      title: 'Error',
      description: `Error: ${err.message || 'No se pudo guardar el rol'}`,
      icon: 'i-lucide-x',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
