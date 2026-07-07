---
name: a11y
description: Accessibility standards and checklist for the Back 2 Basics project — WCAG 2.2 AA, semantic HTML, keyboard navigation, and screen reader support. Use when building or reviewing UI components.
---

# Accessibility

## Standard

Target **WCAG 2.2 Level AA** compliance on every view.

## Automated Checks

- `eslint-plugin-vue-a11y` runs in the editor and CI.
- `axe-core` audits via Playwright E2E tests on every PR.
- `vue-tsc` catches missing required ARIA attributes through typed component props.

## Semantic HTML

- Use native elements first: `<button>` not `<div onclick>`, `<nav>` for navigation, `<main>` for content.
- Headings form a logical outline: one `<h1>` per page, never skip levels (h1 → h2 → h3).

## Keyboard

- Every interactive element is reachable and operable via keyboard.
- Focus order matches visual order.
- Custom components manage focus with Vue's `ref` + `.focus()`.
- No `tabindex` greater than 0.

## Screen Readers

- `aria-label` or `aria-labelledby` on every interactive region.
- `aria-live="polite"` on content areas that update asynchronously (playbook loading).
- `sr-only` mixin for visually hidden content that screen readers need:

```scss
@mixin sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

## Color & Contrast

- All text/background combinations meet **WCAG AA** minimum contrast ratio (4.5:1 for normal text, 3:1 for large text).
- Never convey information through color alone — always pair with an icon or text.
- `prefers-contrast: more` and `prefers-color-scheme: dark` are respected via CSS custom properties.

## Motion

- `prefers-reduced-motion: reduce` disables all animations and transitions.
- Default transitions do not exceed 200ms.
- `scroll-behavior: smooth` only when `prefers-reduced-motion: no-preference`.

## Checklist (per component)

- [ ] Can be operated with keyboard only
- [ ] Has appropriate ARIA roles and labels
- [ ] Passes `eslint-plugin-vue-a11y`
- [ ] Visible focus indicator (`:focus-visible`)
- [ ] Text meets contrast ratios
