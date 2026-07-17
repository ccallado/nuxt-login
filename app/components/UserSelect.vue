<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  modelValue: { id: number; email: string } | null
  items: { id: number; email: string }[]
  placeholder?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: { id: number; email: string } | null): void
}>()

const isOpen = ref(false)
const searchQuery = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)

// Computed para mostrar el email en el input
const displayEmail = computed(() => {
  // console.log('displayEmail:', displayEmail.value)
  return props.modelValue?.email || ''
})

// Filtrar items según búsqueda
const filteredItems = computed(() => {
  if (!searchQuery.value) return props.items
  const q = searchQuery.value.toLowerCase()
  return props.items.filter(item => item.email.toLowerCase().includes(q))
})

// Seleccionar un usuario
function selectUser(user: { id: number; email: string }) {
  // console.log('✅ UserSelect seleccionó:', user)
  emit('update:modelValue', user)
  searchQuery.value = ''
  isOpen.value = false
}

// Limpiar selección
function clearSelection() {
  emit('update:modelValue', null)
  searchQuery.value = ''
}

// Abrir/cerrar dropdown
function toggleDropdown() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => inputRef.value?.focus())
  }
}

// Cerrar dropdown al hacer clic fuera
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (
    dropdownRef.value &&
    !dropdownRef.value.contains(target) &&
    inputRef.value &&
    !inputRef.value.contains(target)
  ) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Watch para depuración (se ejecutará si modelValue cambia)
watch(() => props.modelValue, (newVal) => {
  if (inputRef.value) {
    inputRef.value.value = newVal?.email || ''
  }
}, { immediate: true, deep: true })
</script>

<template>
  <div class="relative w-full" ref="dropdownRef">
    <!-- Input con el email mostrado -->
    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        :placeholder="placeholder || 'Buscar usuario...'"
        class="..."
        autocomplete="off"
        @input="(e) => { searchQuery = (e.target as HTMLInputElement).value; if (!isOpen) isOpen = true; }"
        @focus="isOpen = true"
      >
      <!-- Botón para limpiar o icono de flecha -->
      <button
        v-if="modelValue"
        @click.stop="clearSelection"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
      >
        <UIcon name="i-heroicons-x-mark-20-solid" class="w-5 h-5" />
      </button>
      <button
        v-else
        @click.stop="toggleDropdown"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
      >
        <UIcon name="i-heroicons-chevron-down-20-solid" class="w-5 h-5" />
      </button>
    </div>

    <!-- Dropdown con la lista de usuarios -->
    <div
      v-if="isOpen"
      class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      <div v-if="filteredItems.length === 0" class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
        No se encontraron usuarios
      </div>
      <button
        v-for="item in filteredItems"
        :key="item.id"
        @click="selectUser(item)"
        class="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors truncate"
      >
        {{ item.email }}
      </button>
    </div>
  </div>
</template>
