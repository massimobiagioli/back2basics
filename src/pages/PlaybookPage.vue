<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePlaybook } from '@/composables/usePlaybook'

const route = useRoute()
const slug = computed(() => route.params.slug as string)
const locale = computed(() => (route.params.locale as string) || 'it')

const { content, loading, error, load } = usePlaybook(slug, locale)

load()

watch([slug, locale], () => {
  load()
})
</script>

<template>
  <div class="playbook">
    <div
      v-if="loading"
      class="playbook__loading"
    >
      Loading playbook...
    </div>
    <div
      v-else-if="error"
      class="playbook__error"
    >
      Error: {{ error }}
    </div>
    <article
      v-else
      class="playbook__content"
      v-html="content"
    />
  </div>
</template>

<style scoped lang="scss">
.playbook {
  max-width: 48rem;

  &__loading {
    color: #6e6e6e;
    padding: 2rem;
    text-align: center;
  }

  &__error {
    color: #c00;
    padding: 2rem;
    text-align: center;
  }

  &__content {
    line-height: 1.7;

    :deep(h1) {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.5rem;
    }

    :deep(h2) {
      font-size: 1.5rem;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
    }

    :deep(p) {
      margin-bottom: 1rem;
    }

    :deep(code) {
      background: #f0f0f0;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-size: 0.875em;
    }

    :deep(pre) {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 1rem;

      code {
        background: none;
        padding: 0;
      }
    }
  }
}
</style>
