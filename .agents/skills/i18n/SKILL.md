---
name: i18n
description: Internationalization patterns for Back 2 Basics — playbook suffix convention, vue-i18n setup, and language switcher. Use when implementing locale switching, translating UI strings, or resolving playbook file paths.
---

# Internationalization

## Playbook Content

- Playbooks are static Markdown files organized in **subdirectories** under `public/playbooks/`.
- **Naming convention**: `public/playbooks/{slug}/{slug}_{locale}.md` — e.g. `networking/networking_IT.md`.
- Diagrams (.mmd source, .png rendered) live alongside the markdown in the same subdirectory.

```
public/playbooks/
├── networking/
│   ├── networking_IT.md
│   ├── networking_EN.md
│   ├── tcp-ip-stack.mmd
│   └── tcp-ip-stack.png
├── http/
│   ├── http_IT.md
│   ├── http_EN.md
│   ├── http-request-response.mmd
│   └── http-request-response.png
└── manifest.json
```

## UI Strings

- UI labels (toolbar, nav, buttons) are in JSON bundles under `src/locales/`:

```json
// src/locales/en.json
{
  "toolbar": {
    "home": "Home",
    "language": "Language"
  }
}
```

- Bundles are lazy-loaded per locale using `vue-i18n`:

```ts
const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: { en }
})
```

- On locale switch, load the target bundle dynamically:

```ts
async function setLocale(locale: 'it' | 'en') {
  const messages = await import(`@/locales/${locale}.json`)
  i18n.global.setLocaleMessage(locale, messages.default)
  i18n.global.locale.value = locale
}
```

## Language Switcher

- Visible in the toolbar at all times.
- Toggle button with `aria-label` reflecting the action (e.g. "Switch to Italian").
- Persisted to `localStorage` under key `b2b-locale`.
- URL path reflects locale: `/en/playbook/bgp`, `/it/playbook/bgp`.

## Playbook Resolution

```ts
function resolvePlaybookPath(slug: string, locale: string): string {
  return `/playbooks/${slug}_${locale.toUpperCase()}.md`
}
```

- Before rendering, check the file exists (fetch HEAD). If missing, fall back to `_EN`.
