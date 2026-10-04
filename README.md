# Tampa Bay Family Clinic — Website

Redesign of [tampabayfamilyclinics.com](https://www.tampabayfamilyclinics.com/) — a modern, mobile-first, bilingual (EN/ES) clinic website with dark/light mode and Mailgun-backed appointment forms.

## Stack

- **Astro 5** (static output)
- **Tailwind CSS v4**
- **Cloudflare Pages** (hosting) + a Cloudflare Pages Function for the contact form
- **Mailgun** (email) + **Cloudflare Turnstile** (CAPTCHA)
- **Cloudflare Web Analytics**

## Getting started

Requires Node.js 20+ (Node 24 recommended).

```bash
npm install
npm run dev          # http://localhost:4321
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the local dev server |
| `npm run build` | Build the static site to `dist/` |
| `npm run preview` | Preview the built site |
| `npm run cf:preview` | Build + run the site with the Cloudflare Function (`wrangler pages dev dist`) |
| `npm run extract` | Regenerate content from the source snapshots |

## Environment variables

Public values go in `.env` (copy `.env.example`). Secrets go in `.dev.vars`
(copy `.dev.vars.example`) for local `cf:preview`, and in
**Cloudflare Pages → Settings → Environment variables** for production.

```
MAILGUN_API_KEY
MAILGUN_DOMAIN
MAILGUN_FROM
MAILGUN_TO
MAILGUN_BCC
PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

> The contact form works in **placeholder mode** until the Mailgun values are set.

## Project structure

```
src/                 Astro app (components, layouts, content, styles, scripts)
  content/pages/     Bilingual page content (en/ and es/)
  components/        Primitives, shell, and section blocks
  assets/legacy/     Licensed images (reused from the current site)
public/              Static files (robots.txt, etc.)
functions/api/       Cloudflare Pages Function (contact form)
scripts/             Content tooling
astro.config.mjs     Astro config
```

> `_project/` holds planning docs, the site inventory, design samples, and
> one-off tooling. It is **git-ignored** and lives only on the local machine.

## Deployment

Connected to **Cloudflare Pages** via Git. Build command `npm run build`,
output directory `dist`. Add the environment variables above in the Cloudflare
dashboard (Production **and** Preview).

## Content & licensing

All page copy and images are reused from the existing site and must remain
verbatim (licensed content). See `_project/docs/REDESIGN-PLAN.md` §13.
