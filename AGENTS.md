# AGENTS.md

## Project Reference

- [Constitution](docs/CONSTITUTION.md) — Mission, core principles, and governance of the Back 2 Basics project.
- [Principles](docs/PRINCIPLES.md) — Clean Code, Clean Architecture, dual-language playbooks, diagrams, and mobile-first design.
- [Technology Stack](docs/STACK.md) — Runtime, framework, tooling, design system, and deployment choices.

## Rules

- **Language**: All Markdown (`.md`) files must be written in **English**.
- **Docs Index**: Every new `.md` file created under `docs/` must be referenced in this file. Keep the list up to date.
- **Agent Index**: Every agent defined under `.github/agents/` must be referenced in the Agents section below. Keep the list up to date.
- **ADR Index**: Every ADR created under `docs/adr/` must be referenced in the ADRs section below. Keep the list up to date.
- **Prompt Index**: Every prompt defined under `.github/prompts/` must be referenced in the Prompts section below. Keep the list up to date.
- **Playbook Commit**: After creating or updating a playbook under `public/playbooks/`, always commit and push the changes.
- **Playbook Languages**: Every playbook must be created in both Italian (`{slug}_IT.md`) and English (`{slug}_EN.md`). Never ship a playbook in only one language.

## Agents

- [Write Plan](.github/agents/write-plan.agent.md) — Structured feature planning with phases, tasks, deliverables, and status tracking.
- [Implement Plan](.github/agents/implement-plan.agent.md) — Task execution from an approved plan using TDD (red-green-refactor). Reads the plan, switches to the feature branch, and works through every task test-first.
- [Code Review](.github/agents/code-review.agent.md) — Scope-locked feature review. Validates each deliverable against the plan, produces a review file and an ADR, and advances the plan status to `done`.

## Prompts

- [Write Plan](.github/prompts/write-plan.prompt.md) — `/write-plan` — Create a phased implementation plan for a new feature.
- [Implement Plan](.github/prompts/implement-plan.prompt.md) — `/implement-plan` — Execute plan tasks using TDD.
- [Code Review](.github/prompts/code-review.prompt.md) — `/code-review` — Scope-locked review with ADR output.

## Agent Skills

- [Vue Conventions](.agents/skills/vue-conventions/SKILL.md) — Component authoring, TypeScript, routing, and performance patterns.
- [Styling](.agents/skills/styling/SKILL.md) — SCSS + BEM methodology, design tokens, responsive breakpoints.
- [Internationalization](.agents/skills/i18n/SKILL.md) — Playbook suffix convention, vue-i18n setup, language switcher.
- [Accessibility](.agents/skills/a11y/SKILL.md) — WCAG 2.2 AA checklist, semantic HTML, keyboard & screen reader requirements.
- [Deployment](.agents/skills/deployment/SKILL.md) — Vercel configuration, CI/CD, pre-deploy checklist.
- [Code Review](.agents/skills/code-review/SKILL.md) — Review scope discipline, review template, ADR format, and per-task checklist.

## Tools

- [render-mermaid](bin/render-mermaid.py) — Python script that converts `.mmd` Mermaid diagram sources to PNG via the mermaid.ink API. Use when creating or updating playbook diagrams.
  - **No external dependencies** — uses only Python stdlib.
  - Usage: `python3 bin/render-mermaid.py <input.mmd> <output.png>` or `echo 'graph TD; A-->B' | python3 bin/render-mermaid.py - output.png`

## Diagram Workflow

1. Author Mermaid diagrams in `.mmd` files inside the playbook subdirectory (e.g. `public/playbooks/networking/tcp-ip-stack.mmd`).
2. Run `bin/render-mermaid.py` to generate the PNG: `python3 bin/render-mermaid.py public/playbooks/networking/tcp-ip-stack.mmd public/playbooks/networking/tcp-ip-stack.png`
3. Reference the PNG in the Markdown playbook: `![TCP/IP Stack](tcp-ip-stack.png)`
4. The `usePlaybook` composable auto-resolves relative image paths.

**Never embed Mermaid code blocks directly in Markdown playbooks.** Always pre-render to PNG.

## Plans

<!-- New plans created by the write-plan agent will be added here. Plans live in .project/. Keep this list up to date. -->

- [Bootstrap Project](.project/bootstrap-project/plan.md) — Initial project scaffolding: layout shell, i18n, playbook infrastructure, and first two playbooks (Networking, HTTP).
- [Rust da zero a dieci](.project/rust-da-zero-a-dieci/plan.md) — Comprehensive Rust playbook: syntax, ownership, design patterns, testing, and a CLI document-repo project. Dual-language (IT/EN).

## ADRs

<!-- New ADRs created by the code-review agent will be added here. Keep this list up to date. -->

- [Bootstrap Project](docs/adr/2026-07-07-bootstrap-project.md) — Initial scaffolding: CSS Grid layout, Pinia stores, Markdown rendering, pre-rendered Mermaid diagrams, locale-first architecture.
- [Rust da zero a dieci](docs/adr/2026-07-10-rust-da-zero-a-dieci.md) — Comprehensive Rust playbook: 10 sections, dual-language, 4 Mermaid diagrams, `docrepo` CLI capstone project.

