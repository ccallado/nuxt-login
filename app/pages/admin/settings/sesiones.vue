<script lang="ts" setup>
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  // autobj: ['ADMIN'],
  // autact: ['*'],
  // autvar: {}
})
</script>

<template>
  <div>
    <UPageCard
      title="Sesiones abiertas"
      description="Listado de todas las sesiones abiertas con ip y usuario."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        label="Invite people"
        color="neutral"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>
    <UPageCard
      variant="soft"
      orientation="vertical"
      class="mb-4"
    >
      <SessionsComp />
    </UPageCard>
  </div>
</template>
