---
name: deployment
description: Vercel deployment configuration, CI/CD pipeline, and pre-deploy checklist for the Back 2 Basics project. Use when setting up or troubleshooting deployments, configuring vercel.json, or preparing a release.
---

# Deployment — Vercel

## Configuration

`vercel.json` at the project root:

```json
{
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/playbooks/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=3600, stale-while-revalidate=86400" }
      ]
    }
  ]
}
```

## CI/CD (GitHub Actions)

- **Preview**: every PR triggers a Vercel preview deployment.
- **Production**: every push to `main` deploys to production.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` must pass before deploy.

## Environment Variables

| Variable           | Purpose                        |
|--------------------|--------------------------------|
| `VITE_APP_TITLE`   | Default `<title>` fallback     |
| `VITE_DEFAULT_LOCALE` | Startup locale (`en` or `it`) |

No secrets needed — the site has no authentication and no backend.

## Pre-Deploy Checklist

- [ ] `pnpm build` succeeds without errors
- [ ] `vue-tsc --noEmit` passes (type checking)
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] Lighthouse score ≥ 90 on Performance, Accessibility, Best Practices
- [ ] `public/playbooks/` contains at least one `_IT.md` and one `_EN.md` file

## Custom Domain

- Domain configured in Vercel project settings.
- Auto-HTTPS via Let's Encrypt.
- `www` → apex redirect active.
