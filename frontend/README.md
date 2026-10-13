# CrewDesk Frontend

The frontend is the CrewDesk React application, built and served with Vite. It contains the public site, authenticated user dashboard and group tools, and administrator pages.

For full-stack setup and environment configuration, see the [root README](../README.md).

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8); Node.js 24 LTS and npm 11 were used to verify this project.
- A running CrewDesk backend (default API URL: `http://localhost:3000`).
- For production builds, an installed Chrome, Chromium or Edge to prerender pages. See [SEO](#seo).

## Setup

From this directory:

```bash
cp .env.example .env
npm ci
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL. Empty means same-origin. |
| `VITE_SITE_URL` | Public origin of the site; builds canonical URLs and the sitemap. |
| `VITE_OG_IMAGE` | Social preview image, default `/og-image.png`. |
| `VITE_ADMIN_PHONE` | Optional contact phone on the registration page. |
| `VITE_TELEGRAM_ADMIN` | Optional Telegram username on the registration page. |

PowerShell equivalent for copying the template: `Copy-Item .env.example .env`.

Never put secrets in `VITE_*` variables; Vite embeds them in browser-accessible assets.

## Development and production

```bash
npm run dev
```

Vite serves the application at `http://localhost:5173` by default. Create a production build with:

```bash
npm run build:prod
npm run preview
```

`npm run build` runs the TypeScript project build and Vite's production build, then the SEO
pipeline (route metadata check, `robots.txt`/`sitemap.xml` generation, and prerendering) and
writes everything to `dist/`. `npm run build:spa` stops after `vite build` and skips the SEO
steps entirely.

`npm run build:prod` is the same pipeline with two stricter settings for a release: it refuses
to build when `VITE_SITE_URL` is still `localhost` or a placeholder, and it fails rather than
warns if a page cannot be prerendered.

The project targets CrewDesk, but the values that are specific to one installation — the public
origin `https://quomsalman.ir` and the domain used in `DEPLOYMENT.md` — are examples. Set
`VITE_SITE_URL` to your own origin; nothing else is site-specific.

## SEO

The site is a client-side React application, so the raw `index.html` contains no page content
until JavaScript runs. Google executes JavaScript, but it does so on a delayed second pass, and
most other crawlers (Telegram, WhatsApp, Instagram, LinkedIn previews, and many regional search
engines) never execute it at all. Four things close that gap:

| Piece | Where | What it does |
| --- | --- | --- |
| Static head | `index.html` | Title, description, canonical, Open Graph, Twitter Card, `Organization`/`WebSite` JSON-LD, and a `<noscript>` description for crawlers that do not run JavaScript. |
| Per-route metadata | `src/seo/routes.ts`, `src/seo/Seo.tsx`, `src/seo/SeoRoute.tsx` | Unique title and description per route, canonical URL, and `noindex` on login, registration and dashboards. |
| Prerendering | `scripts/prerender.mjs` | Drives a headless browser over the built site and writes real HTML per route (`dist/about/index.html`, …), so every public page is indexable without JavaScript. |
| Crawler files | `scripts/generate-seo-files.mjs` | Generates `robots.txt` and `sitemap.xml` from the same route list and origin as the canonical tags. |

`scripts/check-seo.mjs` runs inside the build and fails it when the two route inventories drift
apart, when `src/App.tsx` has a route with no SEO entry, or when two routes share a title or
description.

`scripts/verify-seo.mjs` (`npm run seo:verify`) inspects the built `dist/` the way a crawler
would: exactly one `<h1>` per page, no leftover `<noscript>`, a non-empty root element, a
canonical and `og:image` on every page, and a sitemap that lists every indexable route and no
private ones. Run it after a build, and in CI before deploying.

Prerendering needs an installed Chrome, Chromium or Edge. It uses `puppeteer-core` and never
downloads a browser of its own; set `CHROME_PATH` to point at one explicitly. If no browser is
found the step is skipped with a warning and the rest of the build still succeeds, so the site
deploys — just without prerendered pages.

### Keeping it accurate

Two values must match the real deployment, and both are baked in at build time:

- `VITE_SITE_URL` — the public origin. It builds every canonical URL, `og:url`, sitemap entry and
  the `Sitemap:` line in `robots.txt`.
- `VITE_OG_IMAGE` — a 1200×630 image in `public/`. The repository ships `og-image.png`; regenerate
  it with `python ../deploy/scripts/create-og-image.py` if the branding changes.

When you add a page, add its title and description to `src/seo/routes.ts` and its path to
`scripts/seo-routes.mjs`. The build fails until you do.

## Icons

The mark is the Persian letter **ق** — the first letter of «قوم سلمان» — in white on the brand
teal gradient, inside a rounded square. A single glyph survives downscaling better than a
detailed illustration, and it is immediately readable to the audience this site serves.

Regenerate the whole set (font, palette and sizes all live in the script):

```bash
npm run icons:generate      # python scripts/create-favicons.py --preview
```

| File in `public/` | Used for |
| --- | --- |
| `favicon.svg` | Modern browsers and browser tabs. Glyph stored as an outline path from the font, so it needs no installed Persian font. |
| `favicon.ico` | Fallback; browsers request it even when an SVG icon is declared. Contains 16/24/32/48/64 px frames. |
| `favicon-16x16.png`, `favicon-32x32.png`, `favicon-48x48.png` | Explicit sizes for browsers that prefer PNG. |
| `apple-touch-icon.png` | iOS home-screen icon. Opaque, because iOS ignores transparency. |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | Android home screen and install prompts. |
| `site.webmanifest` | App name, colors and the Android icon set. Not a full PWA — there is no service worker. |

`--preview` also writes `scripts/_favicon-preview.png`, a sheet of the mark from 16 px to 256 px
so the result can actually be checked rather than assumed.

`npm run icons:verify` renders the set in a real browser and asserts two things that are easy to
get wrong silently: every icon loads, and `favicon.svg` contains the glyph rather than only the
tile. A malformed SVG path still renders the gradient, so a broken favicon otherwise looks fine
until someone looks at a browser tab.

Requirements for regenerating: Python with `Pillow`, `arabic-reshaper`, `python-bidi` and
`fonttools`, plus a Persian font (`Vazirmatn`, `Vazir` or `Tahoma`) — pass `--font` to override
detection. The script checks the usual per-user and system font directories on Windows, macOS and
Linux.

## Scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `vite` |
| `npm run build` | `tsc -b && vite build` plus the SEO pipeline |
| `npm run build:prod` | As above, strict about the site URL and prerender failures |
| `npm run build:spa` | `tsc -b && vite build` only |
| `npm run lint` | `oxlint` |
| `npm run preview` | `vite preview` |
| `npm run seo:check` | Verify route metadata consistency |
| `npm run seo:files` | Regenerate `robots.txt` and `sitemap.xml` |
| `npm run seo:prerender` | Prerender public routes to static HTML |
| `npm run seo:verify` | Audit the built `dist/` output |
| `npm run icons:generate` | Regenerate the favicon and app-icon set |
| `npm run icons:verify` | Render the icons in a browser and check them |

The frontend declares React and React DOM `^19.2.8`, React Router `^8.3.1`, Tailwind CSS `^4.3.3`, Ant Design `^6.6.2`, and Vite `^8.2.2`. See `package.json` and `package-lock.json` for the full dependency set and resolved versions. No frontend test script is currently configured.

## Brand colors

Global design tokens live in `src/index.css`. The primary color is `#59C4CF`; components use the `primary-*` Tailwind utilities generated from that centralized scale. The same theme defines accent, semantic, and teal-tinted neutral scales.

## License

The frontend package does not specify a license. See the [root README](../README.md) for repository licensing information.
