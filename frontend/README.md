# CrewDesk Frontend

The frontend is the CrewDesk React application, built and served with Vite. It contains the public site, authenticated user dashboard and group tools, and the management panel.

For full-stack setup and environment configuration, see the [root README](../README.md).

## Data sources

Public pages read from the API rather than from hardcoded arrays.

| Page | Endpoint | Notes |
| --- | --- | --- |
| `/gallery` | `GET /media` | Admin-managed photos and video embeds |
| Footer social icons | `GET /social-links` | |

`/gallery` was previously a hardcoded list of placeholder images and two identical YouTube videos.
It now loads real rows and handles all three non-happy states, because a fresh install has no media
at all — so the empty state is the normal first impression, not an edge case:

- **Loading** — skeleton cards, so the grid does not jump when content arrives.
- **Error** — a message plus a retry action that refetches.
- **Empty** — explains that content is added from the panel, and the tab that has content is
  selected automatically (a gallery with only videos does not open on an empty photo grid).

Content is managed at `/dashboard/gallery` (`pages/admin/MediaManage.tsx`). That page keeps its own
state rather than adding a store, because the gallery is not read anywhere else in the app.

Video players come from `embedUrl`, which the **API** derives from the URL an admin pastes — see
[Gallery in the backend README](../backend/README.md#gallery-media). The frontend never builds a
player URL itself, so the two can never disagree about what is embeddable.

## Layouts

There are three sections and each has exactly one layout. Two of them are signed in and share the
same frame; the public pages use the site shell.

| Section | Routes | Layout |
| --- | --- | --- |
| Public — anyone | `/`, `/about`, `/gallery`, `/education`, `/cooperation`, `/donations`, `/events`, `/login`, `/register`, `*` | `layouts/MainLayout.tsx` — top navigation and footer |
| Signed-in user — any account | `/dashboard/user`, `/dashboard/groups` | `layouts/UserLayout.tsx` — panel shell |
| Management panel — `ADMIN` and `MANAGER` | `/dashboard`, `/dashboard/projects`, `/dashboard/tasks`, `/dashboard/bulk-messages`, `/dashboard/gallery`, plus `/dashboard/users` for `ADMIN` alone | `layouts/AdminLayout.tsx` — panel shell |

The signed-in routes sit **outside** `MainLayout` in `src/App.tsx`. That is intentional: the public
header and footer are site navigation, and inside a signed-in area they compete with the panel
navigation, wrap the tables in a max-width column, and offer links back out to the public pages.

Both signed-in layouts render `components/PanelShell.tsx`, so the bar, the navigation and the
full-width content column are identical everywhere; only the navigation items and the panel title
differ, and the layout passes those in. The bar is the public site's bar — sticky and blurred, the
brand mark and panel name on one side, the links as underlined labels (`lg` and up) that collapse
into the same hamburger menu the public header opens below that width, and "view site" plus logout
on the other. Navigation sits along the top so the content keeps the full width; there is no
sidebar. The items themselves are defined once, in `layouts/sectionNav.tsx`:

| Section and role | Navigation | Title |
| --- | --- | --- |
| Management panel, `ADMIN` | overview, users, projects, tasks, message queue, gallery, groups | داشبورد مدیریتی |
| Management panel, `MANAGER` | the same without users | داشبورد مدیریتی |
| User area, signed in as `ADMIN` or `MANAGER` | my dashboard, groups, then the management pages above | داشبورد من |
| User area, `USER` | my dashboard, groups | داشبورد من |

That table is nearly the whole of the role difference in the UI: administrators and managers see
the same links except the user page, which only an administrator is offered, and nobody else sees
any of them. The rule lives in one place, `src/lib/roles.ts` — `canManageContent` for the pages both
roles run and `canManageUsers` for the administrator-only one. A page renders its content only — it
never renders `PanelShell` itself.

When adding a signed-in page, put it under the layout route of its section in `src/App.tsx`
(`UserLayout` or `AdminLayout`) and add its link to `layouts/sectionNav.tsx`. Wrap it in
`ManagementRoute` if administrators and managers share it, in `AdminRoute` if it is
administrator-only, and list it in `PRIVATE_PATHS` in `scripts/seo-routes.mjs` so the SEO check
knows it is deliberately without metadata.

### Who can reach what

The management panel is **not** wrapped in a guard as a whole. The parent guard is
`ProtectedRoute` (any signed-in user), and the guards are applied per page:

| Route | Roles |
| --- | --- |
| `/dashboard`, `/dashboard/projects`, `/dashboard/tasks`, `/dashboard/bulk-messages`, `/dashboard/gallery` | `ADMIN`, `MANAGER` (`ManagementRoute`) |
| `/dashboard/users` | `ADMIN` (`AdminRoute`) |
| `/dashboard/user`, `/dashboard/groups` | any signed-in user |

That split mirrors the backend: `MANAGEMENT_ROLES` in `backend/src/auth/role-sets.ts` accepts
administrators and managers on every content route, while the account routes in
`backend/src/users/users.controller.ts` stay `ADMIN`-only. The group endpoints in
`backend/src/groups/groups.controller.ts` (`/groups/my`, create group, add/remove member, submit
message) have **no** `@Roles` restriction — they belong to whichever group manager is signed in —
while `GET`/`PATCH /groups/admin/bulk-messages` accept both management roles.

On `/dashboard/groups`, the group's manager adds a member by typing a name or a phone number and
picking from the accounts the API returns (`GET /groups/:id/member-candidates`); a name is not
unique, so the pick is what decides. Search results show a username and the last four digits of the
phone number, never a full number the manager did not already have. The manager can also rename the
group, hand it to one of its members ("انتقال مدیریت" — which is how a manager leaves, since the API
refuses to let a group stand without one), and delete it; a member can leave. Every destructive one
of those asks first through `components/ConfirmDialog.tsx`.

Which group is the caller's comes from the API's `isManager` flag rather than `managerId === user.id`,
so the controls do not depend on a user object the auth store may not have loaded yet.

The page is a thin frame — it loads the list, creates a group and owns the one notice line — over
`stores/groupsStore.ts` (the list and every mutation) and `pages/groups/`: `GroupCard.tsx` for one
group, `MemberList.tsx`, `MemberSearch.tsx` and `MessageComposer.tsx` for the three things that
happen inside it.

`ManagementRoute` redirects anyone else to `/dashboard/groups` — the page in the user area they can
actually use — rather than to the panel overview, which would only redirect them again. `AdminRoute`
sends a manager to `/dashboard`, the panel they do work in, and everyone else to `/dashboard/groups`.

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
| Per-route metadata | `src/seo/routes.ts`, `src/seo/Seo.tsx`, `src/seo/SeoRoute.tsx` | Unique title and description per route, canonical URL, and `noindex` on login and registration. |
| Signed-in pages | `src/seo/NoSeo.tsx` | Every route behind a login — the user area and the administrator area alike — carries no metadata at all: no title, description, canonical or social tags, just `noindex`. It also strips whatever the previously visited public page left in the head. |
| Prerendering | `scripts/prerender.mjs` | Drives a headless browser over the built site and writes real HTML per route (`dist/about/index.html`, …), so every public page is indexable without JavaScript. |
| Crawler files | `scripts/generate-seo-files.mjs` | Generates `robots.txt` and `sitemap.xml` from the same route list and origin as the canonical tags. |

`scripts/check-seo.mjs` runs inside the build and fails it when the two route inventories drift
apart, when `src/App.tsx` has a route that is in neither `src/seo/routes.ts` nor `PRIVATE_PATHS`,
or when two routes share a title or description.

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
`scripts/seo-routes.mjs`. The build fails until you do. If the page sits behind a login, list it
in `PRIVATE_PATHS` in `scripts/seo-routes.mjs` instead and leave it out of both lists above: it
then gets no metadata, only `noindex`, and `scripts/check-seo.mjs` still checks that
`src/seo/SeoRoute.tsx` covers it.

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

## Brand colors and UI foundations

Global design tokens live in `src/index.css`. The primary color is `#59C4CF`; components use the
`primary-*` Tailwind utilities generated from that centralized scale. The same theme defines
accent, semantic, and teal-tinted neutral scales.

Beyond color, `@theme` carries the tokens the UI is built from:

| Token | Purpose |
| --- | --- |
| `--font-sans` | Vazirmatn with a system fallback stack |
| `--shadow-card`, `--shadow-raised`, `--shadow-overlay` | Elevation. Tinted with the palette's dark teal rather than black, so shadows read as part of the same material instead of grey |
| `--shadow-glow` | The brand mark and primary buttons |
| `--animate-fade-in`, `--animate-rise` | Overlay and mobile-menu entrances |

Two behaviours are set globally rather than per component: `body` carries a fixed radial wash from
the primary scale so large empty areas stop looking flat, and a `prefers-reduced-motion` block
disables transitions and animations for users who ask for that.

### Fonts

Vazirmatn is **self-hosted**, not loaded from a CDN. The theme referenced the family from the start
but nothing ever loaded it, so every Persian screen rendered in Tahoma or whatever the OS provided.
It is now a single variable file (weights 100–900, ~110 kB) in `public/fonts/`:

```css
@font-face {
  font-family: "Vazirmatn";
  src: url("/fonts/Vazirmatn-variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```

Self-hosting is deliberate: a third-party font CDN can be blocked or slow for this audience, and a
font that fails to load is easy to miss because the fallback still looks acceptable.

Refresh it from the official package, keeping the bracket-free local filename:

```bash
curl -o public/fonts/Vazirmatn-variable.woff2 \
  "https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/fonts/webfonts/Vazirmatn%5Bwght%5D.woff2"
```

Deployment note: `fonts/` is a subdirectory, so it needs its own nginx location. Without one, the
SPA fallback answers the font request with `index.html` and the browser rejects it, silently
reverting the UI to system fonts — see step 6.4 of [DEPLOYMENT.md](../DEPLOYMENT.md).

## License

The frontend package does not specify a license. See the [root README](../README.md) for repository licensing information.
