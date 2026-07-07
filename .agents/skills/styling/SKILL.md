---
name: styling
description: SCSS + BEM methodology, design tokens, and responsive breakpoints for the Back 2 Basics project. Use when writing or reviewing styles, SCSS partials, or component-level CSS.
---

# Styling — SCSS + BEM

## Methodology

Every component follows **BEM** (Block Element Modifier):

```scss
// Block
.playbook-card {
  padding: 1rem;

  // Element
  &__title {
    font-weight: 600;
  }

  // Modifier
  &--featured {
    border-left: 4px solid var(--color-accent);
  }
}
```

- **No utility classes** — BEM classes only. The HTML is self-documenting.
- **No nesting deeper than 2 levels** in SCSS — keeps specificity flat (0,1,0 – 0,2,0).

## SCSS Architecture

```
src/styles/
├── _reset.scss       # CSS reset / normalize
├── _tokens.scss      # Design tokens (colors, spacing, typography, shadows)
├── _mixins.scss      # Responsive breakpoints, focus-ring, sr-only
├── _a11y.scss        # Reduced motion, high-contrast, focus-visible
├── blocks/           # One partial per BEM block
│   ├── _toolbar.scss
│   ├── _playbook-card.scss
│   └── ...
└── main.scss         # Imports all partials
```

## Design Tokens

```scss
// _tokens.scss
:root {
  --color-bg:           #fafafa;
  --color-surface:      #ffffff;
  --color-text:         #1a1a1a;
  --color-text-muted:   #6e6e6e;
  --color-accent:       #0071e3;  // Apple blue
  --color-border:       #d2d2d7;
  --shadow-sm:          0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md:          0 4px 12px rgba(0, 0, 0, 0.1);
  --radius-md:          12px;
  --font-sans:          -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono:          'SF Mono', 'Fira Code', monospace;
  --space-unit:         0.25rem; // 4px
}
```

## Responsive

- Mobile-first: write base styles for < 640px, then override upward.
- Breakpoints via mixins:

```scss
@mixin mq($bp) {
  @if $bp == sm { @media (min-width: 640px) { @content; } }
  @if $bp == md { @media (min-width: 1024px) { @content; } }
  @if $bp == lg { @media (min-width: 1280px) { @content; } }
}
```

## Scoped Styles

- Use Vue `<style scoped>` for component-local styles.
- Import global tokens and mixins in `vite.config.ts` via `css.preprocessorOptions.scss.additionalData` so they are available in every component without explicit imports.
