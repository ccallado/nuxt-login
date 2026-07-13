<template>
  <div style="padding: 20px; max-width: 900px; margin: 0 auto;">
    <NuxtLink to="/">← Volver al inicio</NuxtLink>
    <h1>Panel de Mantenimiento</h1>

    <!-- Formulario de inserción/edición -->
    <form @submit.prevent="guardarPropiedad" style="background: #f5f5f5; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
      <h3>{{ formulario.id ? 'Editar Propiedad' : 'Nueva Propiedad' }}</h3>

      <div style="margin-bottom: 10px;">
        <label>Título:</label><br>
        <input v-model="formulario.titulo" required style="width: 100%; padding: 8px;" />
      </div>

      <div style="margin-bottom: 10px;">
        <label>Precio:</label><br>
        <input v-model.number="formulario.precio" type="number" required style="width: 100%; padding: 8px;" />
      </div>

      <div style="margin-bottom: 10px;">
        <label>Descripción:</label><br>
        <textarea v-model="formulario.descripcion" required style="width: 100%; padding: 8px;"></textarea>
      </div>

      <button type="submit" style="padding: 10px 20px; background: blue; color: white; border: none; cursor: pointer;">
        {{ formulario.id ? 'Actualizar' : 'Guardar' }}
      </button>
      <button v-if="formulario.id" type="button" @click="limpiarFormulario" style="margin-left: 10px; padding: 10px;">
        Cancelar
      </button>
    </form>

    <!-- Tabla de gestión -->
    <h2>Listado Existente</h2>
    <table border="1" width="100%" cellpadding="10" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th>Título</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="p in propiedades" :key="p.id">
          <td>{{ p.titulo }}</td>
          <td>${| p.precio }}</td>
          <td>
            <button @click="cargarEdicion(p)" style="background: orange; color: white; margin-right: 5px;">Editar</button>
            <button @click="eliminarPropiedad(p.id)" style="background: red; color: white;">Eliminar</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const { data: propiedades, refresh } = await useFetch('/api/propiedades')

const formulario = ref({
  id: null,
  titulo: '',
  precio: 0,
  descripcion: ''
})

const limpiarFormulario = () => {
  formulario.value = { id: null, titulo: '', precio: 0, descripcion: '' }
}

const guardarPropiedad = async () => {
  const mEtod = formulario.value.id ? 'PUT' : 'POST'

  await $fetch('/api/propiedades', {
    method: mEtod,
    body: formulario.value
  })

  limpiarFormulario()
  refresh() // Recarga los datos de la tabla inmediatamente
}

const cargarEdicion = (propiedad) => {
  formulario.value = { ...propiedad }
}

const eliminarPropiedad = async (id) => {
  if (confirm('¿Seguro que deseas eliminar esta propiedad?')) {
    await $fetch(`/api/propiedades?id=${id}`, {
      method: 'DELETE'
    })
    refresh()
  }
}
</script>
