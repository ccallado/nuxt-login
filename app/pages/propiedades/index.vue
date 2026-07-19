<template>
  <div>
    <UPageCard
      title="Catálogo de Propiedades"
      description="Invite new members by email address."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Invite people"
        color="neutral"
        class="w-fit lg:ms-auto"
      />
      <div v-if="status === 'pending'">Cargando propiedades...</div>

      <div v-else-if="propiedades?.length === 0">No hay propiedades disponibles.</div>

      <section
        v-else
        style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;"
      >
        <article
          v-for="p in propiedades"
          :key="p.id"
          style="border: 1px solid #ccc; padding: 15px; border-radius: 8px;"
        >
          <h3>{{ p.titulo }}</h3>
          <p>
            <strong>Precio:</strong>
            {{ p.precio !== null && p.precio !== undefined ? `$${Number(p.precio).toLocaleString('es-ES')}` : 'Consultar precio' }}
          </p>
          <p>{{ p.descripcion }}</p>
        </article>
      </section>
    </UPageCard>
  </div>
</template>

<script setup>
// UseFetch aprovecha el SSR de Nuxt 4 de forma nativa
const { data: propiedades, status } = await useFetch('/api/propiedades', {
  default: () => []
})

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['PROPIEDADES'],
  autact: ['01'],
  autvar: {}
})
</script>
