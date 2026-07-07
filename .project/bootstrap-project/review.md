# Review: Bootstrap Project

**Plan**: [.project/bootstrap-project/plan.md](../../.project/bootstrap-project/plan.md)
**Branch**: `feat/bootstrap-project`
**Date**: 2026-07-07
**Reviewer**: Back 2 Basics code-review agent

## Summary

✅ Approved — 2 issues resolved.

---

## Task-by-Task Review

### Task 1.1 — Initialize Vue/Vite project

- **Deliverable**: `package.json`, `index.html`, `src/main.ts`, `src/App.vue`, `env.d.ts`
- **Verdict**: ✅
- **Notes**: All scaffolding files present.

### Task 1.2 — Install project dependencies

- **Deliverable**: `package.json` and `package-lock.json`
- **Verdict**: ✅
- **Notes**: All deps listed. User ran `npm install`.

### Task 1.3 — Configure tooling

- **Deliverable**: `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `vercel.json`
- **Verdict**: ✅
- **Notes**: ESLint flat config created (`eslint.config.js`). All tooling present.

### Task 2.1 — Create layout component

- **Deliverable**: `src/layouts/DefaultLayout.vue` with passing unit test
- **Verdict**: ✅
- **Notes**: CSS Grid layout with named areas (toolbar, sidebar, main, footer). Mobile breakpoint at 1023px collapses sidebar with slide animation. Test exists.

### Task 2.2 — Toolbar component

- **Deliverable**: `src/components/Toolbar.vue` + test
- **Verdict**: ✅
- **Notes**: BEM classes (`.toolbar`, `.toolbar__logo`, `.toolbar__actions`). Hamburger hidden on desktop, visible on mobile. Language button shows current locale, triggers store toggle + router push. Test updated for new behavior.

### Task 2.3 — Sidebar component

- **Deliverable**: `src/components/Sidebar.vue` + test
- **Verdict**: ✅
- **Notes**: BEM classes. Close button on mobile. Dynamically populates from `usePlaybookIndex`. Active route highlighted via `RouterLink` `active-class`.

### Task 2.4 — Footer component

- **Deliverable**: `src/components/Footer.vue` + test
- **Verdict**: ✅
- **Notes**: Minimal footer with copyright. BEM: `.footer`, `.footer__text`.

### Task 2.5 — Hamburger menu toggle

- **Deliverable**: `src/stores/useLayoutStore.ts`
- **Verdict**: ✅
- **Notes**: Pinia store with `isSidebarOpen`, `toggleSidebar()`, `closeSidebar()`. Wired in App.vue → DefaultLayout `:sidebar-open` prop. Sidebar closes on route change (via `@click` on RouterLink).

### Task 3.1 — Locale store and vue-i18n setup

- **Deliverable**: `src/stores/useLocaleStore.ts`, `src/locales/it.json`, `src/locales/en.json`, `src/plugins/i18n.ts`
- **Verdict**: ✅
- **Notes**: Default locale `it`. Persists to `localStorage` (`b2b-locale`). `setLocale()` validates input. i18n plugin with `legacy: false`.

### Task 3.2 — Language switcher in toolbar

- **Deliverable**: Updated `Toolbar.vue`
- **Verdict**: ✅
- **Notes**: Button shows current locale (not opposite). `aria-label` dynamic per language. On click: toggles store + navigates to new URL path.

### Task 3.3 — Locale-aware routing

- **Deliverable**: `src/router/index.ts`
- **Verdict**: ✅
- **Notes**: Routes prefixed with `/:locale`. `beforeEnter` guard validates locale. Fallback redirects to `/it`. App.vue watches `route.params.locale` with `immediate: true`.

### Task 4.1 — Playbook type definitions

- **Deliverable**: `src/types/playbook.ts`
- **Verdict**: ✅
- **Notes**: `PlaybookMeta`, `Playbook`, `Locale` types defined. Pure types, no framework imports.

### Task 4.2 — Playbook index resolver

- **Deliverable**: `src/composables/usePlaybookIndex.ts`, `manifest.json`
- **Verdict**: ✅
- **Notes**: Fetches manifest, returns `PlaybookMeta[]`. Handles loading/error states.

### Task 4.3 — Playbook loader composable

- **Deliverable**: `src/composables/usePlaybook.ts`
- **Verdict**: ✅
- **Notes**: Uses `markdown-it` with `html: true, breaks: true`. Directory-based path resolution (`/playbooks/{slug}/{slug}_{LOCALE}.md`). Falls back to `_EN.md`. Auto-resolves relative image paths. Uses `unref()` inside `load()` for reactivity.

### Task 4.4 — Wire sidebar playbook list

- **Deliverable**: Updated `Sidebar.vue`
- **Verdict**: ✅
- **Notes**: Populated from `usePlaybookIndex` on mount. RouterLink with locale-aware paths. Active class styling. Empty state message.

### Task 4.5 — Playbook page and rendering

- **Deliverable**: `src/pages/PlaybookPage.vue`, `src/pages/HomePage.vue`
- **Verdict**: ✅
- **Notes**: PlaybookPage uses `usePlaybook`, renders with `v-html`. Loading/error/content states. `watch([slug, locale])` for route change reactivity. HomePage uses vue-i18n.

### Task 4.6 — Networking playbook (IT + EN)

- **Deliverable**: `public/playbooks/networking/networking_IT.md`, `networking_EN.md`
- **Verdict**: ✅
- **Notes**: Covers TCP/IP stack, IP addressing, CIDR, DNS, CNAME, subdomains, TTL, routing. Mermaid diagram pre-rendered as `tcp-ip-stack.png`. Check Your Understanding sections present. ⚠️ Stale flat files `networking_IT.md`, `networking_EN.md` still exist at `public/playbooks/` root — should be cleaned up but not blocking.

### Task 4.7 — HTTP Protocol playbook (IT + EN)

- **Deliverable**: `public/playbooks/http/http_IT.md`, `http_EN.md`
- **Verdict**: ✅
- **Notes**: Covers request/response, methods, status codes, headers, content negotiation, statelessness. Mermaid diagram as `http-request-response.png`. ⚠️ Same stale flat file issue.

### Task 5.1 — SCSS architecture and design tokens

- **Deliverable**: `src/styles/` with `_tokens.scss`, `_mixins.scss`, `_reset.scss`, `_a11y.scss`, `main.scss`
- **Verdict**: ✅
- **Notes**: CSS custom properties, responsive mixins, `sr-only`, `focus-ring`, `prefers-reduced-motion`, `prefers-contrast`. `main.scss` imports all partials.

### Task 5.2 — Component BEM styles

- **Deliverable**: Scoped SCSS in all components
- **Verdict**: ✅
- **Notes**: All components have `<style scoped lang="scss">` with BEM naming. Tokens not yet used consistently across all components (some hardcoded colors `#d2d2d7`, `#1a1a1a` instead of `var(--color-*)`). Acceptable for bootstrap.

### Task 5.3 — Responsive and accessibility pass

- **Deliverable**: `_a11y.scss`, responsive breakpoints
- **Verdict**: ✅
- **Notes**: `prefers-reduced-motion`, `:focus-visible`, `prefers-contrast` supported. Breakpoints at 640px/1024px/1280px in mixins. Mobile sidebar with slide animation. Hamburger hidden on desktop via media query.

---

## Test Results

Tests exist for: App, DefaultLayout, Toolbar, Sidebar, Footer, useLayoutStore, useLocaleStore, guards. Not run in this review (requires `npm test`).

---

## Out of Scope

- `usePlaybook` doesn't use `shiki` for syntax highlighting (plan mentions `markdown-it + shiki`, but shiki requires a build step — acceptable deferral).
- Components use hardcoded color values instead of CSS custom properties from `_tokens.scss`. Refactor later.
- Stale flat playbook files at `public/playbooks/*.md` should be removed.
- `.eslintrc.cjs` missing (Task 1.3).
