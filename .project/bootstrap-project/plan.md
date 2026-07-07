# Plan: Bootstrap Project

**Status**: `done`
**Branch**: `feat/bootstrap-project`
**Created**: 2026-07-07
**Author**: Back 2 Basics planning agent

## Overview

Initialize the Back 2 Basics Vue 3 + TypeScript project with the complete layout shell: a toolbar with language switcher, a left sidebar listing playbooks, a central content area for playbook rendering, a footer, and a hamburger menu for mobile navigation. Deliver the first two playbooks — **Networking** (TCP/IP, DNS, subdomains, CNAME) and **HTTP Protocol** (methods, status codes, headers, REST primer) — in both Italian and English. This is the foundation upon which all subsequent features will be built.

---

## Phase 1: Project Scaffolding

**Goal**: A runnable Vue 3 + Vite + TypeScript project with all dependencies installed and tooling configured.

### Task 1.1 — Initialize Vue/Vite project

- [x] **Description**: Scaffold the project with `pnpm create vue@latest` using the stack defined in `docs/STACK.md`. Configure TypeScript strict mode, Vue Router, Pinia, Vitest, ESLint + Prettier.
- **Deliverable**: Working `pnpm dev` that serves a blank page.
- **Depends on**: —

### Task 1.2 — Install project dependencies

- [x] **Description**: Install all runtime and dev dependencies: `vue-i18n`, `markdown-it`, `shiki`, `mermaid`, `@unhead/vue`, `sass`, `eslint-plugin-vue-a11y`, `@vue/test-utils`, `playwright`. Configure `pnpm` and verify `pnpm install` succeeds.
- **Deliverable**: `package.json` and `pnpm-lock.yaml` with all deps listed.
- **Depends on**: Task 1.1

### Task 1.3 — Configure tooling

- [x] **Description**: Set up `vite.config.ts` with SCSS `additionalData` for token injection, `@` alias, and PWA plugin. Configure `tsconfig.json` strict mode. Add `.eslintrc.cjs` and `.prettierrc`. Write `vercel.json` with SPA rewrites.
- **Deliverable**: `vite.config.ts`, `tsconfig.json`, `.eslintrc.cjs`, `.prettierrc`, `vercel.json` — all passing `pnpm lint` and `pnpm typecheck`.
- **Depends on**: Task 1.2

---

## Phase 2: Layout Shell

**Goal**: A responsive page layout with toolbar, sidebar, content area, and footer that works on desktop and mobile.

### Task 2.1 — Create layout component

- [x] **Description**: Build `src/layouts/DefaultLayout.vue` with CSS Grid: toolbar (top), sidebar (left), main content (center), footer (bottom). On mobile (< 1024px), the sidebar collapses and is toggled by a hamburger icon in the toolbar.
- **Deliverable**: `src/layouts/DefaultLayout.vue` with passing unit test.
- **Depends on**: Task 1.3

### Task 2.2 — Toolbar component

- [x] **Description**: Build `src/components/Toolbar.vue` with the project logo/title, language switcher button, and hamburger menu icon (visible only on mobile). The toolbar is sticky at the top. Follow BEM naming: `.toolbar`, `.toolbar__logo`, `.toolbar__actions`.
- **Deliverable**: `src/components/Toolbar.vue` + `src/components/__tests__/Toolbar.spec.ts`.
- **Depends on**: Task 2.1

### Task 2.3 — Sidebar component

- [x] **Description**: Build `src/components/Sidebar.vue` with a scrollable list of playbook links. On desktop it is always visible on the left. On mobile it becomes a bottom sheet triggered by the hamburger icon. Follow BEM: `.sidebar`, `.sidebar__item`, `.sidebar__item--active`.
- **Deliverable**: `src/components/Sidebar.vue` + `src/components/__tests__/Sidebar.spec.ts`.
- **Depends on**: Task 2.1

### Task 2.4 — Footer component

- [x] **Description**: Build `src/components/Footer.vue` with minimal content: copyright line and a link to the project repository. Fixed at the bottom of the viewport, does not overlap content.
- **Deliverable**: `src/components/Footer.vue` + `src/components/__tests__/Footer.spec.ts`.
- **Depends on**: Task 2.1

### Task 2.5 — Hamburger menu toggle

- [x] **Description**: Wire the hamburger icon in `Toolbar.vue` to toggle `Sidebar.vue` visibility on mobile. Use a Pinia store `useLayoutStore` to track the sidebar open/closed state. Ensure the sidebar closes when a playbook is selected.
- **Deliverable**: `src/stores/useLayoutStore.ts` + updated `Toolbar.vue` and `Sidebar.vue`. E2E test with Playwright: open sidebar on mobile, select item, sidebar closes.
- **Depends on**: Task 2.2, Task 2.3

---

## Phase 3: Internationalization & Routing

**Goal**: Language switcher in the toolbar that toggles between IT and EN, persist the choice, and update the URL path.

### Task 3.1 — Locale store and vue-i18n setup

- [x] **Description**: Create `src/stores/useLocaleStore.ts` that manages the current locale (`it` | `en`), persists to `localStorage` under key `b2b-locale`, and provides a `toggleLocale()` action. Set up `vue-i18n` with lazy-loaded JSON bundles at `src/locales/it.json` and `src/locales/en.json`. The store syncs locale changes to `vue-i18n`.
- **Deliverable**: `src/stores/useLocaleStore.ts`, `src/locales/it.json`, `src/locales/en.json`, `src/plugins/i18n.ts`. Unit tests for the store.
- **Depends on**: Task 1.2

### Task 3.2 — Language switcher in toolbar

- [x] **Description**: Integrate the locale store into the toolbar's language switcher button. Clicking it calls `toggleLocale()`. The button displays the opposite locale (e.g. shows "IT" when the current locale is EN). Add `aria-label` for screen readers ("Switch to Italian" / "Passa all'inglese").
- **Deliverable**: Updated `Toolbar.vue` with wired language switcher. Unit test verifies button click triggers locale toggle.
- **Depends on**: Task 2.2, Task 3.1

### Task 3.3 — Locale-aware routing

- [x] **Description**: Configure Vue Router with `/:locale` prefix on all routes. On app load, read `localStorage` for the saved locale; if absent, default to `en`. Redirect `/` to `/:locale`. When the locale changes via the store, navigate to the new locale path. Use route guards to validate the locale param is `it` or `en`.
- **Deliverable**: `src/router/index.ts` with locale-prefixed routes, route guard, and redirect. Unit tests for guard logic.
- **Depends on**: Task 3.1

---

## Phase 4: Playbook Infrastructure

**Goal**: Sidebar displays a list of available playbooks, clicking one renders its Markdown content in the main area.

### Task 4.1 — Playbook type definitions

- [x] **Description**: Define TypeScript types in `src/types/playbook.ts`: `PlaybookMeta { slug, title }`, `Playbook { meta, content }`, `Locale`. These are pure domain types with no framework imports.
- **Deliverable**: `src/types/playbook.ts`.
- **Depends on**: Task 1.3

### Task 4.2 — Playbook index resolver

- [x] **Description**: Create `src/composables/usePlaybookIndex.ts` that reads available playbooks from a static manifest (`public/playbooks/manifest.json`). Returns `PlaybookMeta[]`. For now, the list is empty — the composable handles the empty state gracefully.
- **Deliverable**: `src/composables/usePlaybookIndex.ts` + unit test. `public/playbooks/manifest.json`.
- **Depends on**: Task 4.1

### Task 4.3 — Playbook loader composable

- [x] **Description**: Create `src/composables/usePlaybook.ts` that accepts a slug and locale, fetches `/playbooks/{slug}_{locale}.md`, and returns the HTML content. Handles loading, error (404 → fallback to EN), and empty states.
- **Deliverable**: `src/composables/usePlaybook.ts`.
- **Depends on**: Task 4.1

### Task 4.4 — Wire sidebar playbook list

- [x] **Description**: Use `usePlaybookIndex` in `Sidebar.vue` to populate the playbook list. Each item is an `<router-link>` to `/:locale/playbook/:slug`. Apply `.sidebar__item--active` to the current route. Show an empty state message when the list is empty.
- **Deliverable**: Updated `Sidebar.vue` with dynamic playbook list.
- **Depends on**: Task 2.3, Task 4.2

### Task 4.5 — Playbook page and rendering

- [x] **Description**: Create `src/pages/PlaybookPage.vue` that uses `usePlaybook` to load and render a playbook. Show a loading skeleton while fetching, an error message on failure, and the rendered content on success.
- **Deliverable**: `src/pages/PlaybookPage.vue` + `src/pages/HomePage.vue`.
- **Depends on**: Task 4.3, Task 3.3

### Task 4.6 — Networking playbook (IT + EN)

- [x] **Description**: Author two Markdown playbooks — `networking_IT.md` and `networking_EN.md` — covering TCP/IP stack, IP addressing, DNS, CNAME, subdomains, TTL, routing. Include a Mermaid diagram.
- **Deliverable**: `public/playbooks/networking_IT.md`, `public/playbooks/networking_EN.md`.
- **Depends on**: Task 4.5

### Task 4.7 — HTTP Protocol playbook (IT + EN)

- [x] **Description**: Author two Markdown playbooks — `http_IT.md` and `http_EN.md` — covering request/response structure, methods, status codes, headers, content negotiation, statelessness. Include a Mermaid diagram.
- **Deliverable**: `public/playbooks/http_IT.md`, `public/playbooks/http_EN.md`.
- **Depends on**: Task 4.5

---

## Phase 5: Global Styles & Polish

**Goal**: Apply the design system tokens, SCSS architecture, and responsive refinements so the site looks and behaves as defined in `docs/PRINCIPLES.md`.

### Task 5.1 — SCSS architecture and design tokens

- [x] **Description**: Create the SCSS file structure: `src/styles/_reset.scss`, `_tokens.scss`, `_mixins.scss`, `_a11y.scss`, and `main.scss`. Import tokens globally via `vite.config.ts`.
- **Deliverable**: `src/styles/` directory with all partials. `main.scss` imported in `src/main.ts`.
- **Depends on**: Task 2.1

### Task 5.2 — Component BEM styles

- [x] **Description**: Write scoped SCSS for every layout component following BEM conventions: `Toolbar`, `Sidebar`, `Footer`, `PlaybookPage`, `HomePage`.
- **Deliverable**: Every component file includes `<style scoped lang="scss">` with BEM classes.
- **Depends on**: Task 5.1, all Phase 2-4 components

### Task 5.3 — Responsive and accessibility pass

- [x] **Description**: Verify all breakpoints (640px, 1024px, 1280px) work correctly. Add `prefers-reduced-motion`, `:focus-visible`, `prefers-contrast` support.
- **Deliverable**: `_a11y.scss` with reduced motion, focus, contrast support. Responsive layout at 3 breakpoints.
- **Depends on**: Task 5.2
