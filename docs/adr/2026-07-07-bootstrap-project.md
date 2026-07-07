# ADR: Bootstrap Project

**Date**: 2026-07-07
**Status**: accepted
**Plan**: [.project/bootstrap-project/plan.md](../project/bootstrap-project/plan.md)

## Context

Back 2 Basics needed its initial scaffold: a Vue 3 + Vite + TypeScript SPA with a responsive layout shell, internationalization, and a Markdown-based playbook rendering pipeline. The goal was to go from zero code to a working site with two real playbooks (Networking, HTTP Protocol) in Italian and English.

## Decision

1. **CSS Grid layout** over flexbox for the shell — provides named template areas (`toolbar`, `sidebar`, `main`, `footer`) that map directly to the visual layout, making responsive reflow (`grid-template-areas` swap at breakpoint) declarative.

2. **Pinia over reactive composables for global state** — `useLayoutStore` (sidebar state) and `useLocaleStore` (locale) need cross-component access. Pinia provides devtools, persistence patterns, and a clear separation from UI logic.

3. **Markdown files in subdirectories** (`public/playbooks/{slug}/`) over flat structure — each playbook gets its own directory containing the `.md` files, diagram sources (`.mmd`), and rendered PNGs. This co-locates all artifacts and prevents filename collisions as the library grows.

4. **Pre-rendered Mermaid PNGs over client-side rendering** — diagrams are authored as `.mmd`, rendered to PNG via a Python script (`bin/render-mermaid.py`) using the mermaid.ink API, and referenced as images in Markdown. This eliminates the `mermaid` JS bundle from the client, improves load time, and works offline.

5. **Italian as default locale** — the platform is authored by an Italian speaker for an Italian-first audience. English is the fallback when a translation is missing, not the primary language.

6. **Locale in URL path** (`/it/`, `/en/`) over query parameter or cookie-only — ensures shareable, SEO-friendly URLs. The store syncs bidirectionally: URL → store (via `App.vue` watcher) and store → URL (via `router.push` on toggle).

## Consequences

- **Positive**: The project is fully wired end-to-end — clicking a playbook in the sidebar loads and renders Markdown with diagrams. A reader can switch languages at any URL and the content updates immediately.
- **Positive**: The `bin/render-mermaid.py` tool has zero external dependencies (Python stdlib only), making diagram rendering portable and CI-friendly.
- **Negative**: `markdown-it` renders basic Markdown but lacks syntax highlighting (`shiki` requires a server-side or build-step integration, deferred).
- **Negative**: Components use hardcoded hex colors instead of `_tokens.scss` CSS custom properties — a Style 5.2 gap that should be addressed in the next pass.
- **Risks**: The mermaid.ink API is an external dependency for rendering diagrams. If the service goes down, diagram PNGs cannot be regenerated. Mitigation: commit the rendered PNGs to the repository so diagrams survive API outages.

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| Client-side Mermaid rendering | Adds ~1MB JS bundle, blocks content rendering until JS loads, complex dark mode support |
| Flat playbook file structure | Doesn't scale — filenames would collide with multiple diagrams per playbook |
| English as default locale | Project audience is Italian-first; English fallback already exists for missing translations |
| `vuepress` / `vitepress` for content | Overkill for an SPA with 2 playbooks; Vue 3 + markdown-it is simpler and full control |
