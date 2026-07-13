<script setup lang="ts">
import type { Member } from '~/types'

const { data: members } = await useFetch<Member[]>('/api/user/members', {
  method: 'GET'
})

const q = ref('')

const filteredMembers = computed(() => {
  return (members.value ?? []).filter((member) => {
    // Usamos encadenamiento opcional (?.) por si algún miembro de la base de datos
    // no tiene configurado el campo 'name' o 'username'
    const nameMatch = member.name?.search(new RegExp(q.value, 'i')) !== -1
    const usernameMatch = member.username?.search(new RegExp(q.value, 'i')) !== -1

    return nameMatch || usernameMatch
  })
})

definePageMeta({
  middleware: ['authenticated'],
  layout: 'dashboard-layout',
  autobj: ['ADMIN'],
  autact: ['01'],
  autvar: {}
})
</script>

<template>
  <div>
    <UPageCard
      title="Usuarios"
      description="Usuarios dados de alta."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <!-- <UButton
        label="Invite people"
        color="neutral"
        class="w-fit lg:ms-auto"
      /> -->
    </UPageCard>

    <UPageCard
      variant="subtle"
      :ui="{ container: 'p-0 sm:p-0 gap-y-0', wrapper: 'items-stretch', header: 'p-4 mb-0 border-b border-default' }"
    >
      <template #header>
        <UInput
          v-model="q"
          icon="i-lucide-search"
          placeholder="Search members"
          autofocus
          class="w-full"
        />
      </template>

      <MembersList :members="filteredMembers" />
    </UPageCard>
  </div>
</template>
