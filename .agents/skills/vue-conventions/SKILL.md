---
name: vue-conventions
description: Vue 3 + TypeScript component authoring conventions for the Back 2 Basics project. Use when creating, editing, or reviewing Vue components, composables, routing, or Pinia stores.
---

# Vue Conventions

## Component Authoring

- Use `<script setup lang="ts">` exclusively. No Options API, no plain `<script>` blocks.
- Prefer Composition API composables (`composables/`) over Pinia for derived state and side effects; use Pinia only for shared global state.
- Every component is a **single-file component** (`.vue`). Colocate tightly coupled child components in the same directory.

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()

const isOpen = ref(false)
const label = computed(() => props.title.toUpperCase())
</script>

<template>
  <div class="panel" :aria-expanded="isOpen">
    <h2>{{ label }}</h2>
    <button @click="emit('close')">Close</button>
  </div>
</template>
```

## Naming

- **Components**: `PascalCase` filenames and template tags (e.g. `PlaybookCard.vue`, `<PlaybookCard />`).
- **Composables**: `useCamelCase` (e.g. `usePlaybook.ts`, `useLocale.ts`).
- **Stores**: `useCamelCaseStore` (e.g. `useLocaleStore.ts`).

## Routing

- Lazy-load all page components:

```ts
const routes = [
  { path: '/:locale', component: () => import('@/pages/HomePage.vue') },
  { path: '/:locale/playbook/:slug', component: () => import('@/pages/PlaybookPage.vue') },
]
```

- The `:locale` param drives `vue-i18n` locale switching and playbook file resolution.

## TypeScript

- `tsconfig.json` strict mode enabled.
- No `any` — use `unknown` and type narrowing.
- Shared types declared in `src/types/`.

## Performance

- `v-memo` on static list items in playbook indexes.
- `<Suspense>` boundaries for async playbook loading.
- `shallowRef` for large data objects that do not need deep reactivity.
