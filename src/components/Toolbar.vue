<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLocaleStore } from '@/stores/useLocaleStore'

const emit = defineEmits<{
  toggleSidebar: []
}>()

const router = useRouter()
const localeStore = useLocaleStore()

function switchLanguage() {
  const next = localeStore.locale === 'en' ? 'it' : 'en'
  localeStore.toggleLocale()
  router.push(`/${next}${window.location.pathname.slice(3)}`)
}
</script>

<template>
  <header class="toolbar">
    <button
      class="toolbar__hamburger"
      aria-label="Toggle navigation menu"
      @click="emit('toggleSidebar')"
    >
      <span class="toolbar__hamburger-line" />
      <span class="toolbar__hamburger-line" />
      <span class="toolbar__hamburger-line" />
    </button>

    <span class="toolbar__logo">Back 2 Basics</span>

    <div class="toolbar__actions">
      <button
        class="toolbar__lang-btn"
        :aria-label="localeStore.locale === 'en' ? 'Switch to Italian' : 'Passa all\'inglese'"
        @click="switchLanguage"
      >
        {{ localeStore.locale.toUpperCase() }}
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 1rem;
  background: #fff;
  border-bottom: 1px solid #d2d2d7;
  position: sticky;
  top: 0;
  z-index: 100;

  &__hamburger {
    display: none;
    flex-direction: column;
    gap: 4px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
  }

  &__hamburger-line {
    display: block;
    width: 20px;
    height: 2px;
    background: #1a1a1a;
    border-radius: 1px;
  }

  &__logo {
    font-weight: 600;
    font-size: 1.125rem;
    letter-spacing: -0.02em;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  &__lang-btn {
    background: none;
    border: 1px solid #d2d2d7;
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 0.8125rem;
    font-weight: 500;
    cursor: pointer;
    color: #1a1a1a;

    &:hover {
      background: #f0f0f0;
    }
  }
}

@media (max-width: 1023px) {
  .toolbar__hamburger {
    display: flex;
  }
}
</style>
