<script lang="ts" setup>
// definePageMeta({
//   middleware: ['authenticated'],
//   layout: 'dashboard-layout',
//   roles: ['user']
// })
// definePageMeta({
//   middleware: ['authenticated'],
//   layout: 'dashboard-layout',
//   roles: ['user'],
//   autobj: ['F_BKPF_BUK'],
//   autact: ['01'],
//   autvar: { BUKRS: '1000' }
// })
</script>

<template>
  <div>
    <UPageCard
      title="Notification"
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
