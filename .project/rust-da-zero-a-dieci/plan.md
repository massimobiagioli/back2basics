# Plan: Rust da zero a dieci

**Status**: `done`
**Branch**: `feat/rust-da-zero-a-dieci`
**Created**: 2026-07-10
**Author**: Back 2 Basics planning agent

## Overview

A comprehensive playbook that teaches the Rust programming language from scratch, explained with the simplicity suitable for a 13-year-old. The playbook covers syntax, the Rust mindset (vs Python), the Cargo toolchain, fundamental constructs (ownership, borrowing, lifetimes), error handling (`Result`, `Option`, `panic!`), design patterns, the language's strengths and weaknesses, testing, and culminates in a hands-on project: building a CLI tool to manage a document repository on the filesystem. Delivered in both Italian (primary) and English, following the [Constitution](../../../docs/CONSTITUTION.md)'s progressive-depth principle and the dual-language playbook convention.

---

## Phase 1: Italian Playbook Content

**Goal**: Author the complete Italian Markdown playbook covering all requested topics, with progressive depth and a conversational tone appropriate for a young learner.

### Task 1.1 — Core concepts & syntax (sections 1–4)

- [x] **Description**: Write the first half of the playbook covering: (1) "Perché Rust?" — what makes Rust special and why it exists; (2) "Rust non è Python" — the mindset shift: compiled vs interpreted, no garbage collector, the compiler as your strict teacher; (3) "Sintassi" — variables (`let`, `let mut`), types, functions, pattern matching with `match`, `if`, loops; (4) "Cargo e i tool" — `cargo new`, `cargo build`, `cargo run`, `cargo fmt`, `cargo clippy`, `rustup`, `rustc`. Use code snippets, comparison tables (Rust vs Python), and a consistent 13-year-old-friendly voice. Follow [Progressive Depth](../../../docs/CONSTITUTION.md#5-progressive-depth).
- **Deliverable**: `public/playbooks/rust/rust_IT.md` — sections 1–4 complete and self-reviewable.
- **Depends on**: —
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md) (playbook suffix convention)

### Task 1.2 — Ownership, borrowing & lifetimes (section 5)

- [x] **Description**: Write section 5, the heart of Rust: (a) Ownership — every value has exactly one owner, move semantics; (b) Borrowing — `&T` (immutable references) and `&mut T` (mutable references), the "one writer XOR many readers" rule; (c) Lifetimes — why they exist, the borrow checker as a safety net, `'a` syntax explained with simple analogies. Use diagrams (to be rendered in Phase 2) and side-by-side code examples showing what compiles vs what doesn't.
- **Deliverable**: Updated `rust_IT.md` with section 5.
- **Depends on**: Task 1.1
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md)

### Task 1.3 — Error handling & exceptions (section 6)

- [x] **Description**: Write section 6, "Gestione degli errori e delle eccezioni" — the Rust approach to error handling, which is fundamentally different from Python's `try`/`except`. Cover: (a) `panic!` — when the program should crash (unrecoverable errors, like Python's unhandled exceptions); (b) `Result<T, E>` — Rust's primary error handling type, the `Ok`/`Err` variants, and why errors are values, not exceptions; (c) `Option<T>` — `Some`/`None` for absence of value, the `?` operator for early return on `None`; (d) The `?` operator — the "propagate or panic" shortcut that makes Rust error handling ergonomic, with before/after code examples; (e) `unwrap()`, `expect()`, `unwrap_or()` — when to use each and when not to; (f) Error libraries — `anyhow` for application code (flexible), `thiserror` for library code (typed), with a comparison table; (g) "Rust vs Python" error comparison table — `try`/`except`/`raise` vs `Result`/`?`/`panic!`. Use simple analogies (e.g., "Result is like a box that contains either a gift or a note explaining what went wrong"). Include a Mermaid flowchart (to be rendered in Phase 2) showing the `Result<T, E>` decision tree.
- **Deliverable**: Updated `rust_IT.md` with section 6.
- **Depends on**: Task 1.2
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md)

### Task 1.4 — Design patterns, good & bad parts, testing (sections 7–9)

- [x] **Description**: Write sections 7, 8, and 9: (7) "Design Pattern in Rust" — `new()` convention, builder pattern, RAII via `Drop`, newtype pattern, `impl Trait` vs generics, type-state pattern; (8) "Good Parts & Bad Parts" — honest assessment: safety & speed (good), steep learning curve & slow compile times (bad), enums + pattern matching (good), async story complexity (bad); (9) "Testing in Rust" — `#[test]`, `cargo test`, unit tests inline, integration tests in `tests/`, `assert!`, `assert_eq!`, `should_panic`. Note: `Result<T, E>` and `Option<T>` as patterns are covered in section 6 (error handling), so section 7 focuses on structural and creational patterns.
- **Deliverable**: Updated `rust_IT.md` with sections 7–9.
- **Depends on**: Task 1.3
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md)

### Task 1.5 — CLI project tutorial (section 10)

- [x] **Description**: Write section 10, the capstone project: building a CLI tool (`docrepo`) to manage a document repository on the filesystem. Cover: (a) project setup with `cargo new docrepo`; (b) using `clap` for argument parsing; (c) commands: `init`, `add <file>`, `list`, `search <query>`, `remove <id>`; (d) storing metadata in a JSON index file; (e) error handling with `anyhow` and `thiserror` (applying section 6 concepts); (f) walk through the complete code with explanations of each block. The project must be buildable and runnable by a learner following along.
- **Deliverable**: Updated `rust_IT.md` with section 10, including complete, copy-pasteable code listings.
- **Depends on**: Task 1.4
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md)

---

## Phase 2: Diagrams & Visuals

**Goal**: Create Mermaid diagrams that illustrate key Rust concepts, render them to PNG, and embed them in the playbook.

### Task 2.1 — Ownership & borrowing diagram

- [x] **Description**: Create `rust-ownership.mmd` — a diagram visualizing ownership transfer (move), immutable borrowing (`&T`), mutable borrowing (`&mut T`), and the borrow checker rules. Use flowchart or sequence diagram style. Render to PNG via `bin/render-mermaid.py`. Embed in section 5 of the Italian playbook.
- **Deliverable**: `public/playbooks/rust/rust-ownership.mmd` and `public/playbooks/rust/rust-ownership.png`.
- **Depends on**: Task 1.2
- **Skills**: [Diagram Workflow](../../../AGENTS.md#diagram-workflow)

### Task 2.2 — Error handling flow diagram

- [x] **Description**: Create `rust-error-handling.mmd` — a flowchart showing the `Result<T, E>` decision tree: function call → `Ok(T)` (happy path, unwrap value) vs `Err(E)` (error path, `?` propagates or `match` handles). Include the `Option<T>` path: `Some(T)` vs `None`. Show the analogy to Python's `try`/`except`/`raise` flow. Render to PNG and embed in section 6.
- **Deliverable**: `public/playbooks/rust/rust-error-handling.mmd` and `public/playbooks/rust/rust-error-handling.png`.
- **Depends on**: Task 1.3
- **Skills**: [Diagram Workflow](../../../AGENTS.md#diagram-workflow)

### Task 2.3 — CLI architecture diagram

- [x] **Description**: Create `docrepo-arch.mmd` — a diagram showing the CLI tool's architecture: commands (`init`, `add`, `list`, `search`, `remove`), the JSON index file, and the filesystem document store. Render to PNG and embed in section 10.
- **Deliverable**: `public/playbooks/rust/docrepo-arch.mmd` and `public/playbooks/rust/docrepo-arch.png`.
- **Depends on**: Task 1.5
- **Skills**: [Diagram Workflow](../../../AGENTS.md#diagram-workflow)

### Task 2.4 — Rust vs Python comparison table diagram

- [x] **Description**: Create `rust-vs-python.mmd` — a visual comparison (mindmap or quadrant chart style) contrasting Rust and Python across dimensions: execution model, memory management, type system, error handling (`try`/`except` vs `Result`/`?`), performance, learning curve. Render to PNG and embed in section 2 ("Rust non è Python").
- **Deliverable**: `public/playbooks/rust/rust-vs-python.mmd` and `public/playbooks/rust/rust-vs-python.png`.
- **Depends on**: Task 1.1
- **Skills**: [Diagram Workflow](../../../AGENTS.md#diagram-workflow)

---

## Phase 3: English Translation

**Goal**: Produce a faithful English translation of the complete Italian playbook.

### Task 3.1 — Translate playbook to English

- [x] **Description**: Translate the full `rust_IT.md` to English, producing `rust_EN.md`. Preserve all code snippets, diagrams, and structural elements exactly as-is (code is language-agnostic). Adapt the conversational tone to maintain the 13-year-old-friendly voice in English. Follow the [i18n playbook suffix convention](../../../.agents/skills/i18n/SKILL.md#playbook-content).
- **Deliverable**: `public/playbooks/rust/rust_EN.md` — complete English playbook with all 10 sections and embedded diagram references.
- **Depends on**: Task 1.5, Task 2.1, Task 2.2, Task 2.3, Task 2.4
- **Skills**: [i18n](../../../.agents/skills/i18n/SKILL.md)

---

## Phase 4: Integration & Validation

**Goal**: Register the playbook in the manifest, verify rendering in the app, and validate all deliverables.

### Task 4.1 — Register playbook in manifest

- [x] **Description**: Add the `rust` playbook entry to `public/playbooks/manifest.json`:

```json
{ "slug": "rust", "title": "Rust da zero a dieci" }
```

The title is Italian because it's the canonical name of this playbook. Verify the sidebar renders the new entry.
- **Deliverable**: Updated `public/playbooks/manifest.json` with the `rust` entry.
- **Depends on**: Task 1.1
- **Skills**: —

### Task 4.2 — Validate playbook rendering

- [x] **Description**: Run `pnpm dev`, navigate to `/it/playbook/rust` and `/en/playbook/rust`, and verify: (a) all sections render correctly; (b) all PNG diagrams display; (c) code blocks are syntax-highlighted; (d) internal links and image paths resolve; (e) the page is responsive on mobile. Check the console for 404s or fetch errors. Run `pnpm lint` and `pnpm typecheck` to ensure no regressions.
- **Deliverable**: Manual QA checklist passed. No console errors. Lint and typecheck green.
- **Depends on**: Task 3.1, Task 4.1
- **Skills**: [Styling](../../../.agents/skills/styling/SKILL.md), [a11y](../../../.agents/skills/a11y/SKILL.md)

### Task 4.3 — Review against constitution

- [x] **Description**: Review the playbook against the [Constitution](../../../docs/CONSTITUTION.md): (a) Principle 1 — no filler, every section carries actionable insight; (b) Principle 2 — assumes CS/SE grounding (even for a 13-year-old, avoid explaining what a variable is); (c) Principle 3 — self-contained, sequential, with checkpoints; (d) Principle 4 — simplicity over completeness; (e) Principle 5 — progressive depth (one-liner → core → connections → deep dive); (f) Principle 6 — direct, conversational, precise, humble voice.
- **Deliverable**: Review notes or minor edits applied to both `rust_IT.md` and `rust_EN.md`.
- **Depends on**: Task 4.2
- **Skills**: [Code Review](../../../.agents/skills/code-review/SKILL.md)
