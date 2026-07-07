<script setup lang="ts">
defineProps<{
  sidebarOpen?: boolean
}>()
</script>

<template>
  <div class="layout">
    <header class="layout__toolbar">
      <slot name="toolbar" />
    </header>
    <aside
      class="layout__sidebar"
      :class="{ 'layout__sidebar--open': sidebarOpen }"
    >
      <slot name="sidebar" />
    </aside>
    <main class="layout__main">
      <slot />
    </main>
    <footer class="layout__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: grid;
  min-height: 100vh;
  grid-template-rows: auto 1fr auto;
  grid-template-columns: 260px 1fr;
  grid-template-areas:
    'toolbar toolbar'
    'sidebar main'
    'footer footer';

  &__toolbar {
    grid-area: toolbar;
  }

  &__sidebar {
    grid-area: sidebar;
    border-right: 1px solid #d2d2d7;
    overflow-y: auto;
  }

  &__main {
    grid-area: main;
    padding: 2rem;
    overflow-y: auto;
  }

  &__footer {
    grid-area: footer;
  }
}

@media (max-width: 1023px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      'toolbar'
      'main'
      'footer';

    &__sidebar {
      position: fixed;
      top: 56px;
      left: 0;
      bottom: 0;
      width: 280px;
      background: #fff;
      z-index: 90;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
      box-shadow: none;
    }
  }

  .layout__sidebar--open {
    transform: translateX(0) !important;
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.1);
  }
}
</style>
