# ADR: Rust da zero a dieci Playbook

**Date**: 2026-07-10
**Status**: accepted
**Plan**: [.project/rust-da-zero-a-dieci/plan.md](../project/rust-da-zero-a-dieci/plan.md)

## Context

The Back 2 Basics platform needed a comprehensive Rust programming language playbook covering syntax, ownership, error handling, design patterns, testing, and a hands-on CLI project. The playbook had to be bilingual (IT/EN), follow the Constitution's progressive-depth principle, and be accessible to a 13-year-old audience while maintaining technical precision.

## Decision

The playbook was authored as **pure static content** — two Markdown files (`rust_IT.md`, `rust_EN.md`) plus 4 Mermaid diagram sources (`.mmd`) rendered to PNG via the project's `bin/render-mermaid.py` tool. No Vue/TypeScript code changes were required — the existing `usePlaybook` composable, `PlaybookPage.vue`, and `manifest.json` infrastructure handle everything.

Key structural decisions:

1. **10 sections, progressive depth**: Each section opens with a "one-liner" summary, expands into the core explanation with code examples, connects to other sections, and (where appropriate) offers deep dives. The CLI project (section 10) serves as a capstone that applies all prior sections.

2. **Italian-first, then English**: The Italian version was written first as the primary content. The English version is a faithful translation preserving all code snippets (language-agnostic) and diagram references.

3. **4 Mermaid diagrams**: Ownership/borrowing flow, error handling decision tree, CLI architecture, and Rust vs Python mindmap. All diagrams are pre-rendered to PNG per the project's Diagram Workflow rule.

4. **`docrepo` CLI as capstone**: A real, buildable project using `clap`, `serde`, `anyhow`, `uuid`, and `chrono` — all standard Rust CLI tools. Complete with integration tests. This anchors the theoretical content in practice.

## Consequences

- **Positive**: 
  - No code changes needed — zero risk of regressions in the Vue app.
  - The playbook infrastructure (`usePlaybook`, `manifest.json`, `PlaybookPage.vue`) is validated for a third playbook, proving the bootstrap architecture works.
  - The dual-language content demonstrates the i18n suffix convention (`{slug}_{locale}.md`) at scale (1200+ lines per language).
  - The `docrepo` CLI project gives learners a tangible outcome — not just theory.

- **Negative**:
  - The `.mmd` diagrams contain Italian labels even in the English playbook's diagram references. This is acceptable for visual aids but could confuse if the English playbook were consumed independently of the text.
  - The playbook is large (~1200 lines per language, ~28KB total) — the `fetch` + `markdown-it` rendering path should be profiled if more large playbooks are added.
  - No automated content validation (e.g., link checking, code snippet extraction). Relies on manual review.

- **Risks**:
  - The `docrepo` code in section 10 may become outdated as Rust libraries evolve (`clap`, `serde`, `anyhow` version bumps). Mitigation: section 10 explicitly lists dependency versions in `Cargo.toml`, but these will need periodic updates.
  - Mermaid diagram rendering depends on the external `mermaid.ink` API. Mitigation: the `.mmd` sources are committed, so diagrams can be re-rendered at any time.

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| **Embed Mermaid code blocks directly** | Violates the project's Diagram Workflow rule (`AGENTS.md`). Mermaid rendering in-browser adds JS payload and may not work in all Markdown renderers. |
| **Single-language playbook (IT only)** | The Constitution and i18n skill mandate dual-language playbooks. English fallback is required for the `usePlaybook` composable's locale resolution logic. |
| **Split the CLI project into its own playbook** | Would break the narrative arc: the CLI is the capstone that applies all prior sections. Separating it would create a disconnected "Rust CLI" playbook without the foundational context. |
| **Use `mdBook` or external documentation generator** | Would require a separate build pipeline and hosting. The Back 2 Basics platform already handles Markdown rendering with `markdown-it` + `shiki`. |
