<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { usePlaybookIndex } from '@/composables/usePlaybookIndex'
import type { PlaybookMeta } from '@/types/playbook'

defineEmits<{ close: [] }>()

const route = useRoute()
const locale = (route.params.locale as string) || 'it'
const { playbooks, loading, fetchIndex } = usePlaybookIndex()

onMounted(() => {
  fetchIndex()
})

const groupedPlaybooks = computed(() => {
  const groups = new Map<string, PlaybookMeta[]>()
  for (const pb of playbooks.value) {
    const key = pb.category || 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(pb)
  }
  return Array.from(groups.entries()).map(([category, items]) => ({ category, items }))
})
</script>

<template>
  <nav
    class="sidebar"
    aria-label="Playbook navigation"
  >
    <div class="sidebar__header">
      <h2 class="sidebar__title">
        Playbooks
      </h2>
      <button
        class="sidebar__close"
        aria-label="Close navigation"
        @click="$emit('close')"
      >
        ✕
      </button>
    </div>

    <p
      v-if="loading"
      class="sidebar__empty"
    >
      Loading...
    </p>
    <p
      v-else-if="playbooks.length === 0"
      class="sidebar__empty"
    >
      No playbooks yet
    </p>
    <div
      v-else
      class="sidebar__groups"
    >
      <div
        v-for="group in groupedPlaybooks"
        :key="group.category"
        class="sidebar__group"
      >
        <h3 class="sidebar__group-title">
          {{ group.category }}
        </h3>
        <ul class="sidebar__list">
          <li
            v-for="pb in group.items"
            :key="pb.slug"
            class="sidebar__item"
          >
            <RouterLink
              :to="`/${locale}/playbook/${pb.slug}`"
              class="sidebar__link"
              active-class="sidebar__link--active"
              @click="$emit('close')"
            >
              {{ pb.title }}
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped lang="scss">
.sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border-bottom: 1px solid #d2d2d7;
  }

  &__title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6e6e6e;
  }

  &__close {
    display: none;
    background: none;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: #6e6e6e;
    padding: 4px;
  }

  &__groups {
    padding: 0.5rem 0;
    overflow-y: auto;
  }

  &__group {
    &:not(:first-child) {
      margin-top: 0.75rem;
    }
  }

  &__group-title {
    padding: 0.5rem 1rem 0.25rem;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: #86868b;
  }

  &__list {
    list-style: none;
    padding: 0;
  }

  &__item {
    padding: 0;
  }

  &__link {
    display: block;
    padding: 0.625rem 1rem;
    font-size: 0.9375rem;
    color: #1a1a1a;
    text-decoration: none;
    border-left: 3px solid transparent;
    transition: background 0.15s, border-color 0.15s;

    &:hover {
      background: #f0f0f0;
    }

    &--active {
      background: #e8f0fe;
      border-left-color: #0071e3;
      font-weight: 500;
    }
  }

  &__empty {
    padding: 1.5rem 1rem;
    color: #6e6e6e;
    font-size: 0.875rem;
    text-align: center;
  }
}

@media (max-width: 1023px) {
  .sidebar__close {
    display: block;
  }
}
</style>
