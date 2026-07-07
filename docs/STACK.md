# Back 2 Basics — Technology Stack

## Runtime

| Layer       | Choice                        | Rationale                                          |
|-------------|-------------------------------|----------------------------------------------------|
| **Runtime** | Node.js LTS (24.x)            | Long-term stability, Vercel first-class support    |
| **Package** | pnpm                          | Fast, disk-efficient, strict dependency resolution |

## Frontend

| Layer            | Choice                    | Rationale                                                   |
|------------------|---------------------------|-------------------------------------------------------------|
| **Framework**    | Vue 3 (Composition API)   | Reactive, lightweight, excellent DX with TypeScript         |
| **Language**     | TypeScript (strict mode)  | Type safety across the entire codebase                      |
| **Build**        | Vite 6                    | Instant HMR, native ESM, optimised production builds        |
| **Routing**      | Vue Router 4              | SPA routing with lazy-loaded playbook views                 |
| **State**        | Pinia                     | Lightweight, devtools-friendly, modular stores              |
| **Styling**      | SCSS + BEM                | Scoped styles, BEM naming for predictable specificity       |
| **i18n**         | vue-i18n                  | Runtime locale switching, lazy-loaded message bundles       |
| **Content**      | Markdown (static files)   | Playbooks authored as `.md`, split by language suffix       |
| **Markdown**     | markdown-it + shiki       | Render playbooks; shiki for syntax-highlighted code blocks  |
| **Head**         | @unhead/vue               | Per-page `<title>`, `<meta>`, Open Graph                    |
| **Lint/Format**  | ESLint + Prettier         | Consistent code style, zero-config with `@vue/eslint-config-typescript` |

## Quality

| Concern              | Tool                        |
|----------------------|-----------------------------|
| **Accessibility**    | axe-core + eslint-plugin-vue-a11y — automated a11y audits in CI |
| **Unit tests**       | Vitest + @vue/test-utils    |
| **E2E tests**        | Playwright                  |
| **Type checking**    | vue-tsc (pre-build)         |

## Design System

| Principle         | Implementation                                       |
|-------------------|------------------------------------------------------|
| **Philosophy**    | "Steve Jobs 00s" — minimal chrome, generous whitespace, crisp typography, subtle depth (shadows, gradients), content-first |
| **Typography**    | System font stack (SF Pro / Segoe UI / Roboto)       |
| **Spacing**       | 4px base unit — rhythm and breathing room            |
| **Colors**        | Neutral-dominant palette with a single accent; WCAG AA minimum contrast |
| **Motion**        | Subtle transitions (≤200ms), `prefers-reduced-motion` respected |
| **Responsive**    | Mobile-first, breakpoints at 640px / 1024px / 1280px |

## Internationalization

- Playbooks are stored as **static Markdown files** with language suffixes: `bgp_IT.md`, `bgp_EN.md`
- The UI shell (toolbar, navigation, labels) uses `vue-i18n` with lazy-loaded JSON bundles.
- A **language switcher** in the toolbar lets the user toggle between IT and EN at any time.
- The selected locale is persisted in `localStorage` and reflected in the URL path (`/it/...` or `/en/...`).

## Deployment

| Concern        | Choice                                     |
|----------------|--------------------------------------------|
| **Platform**   | Vercel                                     |
| **Config**     | `vercel.json` — SPA rewrites, cache headers |
| **CI/CD**      | GitHub Actions → Vercel preview + production |
| **Domains**    | Custom domain with auto-HTTPS              |
| **Analytics**  | Vercel Web Analytics (privacy-first)       |

## Project Structure

```
back2basics/
├── public/
│   └── playbooks/
│       ├── bgp_IT.md
│       ├── bgp_EN.md
│       └── ...
├── src/
│   ├── assets/          # SCSS variables, mixins, global resets
│   ├── components/      # Reusable UI components (BEM blocks)
│   ├── composables/     # Vue composables (useLocale, usePlaybook, …)
│   ├── layouts/         # Shell layout (toolbar, sidebar, content area)
│   ├── locales/         # vue-i18n JSON bundles (it.json, en.json)
│   ├── pages/           # Route-level page components
│   ├── router/          # Vue Router configuration
│   ├── stores/          # Pinia stores
│   ├── styles/          # Global SCSS, BEM block partials
│   └── types/           # TypeScript type definitions
├── .agents/
│   └── skills/          # Agent skills for this project
├── AGENTS.md
├── docs/
│   ├── CONSTITUTION.md
│   ├── STACK.md
│   └── ...
├── vercel.json
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

*Last revised: 2026-07-07*
