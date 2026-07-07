<template>
  <main style="padding: 20px; max-width: 800px; margin: 0 auto;">
    <header style="display: flex; justify-content: space-between; align-items: center;">
      <h1>Catálogo de Propiedades</h1>
      <NuxtLink to="/mantenedor" style="padding: 10px; background: #00dc82; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">
        Administrar Panel
      </NuxtLink>
    </header>

    <div v-if="status === 'pending'">Cargando propiedades...</div>

    <div v-else-if="propiedades?.length === 0">No hay propiedades disponibles.</div>

    <section v-else style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
      <article v-for="p in propiedades" :key="p.id" style="border: 1px solid #ccc; padding: 15px; border-radius: 8px;">
        <h3>{{ p.titulo }}</h3>
        <p><strong>Precio:</strong> ${{ p.precio.toLocaleString() }}</p>
        <p>{{ p.descripcion }}</p>
      </article>
    </section>
  </main>
</template>

<script setup>
// UseFetch aprovecha el SSR de Nuxt 4 de forma nativa
const { data: propiedades, status } = await useFetch('/api/propiedades')
</script>
