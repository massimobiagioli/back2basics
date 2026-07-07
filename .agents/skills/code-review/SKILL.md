---
name: code-review
description: Code review scope, checklist, and ADR template for the Back 2 Basics project. Use when reviewing a feature implementation against its plan, validating deliverables, or writing an Architecture Decision Record.
---

# Code Review

## Scope Discipline

A Back 2 Basics review validates **only** what the plan promised. This is the cardinal rule.

### Before You Review

Read the plan's Overview and every task deliverable. Build a checklist from those deliverables. That checklist is the boundary of the review — nothing outside it is in scope.

### What to Review

- Each deliverable listed in the plan (existence, test coverage, plan alignment, conventions).
- That the deliverable does what the task description says.
- That tests pass for each deliverable.

### What NOT to Review

- Code outside the feature's files.
- Architectural patterns not directly touched by the feature.
- General code quality improvements unrelated to the feature.
- Performance, unless a task explicitly mentions a performance goal.

### Out-of-Scope Observations

If you notice something worth improving that falls outside scope, record it in the `## Out of Scope` section of the review. These are **informational only** and do not block approval.

```markdown
## Out of Scope

- `Sidebar.vue` could benefit from extracting a composable — not touched by this feature.
- Consider adding a generic `useFetch` composable in a future refactor.
```

## Review Template

```markdown
# Review: <Feature Title>

**Plan**: [docs/plans/<name>.md](../../docs/plans/<name>.md)
**Branch**: `feat/<feature-name>`
**Date**: YYYY-MM-DD
**Reviewer**: Back 2 Basics code-review agent

## Summary

✅ Approved / ⚠️ Changes requested — one-sentence verdict.

---

## Task-by-Task Review

### Task X.Y — <Task Title>

- **Deliverable**: `<path>`
- **Verdict**: ✅ / ⚠️
- **Notes**: (if ⚠️, cite the specific line, missing file, or failing test)

---

## Test Results

```
<pnpm test output>
```

---

## Out of Scope

- (optional)
```

## ADR Template

Every reviewed feature produces an Architecture Decision Record at `docs/adr/<YYYY-MM-DD>-<feature-name>.md`.

```markdown
# ADR: <Feature Title>

**Date**: YYYY-MM-DD
**Status**: accepted | proposed
**Plan**: [docs/plans/<name>.md](../plans/<name>.md)

## Context

What problem does this feature solve? Why was this approach chosen?

## Decision

The key architectural decision(s) made during implementation.

## Consequences

- **Positive**: what improves or becomes possible?
- **Negative**: what trade-offs or limitations were introduced?
- **Risks**: what could go wrong, and how is it mitigated?

## Alternatives Considered

| Alternative | Rejected because |
|---|---|
| … | … |
```

### ADR Status

| Status     | When to use |
|------------|-------------|
| `proposed` | Review found ⚠️ items. ADR is draft — revise after fixes. |
| `accepted` | Review passed with zero ⚠️. The decision is finalised. |
| `superseded`| A later ADR replaces this one. |

## Review Checklist (per task)

- [ ] Deliverable file exists at the expected path
- [ ] Corresponding test file exists
- [ ] Test passes: `pnpm test -- <test-file>`
- [ ] Deliverable matches the task description (no over-engineering)
- [ ] Relevant project conventions are followed
