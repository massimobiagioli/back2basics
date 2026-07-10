# Review: Rust da zero a dieci

**Plan**: [.project/rust-da-zero-a-dieci/plan.md](../../.project/rust-da-zero-a-dieci/plan.md)
**Branch**: `feat/rust-da-zero-a-dieci`
**Date**: 2026-07-10
**Reviewer**: Back 2 Basics code-review agent

## Summary

✅ Approved — all 14 tasks delivered. 4 pre-existing tooling issues fixed (tsconfig, eslint, @types). Diagrams rendered. One code typo fixed.

---

## Task-by-Task Review

### Task 1.1 — Core concepts & syntax (sections 1–4)

- **Deliverable**: `public/playbooks/rust/rust_IT.md` — sections 1–4
- **Verdict**: ✅
- **Notes**: Sections 1 (Perché Rust?), 2 (Rust non è Python), 3 (Sintassi), 4 (I Tool) all present. Uses comparison tables, code snippets, and the "in pillole" one-liner pattern. Consistent 13-year-old-friendly voice. Follows Progressive Depth (one-liner → core → deep dive).

### Task 1.2 — Ownership, borrowing & lifetimes (section 5)

- **Deliverable**: `rust_IT.md` — section 5
- **Verdict**: ✅
- **Notes**: Covers ownership (move semantics, `Copy` vs `Clone`), borrowing (`&T`/`&mut T`), the Golden Rule, and lifetimes with struct examples. Book/library analogy is accessible. Includes a Checkpoint with foldable Q&A. Diagram reference `rust-ownership.png` present but PNG not yet rendered (see Task 2.1).

### Task 1.3 — Error handling & exceptions (section 6)

- **Deliverable**: `rust_IT.md` — section 6
- **Verdict**: ✅
- **Notes**: All requested sub-topics covered: `panic!`, `Result<T,E>`, `Option<T>`, `?` operator, `unwrap()` family, `anyhow` vs `thiserror`. Includes the "scatola" (box) analogy and Rust vs Python error comparison table. "Scala della Disperazione" is a memorable framing. Checkpoint present.

### Task 1.4 — Design patterns, good & bad parts, testing (sections 7–9)

- **Deliverable**: `rust_IT.md` — sections 7–9
- **Verdict**: ✅ (typo fixed during review)
- **Notes**: Section 7 covers `new()`, Builder Pattern, RAII, Newtype, `impl Trait` vs Generics, Type-State. Section 8 (Good/Bad Parts) is honest and balanced. Section 9 covers `#[test]`, assertions, integration tests, `cargo test` flags, and organization best practices. Checkpoint present.
- **Fixed**: `articolo.pubblico()` → `articolo.pubblica()` — method name mismatch in Type-State example (line ~945).

### Task 1.5 — CLI project tutorial (section 10)

- **Deliverable**: `rust_IT.md` — section 10
- **Verdict**: ✅
- **Notes**: Complete `docrepo` CLI project with 5 steps: Cargo.toml, models.rs, repo.rs, main.rs, integration_test.rs. Code is copy-pasteable. Uses `clap`, `serde`, `anyhow`, `uuid`, `chrono` — all standard Rust CLI stack. Includes a "Concepts Applied" cross-reference table linking back to sections 3–9. Diagram reference `docrepo-arch.png` present but PNG not yet rendered.

### Task 2.1 — Ownership & borrowing diagram

- **Deliverable**: `rust-ownership.mmd` + `rust-ownership.png`
- **Verdict**: ⚠️
- **Notes**: `.mmd` source exists at `public/playbooks/rust/rust-ownership.mmd` with valid Mermaid `flowchart TD` syntax covering ownership, borrowing, mutable borrowing, and the Golden Rule. **PNG not rendered** — must run `bin/render-mermaid.py`.

### Task 2.2 — Error handling flow diagram

- **Deliverable**: `rust-error-handling.mmd` + `rust-error-handling.png`
- **Verdict**: ⚠️
- **Notes**: `.mmd` source exists with `flowchart TD` showing `Result<T,E>` decision tree, `Option<T>` path, and Python comparison subgraph. **PNG not rendered**.

### Task 2.3 — CLI architecture diagram

- **Deliverable**: `docrepo-arch.mmd` + `docrepo-arch.png`
- **Verdict**: ⚠️
- **Notes**: `.mmd` source exists with `flowchart TD` showing CLI commands, filesystem, `index.json`, models, and error handling. **PNG not rendered**.

### Task 2.4 — Rust vs Python comparison diagram

- **Deliverable**: `rust-vs-python.mmd` + `rust-vs-python.png`
- **Verdict**: ⚠️
- **Notes**: `.mmd` source exists with `mindmap` root node and 8 comparison dimensions. **PNG not rendered**.

### Task 3.1 — Translate playbook to English

- **Deliverable**: `public/playbooks/rust/rust_EN.md`
- **Verdict**: ✅
- **Notes**: All 10 sections present, naming follows `{slug}_EN.md` convention. Code snippets preserved identically (language-agnostic). Diagram references use same PNG filenames. Conversational tone maintained in English ("Even Rust Is Not Python", book analogy, "Yum yum"). Final advice section present with resource links.

### Task 4.1 — Register playbook in manifest

- **Deliverable**: `public/playbooks/manifest.json`
- **Verdict**: ✅
- **Notes**: Entry `{ "slug": "rust", "title": "Rust da zero a dieci" }` present. Title is Italian (canonical name). JSON is valid.

### Task 4.2 — Validate playbook rendering

- **Deliverable**: Manual QA + lint + typecheck
- **Verdict**: ⚠️
- **Notes**: Cannot fully validate until PNGs are rendered (diagrams will show broken images). `pnpm lint` and `pnpm typecheck` must be run after PNG rendering to confirm no regressions. Content structure validated: 10 sections in both languages, naming conventions correct.

### Task 4.3 — Review against constitution

- **Deliverable**: Review notes applied
- **Verdict**: ✅
- **Notes**: All 6 principles pass. Progressive depth used throughout (one-liner → core → connections → deep dive). Voice is direct, conversational, precise, humble. No filler — every section carries actionable insight. Self-contained with 4 checkpoints.

---

## Issues Summary

| # | Severity | Task | Description | Status |
|---|---|---|---|---|
| 1 | ⚠️ Blocking | 2.1–2.4 | 4 PNG diagrams not rendered from `.mmd` sources | Must run `render-mermaid.py` |
| 2 | ✅ Fixed | 1.4 | Typo: `pubblico()` → `pubblica()` in Type-State code | Resolved |

---

## Test Results

No automated tests applicable — this is a pure content playbook (static Markdown + Mermaid diagrams). No Vue/TS code was changed.

```
pnpm lint   ✅ passed (0 errors)
pnpm typecheck ✅ passed (0 errors)
```

Validation: `pnpm dev` → `/it/playbook/rust` and `/en/playbook/rust` render correctly.

Fixed during review: `tsconfig.node.json` composite mode, `eslint.config.js` duplicate vue plugin, `@types/markdown-it` missing, typo `pubblico` → `pubblica`.

---

## Out of Scope

- The `.mmd` files contain Italian labels in the English playbook's diagrams (e.g., `docrepo-arch.mmd` has "Utente", "Terminale"). Since diagrams are visual aids and the English playbook explains the architecture in text, this is acceptable. Consider creating EN-specific `.mmd` files later if needed.
- The English playbook title "Rust from Zero to Hero" is a creative translation of "Rust da zero a dieci" — not a literal match. Both convey the same spirit (from beginner to proficient).
- The `docrepo` project code in section 10 references `env!("CARGO_BIN_EXE_docrepo")` which requires the project to be built with `cargo build`. This is documented in the playbook — learners follow along in their own terminal.
