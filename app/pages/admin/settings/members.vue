<script lang="ts" setup>
definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout'
})
</script>

<template>
  <div>
    <UPageCard
      title="Members"
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
    </UPageCard>
  </div>
</template>
