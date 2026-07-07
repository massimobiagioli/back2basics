<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import Toolbar from './components/Toolbar.vue'
import Sidebar from './components/Sidebar.vue'
import Footer from './components/Footer.vue'
import { useLayoutStore } from './stores/useLayoutStore'
import { useLocaleStore } from './stores/useLocaleStore'

const route = useRoute()
const layout = useLayoutStore()
const localeStore = useLocaleStore()

watch(
  () => route.params.locale,
  (val) => {
    if (val) localeStore.setLocale(val as string)
  },
  { immediate: true },
)
</script>

<template>
  <DefaultLayout :sidebar-open="layout.isSidebarOpen">
    <template #toolbar>
      <Toolbar @toggle-sidebar="layout.toggleSidebar()" />
    </template>
    <template #sidebar>
      <Sidebar @close="layout.closeSidebar()" />
    </template>
    <template #default>
      <router-view />
    </template>
    <template #footer>
      <Footer />
    </template>
  </DefaultLayout>
</template>
