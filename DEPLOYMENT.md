# CrewDesk — Production Deployment Guide (no Docker)

A complete, copy-pasteable path from a bare Ubuntu server to `https://crewdesk.example.com`
running the CrewDesk API and web client as native services managed by **systemd**, fronted by
**nginx** with a free **Let's Encrypt** certificate.

**Replace `crewdesk.example.com` with your real domain everywhere, and pick your own
passwords.** Every block below is meant to be read once, then run in order.

---

## Contents

- [0. What you are building](#0-what-you-are-building)
- [1. Prerequisites](#1-prerequisites)
- [2. Prepare the server](#2-prepare-the-server)
- [3. Create the PostgreSQL database](#3-create-the-postgresql-database)
- [4. Create the service user and directories](#4-create-the-service-user-and-directories)
- [5. Install Node.js](#5-install-nodejs)
- [6. Build the applications](#6-build-the-applications)
- [7. Put the code on the server](#7-put-the-code-on-the-server)
- [8. Configure and start the API (systemd)](#8-configure-and-start-the-api-systemd)
- [9. Configure nginx](#9-configure-nginx)
- [10. Point the domain at the server (DNS)](#10-point-the-domain-at-the-server-dns)
- [11. Enable HTTPS](#11-enable-https)
- [12. Firewall](#12-firewall)
- [13. Verify the deployment](#13-verify-the-deployment)
- [14. Day-two operations](#14-day-two-operations)
- [15. Troubleshooting](#15-troubleshooting)
- [16. Security hardening checklist](#16-security-hardening-checklist)
- [Appendix A: Deploying frontend and API on separate domains](#appendix-a-deploying-frontend-and-api-on-separate-domains)
- [Appendix B: systemd and nginx survival notes](#appendix-b-systemd-and-nginx-survival-notes)

Bundled with this guide, ready to copy to the server:

| File | Goes to |
| --- | --- |
| [`deploy/templates/backend.env.production.example`](deploy/templates/backend.env.production.example) | `/opt/crewdesk/backend/.env` |
| [`deploy/templates/frontend.env.production.example`](deploy/templates/frontend.env.production.example) | `frontend/.env.production` on the build machine |
| [`deploy/templates/crewdesk-api.service`](deploy/templates/crewdesk-api.service) | `/etc/systemd/system/crewdesk-api.service` |
| [`deploy/templates/nginx-crewdesk.conf`](deploy/templates/nginx-crewdesk.conf) | `/etc/nginx/sites-available/crewdesk` |
| [`deploy/scripts/create-og-image.py`](deploy/scripts/create-og-image.py) | Run locally to regenerate the social preview image |

---

## 0. What you are building

```text
                    Internet (HTTPS, port 443)
                              │
                    ┌─────────▼──────────┐
                    │   nginx  (TLS)     │  certbot-managed certificate
                    │  crewdesk.example  │
                    └───┬────────────┬───┘
       / , /dashboard...│            │ /auth /users /projects /tasks
       /assets/*        │            │ /groups /social-links /docs
                        ▼            ▼
        /var/www/crewdesk     127.0.0.1:3000
        (Vite build output)   systemd: crewdesk-api (NestJS)
                                     │
                                     ▼
                              127.0.0.1:5432
                              PostgreSQL 16 (crewdesk db)
```

**Why this shape**

- **One origin.** The browser loads the page and calls the API on the same domain, so there is
  no cross-origin request to misconfigure. The API's `FRONTEND_URL` CORS setting still exists
  and is still set correctly, but it stops being a source of production incidents.
- **The API never listens publicly.** It binds port 3000 on localhost only; nginx is the only
  process exposed to the internet. One place for TLS, rate limiting, and logs.
- **No Docker.** Node runs straight from `node dist/main` under systemd, PostgreSQL comes from
  the distribution, and nginx handles the web tier.

**Fixed decisions used throughout the guide** (change them consistently if you prefer other paths):

| Item | Value |
| --- | --- |
| Domain | `crewdesk.example.com` |
| Linux user / group for the app | `crewdesk` |
| API code + `.env` | `/opt/crewdesk/backend` |
| Frontend static files | `/var/www/crewdesk` |
| Environment file | `/opt/crewdesk/backend/.env` |
| systemd unit | `crewdesk-api.service` |
| API listen port | `3000` (localhost only) |

---

## 1. Prerequisites

- A server (VPS or dedicated) running **Ubuntu 22.04 or 24.04 LTS**, with sudo/root access.
  Minimum realistic size: **1 vCPU, 1 GB RAM, 20 GB SSD** — 2 GB RAM makes the builds comfortable.
- A **domain you control**, with access to its DNS records.
- The project source (this repository) available either on your workstation or via Git.
- **Node.js 20.19+ or 22.12+** on the build machine (Vite 8 requires it; Node 22 LTS or 24 LTS is
  recommended). Docker is not used anywhere in this guide.
- Ports **80** and **443** reachable from the internet, and **22** for SSH. Port 3000 must stay closed.

---

## 2. Prepare the server

```bash
# Log in as your admin user, then:
sudo apt update && sudo apt -y upgrade

sudo apt -y install curl ca-certificates gnupg git rsync ufw \
                    nginx postgresql postgresql-contrib \
                    build-essential apache2-utils
```

`build-essential` is only needed if you install native npm modules; it is cheap insurance.
`apache2-utils` provides `htpasswd`, used later to protect the Swagger page.

Set the timezone so logs and cron match your expectations:

```bash
sudo timedatectl set-timezone Asia/Tehran   # or your timezone
timedatectl
```

Confirm PostgreSQL and nginx are installed and enabled:

```bash
sudo systemctl enable --now postgresql nginx
systemctl --no-pager --lines=0 status postgresql nginx
```

**Swap file (do this on any server with less than 2 GB RAM).** `npm ci` and `vite build` are
memory hungry and will be OOM-killed on a small VPS without swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
free -h
```

---

## 3. Create the PostgreSQL database

Create a dedicated database and a dedicated database user. Never point the application at the
`postgres` superuser in production.

```bash
# Generate a strong password and keep it somewhere safe: it goes into .env in step 8.
openssl rand -base64 24
```

```bash
sudo -u postgres psql
```

Inside the `psql` prompt (replace `PASTE_GENERATED_PASSWORD`):

```sql
CREATE ROLE crewdesk WITH LOGIN PASSWORD 'PASTE_GENERATED_PASSWORD';
CREATE DATABASE crewdesk OWNER crewdesk ENCODING 'UTF8';
-- The app uses TypeORM synchronize, which creates and alters its own tables,
-- so the role must own the schema of its own database.
\c crewdesk
GRANT ALL ON SCHEMA public TO crewdesk;
ALTER SCHEMA public OWNER TO crewdesk;
\q
```

Verify the credentials work over TCP (the API connects this way):

```bash
PGPASSWORD='PASTE_GENERATED_PASSWORD' psql -h 127.0.0.1 -U crewdesk -d crewdesk -c '\conninfo'
```

> **Schema management.** `backend/src/app.module.ts` sets `synchronize: true`, so TypeORM creates
> and updates tables automatically at API startup. That is convenient and risky: it can alter or
> drop columns when an entity changes. For a first deployment it is fine. Before you make your
> first schema change on live data, read
> [Security hardening checklist](#16-security-hardening-checklist) and take a backup.

---

## 4. Create the service user and directories

The API must not run as root. Create a system user with no shell and no home directory, then
create the two directory trees.

```bash
sudo adduser --system --group --no-create-home --shell /usr/sbin/nologin crewdesk

sudo mkdir -p /opt/crewdesk/backend
sudo mkdir -p /var/www/crewdesk

# The app user owns its code and .env; nginx only needs to READ the web root.
sudo chown -R crewdesk:crewdesk /opt/crewdesk
sudo chown -R www-data:www-data /var/www/crewdesk
sudo chmod 755 /opt/crewdesk /opt/crewdesk/backend /var/www/crewdesk
```

---

## 5. Install Node.js

Install Node.js from NodeSource so you control the major version and get security updates. Use
the same major version on your build machine and on the server — it avoids surprises such as
native module ABI mismatches.

```bash
# Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt -y install nodejs

node -v      # expect v22.x
npm -v
```

If you prefer the distribution package, `sudo apt -y install nodejs npm` also works on Ubuntu
24.04, but verify `node -v` reports **20.19+ or 22.12+** before continuing; older releases
cannot build the frontend.

---

## 6. Build the applications

You build **once**, then ship the results. `frontend` compiles to static files;
`backend` compiles to JavaScript that runs on the server's Node.

### 6.1 Decide where to build

- **Build on your workstation, upload the artifacts** (recommended). Keeps compilers and
  devDependencies off the server and keeps the deployment fast and repeatable.
- **Build on the server.** Simpler if the server has ≥2 GB RAM, and required if
  `npm ci` needs to run there anyway. Commands are the same; the paths differ.

The steps below assume **build on your workstation** (uploaded artifacts). The server-build
alternative is [step 7.1](#71-building-on-the-server-alternative-to-72); if you take it, skip
step 6 entirely and go to 7.1.

### 6.2 Backend

On your workstation, in the repository root:

```bash
cd backend

# Secrets are not needed here: the API reads them at RUNTIME from the .env file
# on the server. Nest only compiles TypeScript during the build.
npm ci
npm run build          # -> backend/dist/
```

Confirm `backend/dist/main.js` exists. That is the `start:prod` entrypoint.

If you build **on the server**, see [step 7.1](#71-building-on-the-server-alternative-to-72).

### 6.3 Frontend

```bash
cd ../frontend

# Create the production env file FIRST — Vite inlines VITE_* values into the
# bundle at build time. Changing them later requires a rebuild.
cp ../deploy/templates/frontend.env.production.example .env.production
```

Edit `frontend/.env.production`:

```ini
# Same-origin setup: leave EMPTY so requests go to the current origin
# (e.g. https://crewdesk.example.com/auth/login).
VITE_API_BASE_URL=

# Your real public origin. This builds every canonical URL, og:url, the sitemap
# entries and robots.txt — a wrong value here tells search engines to index a
# domain you do not own.
VITE_SITE_URL=https://crewdesk.example.com

# Social preview image (1200x630). The repository ships one at /og-image.png.
VITE_OG_IMAGE=/og-image.png

VITE_ADMIN_PHONE=+98xxxxxxxxxx
VITE_TELEGRAM_ADMIN=your_telegram_username
```

Then build:

```bash
npm ci
npm run build:prod     # -> frontend/dist/
```

> **Important:** `VITE_API_BASE_URL` is compiled into the shipped JavaScript. If you set it to
> `http://localhost:3000` (the development value) or forget to rebuild after changing it, the
> deployed site will try to call a server that does not exist and every page will look broken.
> For the same-origin setup, **empty is correct**: axios then requests `/auth/login` on the page's
> own origin. Keep it empty (or a full `https://…` origin) rather than a bare `/api`-style path —
> the backend has no global route prefix, so `https://host` + `/auth/login` is the whole URL.

### 6.4 What the frontend build produces

`npm run build:prod` is not a plain `vite build`. It also runs the SEO pipeline described in the
[frontend README](frontend/README.md#seo), and it is strict in two ways worth knowing about
before you run it:

1. **It needs a browser.** Public routes are prerendered to static HTML with `puppeteer-core`
   driving your installed Chrome, Chromium or Edge. Nothing is downloaded. If your build machine
   has no browser, the step is skipped with a warning and the build still succeeds — the site
   works, but crawlers that do not execute JavaScript will see an empty shell. Set `CHROME_PATH`
   to point at a browser explicitly.
2. **It refuses a placeholder origin.** If `VITE_SITE_URL` is still `localhost` or
   `example.com`, the build stops with an error rather than shipping canonical URLs that point at
   a machine nobody can reach. This catches the common mistake of building locally where a
   development `.env` exists.

The result is more than an `index.html`:

```text
frontend/dist/
├── index.html              prerendered home page
├── about/index.html        prerendered, one directory per public route
├── education/index.html
├── gallery/index.html
├── cooperation/index.html
├── donations/index.html
├── events/index.html
├── login/index.html        prerendered but marked noindex
├── register/index.html     prerendered but marked noindex
├── robots.txt              generated
├── sitemap.xml             generated
├── favicon.svg             brand mark (vector)
├── favicon.ico             legacy browser fallback
├── favicon-16x16.png       …
├── favicon-32x32.png
├── favicon-48x48.png
├── apple-touch-icon.png    iOS home screen
├── android-chrome-*.png    Android home screen
├── site.webmanifest        app name and icons
├── fonts/                  self-hosted Vazirmatn (served by the /fonts/ block)
├── og-image.png            social preview image
└── assets/                 hashed JS and CSS
```

These are ordinary static files, and the nginx configuration serves them directly. Two cases are
worth knowing about:

- `favicon.ico` and `site.webmanifest` have exact-match locations so the SPA fallback can never
  serve `index.html` in their place.
- `fonts/` has its own `location /fonts/` block. Without it the root-level allow-list would not
  match the subdirectory, the fallback would answer with `index.html`, the browser would reject
  the font on its MIME type, and **every Persian screen would quietly fall back to system fonts**.
  The site would still look broadly fine, which is what makes it easy to miss.

Confirm the origin baked into the build before uploading:

```bash
grep -o '<link rel="canonical"[^>]*>' dist/index.html
grep -o '<loc>[^<]*</loc>' dist/sitemap.xml | head -3
```

Both must show your real domain. If they show `localhost`, `.env.production` was not picked up.

There is also an output audit you can run at any time — it re-checks the built directory the way a
crawler sees it (one `<h1>` per page, no leftover `<noscript>`, canonical and `og:image` present,
sitemap accuracy):

```bash
npm run seo:verify
```

Icons are generated files too, and a broken one is easy to miss. This renders them in a real
browser and asserts every icon loads and that `favicon.svg` actually contains the mark rather than
only the background tile:

```bash
npm run icons:verify
```

Regenerate the icon set from the script if the branding changes (see the
[frontend README](frontend/README.md#icons)):

```bash
npm run icons:generate
```

### 6.5 Assemble the release folder

```bash
cd ..   # repository root
rm -rf release && mkdir -p release/backend release/frontend

# Backend: compiled output + the dependency manifest so the server can install
# production dependencies only.
cp -r backend/dist              release/backend/
cp    backend/package.json      release/backend/
cp    backend/package-lock.json release/backend/

# Frontend: the static build output only.
cp -r frontend/dist/.           release/frontend/
```

`release/backend` deliberately excludes `src/`, `test/`, `node_modules`, and `.env`.

> **Do not copy `backend/tsconfig.build.tsbuildinfo` to the server.** `rsync -a` preserves
> modification times, and TypeScript's incremental build state can then make the server's
> `npm run build` skip compilation of genuinely changed sources. The list above already omits it;
> keep it that way, and delete any stray copy with
> `sudo rm -f /opt/crewdesk/backend/tsconfig.build.tsbuildinfo`.

---

## 7. Put the code on the server

### 7.1 Building on the server (alternative to 7.2)

If you chose to build on the server instead of uploading artifacts, run this block **on the
server**, then continue at [7.3](#73-install-production-dependencies-on-the-server):

```bash
sudo -u crewdesk git clone <YOUR_REPOSITORY_URL> /opt/crewdesk/src

# --- API ---
cd /opt/crewdesk/src/backend
sudo -u crewdesk npm ci
sudo -u crewdesk npm run build

# --- Web client ---
cd /opt/crewdesk/src/frontend
sudo -u crewdesk npm ci

# Create the production env file (see step 6.3), then build.
# The build needs a browser to prerender pages — on a headless server install one, e.g.
#   sudo apt -y install chromium-browser
# or set CHROME_PATH to an existing binary. Without one the build warns and skips
# prerendering instead of failing.
sudo -u crewdesk cp ../deploy/templates/frontend.env.production.example .env.production
sudo nano /opt/crewdesk/src/frontend/.env.production
sudo -u crewdesk npm run build:prod
```

Then copy the results into place:

```bash
sudo rsync -a --delete /opt/crewdesk/src/backend/dist/ /opt/crewdesk/backend/dist/
sudo rsync -a --delete /opt/crewdesk/src/backend/package.json \
                       /opt/crewdesk/src/backend/package-lock.json /opt/crewdesk/backend/
sudo rsync -a --delete /opt/crewdesk/src/frontend/dist/ /var/www/crewdesk/

# Steps 8 and 9 read the templates from this path, so place them here too.
sudo rsync -a --delete /opt/crewdesk/src/deploy/ /opt/crewdesk/deploy/
sudo chown -R root:root /opt/crewdesk/deploy

sudo chown -R crewdesk:crewdesk /opt/crewdesk/backend
sudo chown -R www-data:www-data /var/www/crewdesk
```

### 7.2 Upload the release

From your workstation, in the repository root (replace `deploy` with your SSH user and host):

```bash
# Backend code
rsync -avz --delete release/backend/ deploy@crewdesk.example.com:/tmp/crewdesk-backend/

# Frontend static files
rsync -avz --delete release/frontend/ deploy@crewdesk.example.com:/tmp/crewdesk-frontend/

# The deployment templates from this folder (env examples, unit file, nginx config)
rsync -avz --delete deploy/ deploy@crewdesk.example.com:/tmp/crewdesk-deploy/
```

On the server, move them into place:

```bash
sudo rsync -a --delete /tmp/crewdesk-backend/  /opt/crewdesk/backend/
sudo rsync -a --delete /tmp/crewdesk-frontend/ /var/www/crewdesk/
sudo rsync -a --delete /tmp/crewdesk-deploy/   /opt/crewdesk/deploy/

sudo chown -R crewdesk:crewdesk /opt/crewdesk/backend
sudo chown -R root:root        /opt/crewdesk/deploy
sudo chown -R www-data:www-data /var/www/crewdesk

rm -rf /tmp/crewdesk-backend /tmp/crewdesk-frontend /tmp/crewdesk-deploy

# Sanity check: the entrypoint must exist, the web root must have index.html,
# and the templates must be in place.
ls -l /opt/crewdesk/backend/dist/main.js
ls -l /var/www/crewdesk/index.html
ls    /var/www/crewdesk/assets | head
ls -l /opt/crewdesk/deploy/templates/
```

### 7.3 Install production dependencies on the server

`node_modules` is not uploaded; the server installs only what the compiled API needs at runtime.

```bash
cd /opt/crewdesk/backend
sudo -u crewdesk npm ci --omit=dev

# Verify NestJS and the Postgres driver resolved:
sudo -u crewdesk node -e "require('@nestjs/core'); require('pg'); console.log('runtime deps OK')"
```

> The server needs network access to the npm registry for this step. If your server cannot reach
> it, run `npm ci --omit=dev` on a machine that can, then upload the whole `node_modules`
> directory alongside `dist` and `package.json`.

---

## 8. Configure and start the API (systemd)

### 8.1 Write the environment file

Create the file from the bundled template that you uploaded in step 7.2:

```bash
sudo cp /opt/crewdesk/deploy/templates/backend.env.production.example /opt/crewdesk/backend/.env
sudo nano /opt/crewdesk/backend/.env
```

Fill in your real values. The finished file must look like this, with **no quotes** around values
and **no trailing spaces**:

```ini
PORT=3000
FRONTEND_URL=https://crewdesk.example.com

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USERNAME=crewdesk
DB_PASSWORD=the_password_from_step_3
DB_DATABASE=crewdesk

JWT_SECRET=paste_the_output_of_openssl_rand_base64_48_here

SEED_ADMIN=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=a_strong_unique_admin_password
ADMIN_ROLE=ADMIN
```

Generate the JWT secret with `openssl rand -base64 48`.

Then lock the file down — it contains the database password and the admin password:

```bash
sudo chown crewdesk:crewdesk /opt/crewdesk/backend/.env
sudo chmod 600 /opt/crewdesk/backend/.env
sudo ls -l /opt/crewdesk/backend/.env     # expect: -rw------- crewdesk crewdesk
```

Field reference (`FRONTEND_URL` and `PORT` are the ones that bite in production):

| Variable | Production value | Notes |
| --- | --- | --- |
| `PORT` | `3000` | Keep private behind nginx. |
| `FRONTEND_URL` | `https://crewdesk.example.com` | CORS allow-origin. Exact scheme + host, **no trailing slash**. Comma-separate for several origins. |
| `DB_HOST` / `DB_PORT` | `127.0.0.1` / `5432` | Local PostgreSQL. |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | from step 3 | |
| `JWT_SECRET` | 48+ random bytes | Changing it invalidates every issued token. |
| `SEED_ADMIN` | `true` for first start, then `false` | The seed creates the admin only if the username is absent. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` / `ADMIN_ROLE` | your values | `ADMIN_ROLE` ∈ `ADMIN`, `REGISTRAR`, `REPORT_VIEWER`. |

### 8.2 Install the systemd unit

```bash
sudo cp /opt/crewdesk/deploy/templates/crewdesk-api.service /etc/systemd/system/crewdesk-api.service
sudo nano /etc/systemd/system/crewdesk-api.service   # adjust paths if you changed them
sudo systemctl daemon-reload
sudo systemctl enable --now crewdesk-api
```

Watch it start:

```bash
systemctl status crewdesk-api --no-pager
sudo journalctl -u crewdesk-api -n 50 --no-pager
```

A healthy first boot logs a TypeORM connection, then:

```text
Admin user seeded
Application running on port 3000
```

Then confirm the API answers on localhost:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/social-links   # expect 200
curl -sS http://127.0.0.1:3000/social-links
```

`{"statusCode":500,...}` here almost always means the database credentials or database name are
wrong — check the journal for the PostgreSQL error.

### 8.3 Turn the seed off

Once you have logged in successfully (step 13), stop the seed from being a permanent credential:

```bash
sudo sed -i 's/^SEED_ADMIN=true/SEED_ADMIN=false/' /opt/crewdesk/backend/.env
sudo systemctl restart crewdesk-api
```

Also remove `ADMIN_PASSWORD` from the file, or at least make sure it is no longer a password you
use elsewhere. The real admin password is now stored hashed in the database.

---

## 9. Configure nginx

### 9.1 Install the site

```bash
sudo cp /opt/crewdesk/deploy/templates/nginx-crewdesk.conf /etc/nginx/sites-available/crewdesk

# Set your real domain in both server_name and any references:
sudo sed -i 's/crewdesk\.example\.com/YOUR.DOMAIN.HERE/g' /etc/nginx/sites-available/crewdesk

sudo ln -sf /etc/nginx/sites-available/crewdesk /etc/nginx/sites-enabled/crewdesk

# Ubuntu's default catch-all would swallow requests; remove it.
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # must print: syntax is ok / test is successful
sudo systemctl reload nginx
```

### 9.2 What the configuration does

| Request | Handled by | Why |
| --- | --- | --- |
| `/`, `/about`, `/dashboard/users` | `try_files $uri $uri/index.html $uri/ /index.html` | Prerendered pages are real files and win; otherwise React Router owns client-side routes, so deep links and refreshes must not 404. |
| `/assets/*` | static, `Cache-Control: immutable` | Vite emits content-hashed filenames, so a year of caching is safe. |
| `/index.html` | static, `no-store` | The HTML shell references the hashed bundles; caching it would pin users to an old release. |
| `/auth/…`, `/users/…`, `/projects/…`, `/tasks/…`, `/groups/…`, `/social-links/…` | proxied to `127.0.0.1:3000` | The NestJS controllers use exactly these top-level paths and there is no global `/api` prefix. |
| `/docs` | proxied to `127.0.0.1:3000` | Swagger UI. **Unprotected by the API** — see below. |

Two details worth understanding, because they are the usual cause of "the API 404s on production
but works locally":

- Nginx picks the **longest matching prefix** location. `/users/me` matches `location /users/`
  and is proxied; `/dashboard/users` does not, and falls through to the SPA. That is why the
  list of API paths must stay in sync with the backend controllers.
- A bare `/users` (no trailing slash) does **not** match `location /users/`, so the file includes
  separate `location = /users` exact matches. If you add a new controller, add both forms.

> **Namespace note.** Because the API lives at the root of the same domain, these paths belong to
> the API and cannot also be React Router pages: `/auth`, `/users`, `/projects`, `/tasks`,
> `/groups`, `/social-links`, `/docs`. Current routes such as `/dashboard`, `/dashboard/users`,
> `/about`, and `/gallery` are unaffected. If you later want a page called `/projects`, either
> move the backend to a global `/api` prefix (`app.setGlobalPrefix('api')` in
> `backend/src/main.ts`, plus `VITE_API_BASE_URL` left empty and a single `location /api/` proxy)
> or give the page a different path.

### 9.3 Protect the Swagger page

The optional basic-auth middleware in `backend/src/main.ts` is commented out, so `/docs` is
currently open to anyone who finds it, and it enumerates your entire API surface. Turn on the
protected block:

```bash
sudo htpasswd -c /etc/nginx/.htpasswd-crewdesk-docs docsadmin   # choose a password
sudo chmod 640 /etc/nginx/.htpasswd-crewdesk-docs
sudo chown root:www-data /etc/nginx/.htpasswd-crewdesk-docs
```

Then in `/etc/nginx/sites-available/crewdesk` comment out the open `location /docs { … }` line
and uncomment the four-line protected block above it, and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

If you do not want the docs in production at all, replace the whole `/docs` block with:

```nginx
location /docs { return 404; }
```

---

## 10. Point the domain at the server (DNS)

At your DNS provider, create:

| Type | Name | Value | TTL |
| --- | --- | --- | --- |
| `A` | `crewdesk` (or `@` for the apex) | your server's public IPv4 | 300 |
| `AAAA` | `crewdesk` | your server's public IPv6, **only if** the server really serves v6 | 300 |
| `CNAME` | `www` | `crewdesk.example.com` | 300 |

Get the server's public IP with `curl -4 ifconfig.me`.

Verify propagation **before** requesting a certificate — Let's Encrypt validates over HTTP:

```bash
dig +short crewdesk.example.com
curl -I http://crewdesk.example.com      # should reach nginx (200 or 301)
```

If `dig` returns the wrong address, or `curl` cannot connect, stop here and fix DNS. A
certificate request against unfinished DNS fails repeatedly and can hit rate limits.

> **A records and proxies.** If your DNS provider offers an HTTP proxy/CDN feature (Cloudflare's
> orange cloud, for example), set the record to **DNS only / grey cloud** until the certificate
> is issued, then re-enable it if you want. A proxying layer can block the ACME HTTP challenge.

---

## 11. Enable HTTPS

`certbot` obtains a free certificate from Let's Encrypt and rewrites the nginx config to add the
HTTPS server block, the certificate paths, and an HTTP→HTTPS redirect.

```bash
sudo apt -y install certbot python3-certbot-nginx

sudo certbot --nginx \
  -d crewdesk.example.com \
  -d www.crewdesk.example.com \
  --redirect \
  --agree-tos \
  --no-eff-email \
  -m you@example.com
```

Drop the second `-d` if you do not use `www`.

After it finishes:

```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://crewdesk.example.com          # expect HTTP/2 200 and a valid cert
```

Confirm the automatic renewal timer exists — certificates last 90 days and renewal is the part
people forget:

```bash
systemctl list-timers | grep -i certbot
sudo certbot renew --dry-run
```

The dry run must succeed. Once it does, renewal is unattended; `certbot` reloads nginx itself
after a successful renewal.

### 11.1 If Let's Encrypt is unreachable

Some networks (including many Iranian hosting providers and networks subject to filtering) cannot
complete an ACME HTTP challenge to `acme-v02.api.letsencrypt.org`. You have three options:

**a) DNS-01 challenge** — works when the API endpoint is reachable but inbound port 80 is not, and
also issues wildcard certificates:

```bash
sudo apt -y install python3-certbot-dns-cloudflare    # or the plugin for your DNS provider
# Create an API token at your DNS provider, store it, then:
sudo certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /root/.secrets/cloudflare.ini \
  -d crewdesk.example.com -d '*.crewdesk.example.com'
```

**b) Free certificates from ZeroSSL or Buypass** via `acme.sh`, which supports the same
challenge types and a different ACME endpoint:

```bash
curl https://get.acme.sh | sh -s email=you@example.com
~/.acme.sh/acme.sh --set-default-ca --server letsencrypt   # or zerossl / buypass
~/.acme.sh/acme.sh --issue -d crewdesk.example.com --nginx
```

**c) A paid certificate** from any commercial CA. Install the full chain and key, then point
nginx at them inside the HTTPS server block that `certbot` would otherwise create:

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name crewdesk.example.com;

    ssl_certificate     /etc/ssl/crewdesk/fullchain.pem;
    ssl_certificate_key /etc/ssl/crewdesk/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    # ... the same root/location/proxy blocks as the HTTP server ...
}

server {
    listen 80;
    listen [::]:80;
    server_name crewdesk.example.com;
    return 301 https://$host$request_uri;
}
```

Whatever route you take, verify the chain from outside:

```bash
curl -vI https://crewdesk.example.com 2>&1 | grep -Ei 'SSL|subject|issuer|HTTP/'
```

### 11.2 Recommended TLS additions

Add these inside the HTTPS `server` block (certbot writes a reasonable baseline, but HSTS in
particular is worth setting deliberately):

```nginx
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Enable HSTS ONLY after HTTPS is confirmed working, and only if every
    # subdomain of this domain will always be HTTPS. It is hard to undo:
    # browsers will refuse plain HTTP for max-age seconds.
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

---

## 12. Firewall

Expose SSH, HTTP, and HTTPS. **Do not** open 3000 or 5432.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'      # ports 80 and 443
sudo ufw enable
sudo ufw status verbose
```

Keep SSH open before enabling, or you will lock yourself out. Confirm the API is not publicly
reachable:

```bash
curl -m 5 http://crewdesk.example.com:3000/social-links    # must time out or be refused
```

By default PostgreSQL listens on localhost only, which is what we want. Verify with
`sudo ss -ltnp | grep -E '3000|5432|443'` — 443 should show nginx on `0.0.0.0`, while 3000 and
5432 should show `127.0.0.1`.

---

## 13. Verify the deployment

Run these in order; the first failure tells you which layer to fix.

```bash
# 1. Services are up
systemctl is-active crewdesk-api nginx postgresql

# 2. API answers locally
curl -sS -o /dev/null -w 'local api: %{http_code}\n' http://127.0.0.1:3000/social-links

# 3. Non-secret API through the public HTTPS URL
curl -sS https://crewdesk.example.com/social-links

# 4. The SPA shell is served, and is not cached
curl -sSI https://crewdesk.example.com/ | head -20

# 5. A deep link renders the app instead of 404 (proves the SPA fallback)
curl -sS -o /dev/null -w 'deep link: %{http_code}\n' https://crewdesk.example.com/dashboard/users

# 6. HTTP redirects to HTTPS
curl -sSI http://crewdesk.example.com/ | head -3

# 7. A login attempt reaches the API and returns a token
curl -sS -X POST https://crewdesk.example.com/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"YOUR_ADMIN_PASSWORD"}'

# 8. Crawler files are served as files, not swallowed by the SPA fallback
curl -sS https://crewdesk.example.com/robots.txt
curl -sS https://crewdesk.example.com/sitemap.xml | head -5

# 9. A public page is prerendered: real content is present without JavaScript
curl -sS https://crewdesk.example.com/about | grep -o '<title>[^<]*</title>'
curl -sS https://crewdesk.example.com/about | grep -c 'داستان ما'   # expect 1

# 10. Canonical and Open Graph point at the real domain, over HTTPS
curl -sS https://crewdesk.example.com/ | grep -o '<link rel="canonical"[^>]*>'
curl -sS https://crewdesk.example.com/ | grep -o '<meta property="og:url"[^>]*>'

# 11. The social preview image resolves (a 404 here breaks link previews)
curl -sS -o /dev/null -w 'og-image: %{http_code} %{content_type}\n' \
  https://crewdesk.example.com/og-image.png

# 12. Icons resolve, with the right types (a 404 here shows a blank tab icon)
curl -sS -o /dev/null -w 'favicon.svg:    %{http_code} %{content_type}\n' \
  https://crewdesk.example.com/favicon.svg
curl -sS -o /dev/null -w 'favicon.ico:    %{http_code} %{content_type}\n' \
  https://crewdesk.example.com/favicon.ico
curl -sS -o /dev/null -w 'apple-touch:    %{http_code} %{content_type}\n' \
  https://crewdesk.example.com/apple-touch-icon.png
curl -sS -o /dev/null -w 'webmanifest:    %{http_code} %{content_type}\n' \
  https://crewdesk.example.com/site.webmanifest

# 13. The manifest is valid JSON, not the SPA fallback HTML
curl -sS https://crewdesk.example.com/site.webmanifest | head -5

# 14. The self-hosted font is served with the right type, not as HTML.
#     A 200 with content_type text/html here means the fallback swallowed it and the
#     Persian UI is silently using system fonts.
curl -sS -o /dev/null -w 'font: %{http_code} %{content_type} %{size_download} bytes\n' \
  https://crewdesk.example.com/fonts/Vazirmatn-variable.woff2
```

Step 7 returning `{"access_token":"…","role":"ADMIN"}` means the whole chain works: TLS → nginx →
NestJS → PostgreSQL.

Then in a real browser at `https://crewdesk.example.com`:

1. Open DevTools → **Console**: no red CORS or 404 errors.
2. DevTools → **Network**: the login request goes to `https://crewdesk.example.com/auth/login`
   (same origin), not to `localhost:3000`.
3. Log in, visit a protected page such as `/dashboard/users`, then **refresh** it — it must not 404.
4. DevTools → **Application → Local Storage**: the `auth-storage` key holds the JWT. This is
   expected (the app uses bearer tokens, not cookies).
5. Check the padlock: valid certificate, no mixed-content warnings.

### 13.1 Search-engine setup

Prerendering and the generated files are what make the site indexable; these steps are what tell
search engines the site exists. Do them once, after the first successful deployment.

1. **Verify ownership in [Google Search Console](https://search.google.com/search-console)** by
   adding your domain as a property. DNS TXT verification is the least invasive. For a `.ir`
   domain serving a Persian audience, also register with
   **[Bing Webmaster Tools](https://www.bing.com/webmasters)** — it powers several regional
   engines — and with any Iranian equivalents you rely on (for example
   [Yandex Webmaster](https://webmaster.yandex.com) or a local webmaster service).
2. **Submit the sitemap**: `https://crewdesk.example.com/sitemap.xml`.
3. **Inspect a live URL** in Search Console for `/` and `/about`. Use "Test live URL" and confirm
   the rendered HTML shows your content and the canonical URL matches your domain. If it shows the
   raw empty shell, prerendering did not run for that page.
4. **Request indexing** for the seven public pages once, rather than repeatedly.
5. **Check the Page indexing report** after a week. "Discovered – currently not indexed" is normal
   early on; "Alternate page with proper canonical tag" or "Duplicate" usually means two URLs
   serve the same page. Canonical tags should prevent this, but confirm.
6. **Check Core Web Vitals** in the Search Console report after a few weeks of real traffic.
7. **Add the site to your social profiles** so the `og-image.png` card is exercised: paste a link
   into a Telegram or WhatsApp message to yourself and confirm the preview renders with the title,
   description and image. If the image is missing, `og:image` is wrong or the file is not being
   served — recheck checks 10 and 11 above.

---

## 14. Day-two operations

### 14.1 Deploying an update

```bash
# --- On your workstation, rebuild ---
cd backend  && npm ci && npm run build && cd ..
cd frontend && npm ci && npm run build:prod && npm run seo:verify && cd ..
# Re-assemble release/ as in step 6.5, then upload as in step 7.2.
# `rm -rf release` first: a stale release/ would upload the previous build.

# --- On the server ---
sudo rsync -a --delete /tmp/crewdesk-backend/  /opt/crewdesk/backend/
sudo chown -R crewdesk:crewdesk /opt/crewdesk/backend
cd /opt/crewdesk/backend && sudo -u crewdesk npm ci --omit=dev

sudo rsync -a --delete /tmp/crewdesk-frontend/ /var/www/crewdesk/
sudo chown -R www-data:www-data /var/www/crewdesk

sudo systemctl restart crewdesk-api
sudo systemctl reload nginx
```

`rsync --delete` on the frontend matters: it removes prerendered directories for routes that no
longer exist. Without it a removed page keeps being served from `/var/www/crewdesk`.

Upload a fresh `package-lock.json` with the backend every time, or `npm ci` will fail.

Take a database backup **before** an update that changes entities, because `synchronize: true`
applies schema changes automatically at startup.

### 14.2 Backups

`pg_dump` to a timestamped file, keep 14 days, and copy backups off the server:

```bash
sudo mkdir -p /var/backups/crewdesk
sudo tee /usr/local/bin/crewdesk-backup >/dev/null <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
STAMP=$(date +%F_%H%M)
OUT=/var/backups/crewdesk/crewdesk_${STAMP}.sql.gz
sudo -u postgres pg_dump --clean --if-exists crewdesk | gzip > "$OUT"
find /var/backups/crewdesk -name 'crewdesk_*.sql.gz' -mtime +14 -delete
echo "backup written: $OUT"
EOF
sudo chmod 755 /usr/local/bin/crewdesk-backup

# Nightly at 02:30
echo '30 2 * * * root /usr/local/bin/crewdesk-backup' | sudo tee /etc/cron.d/crewdesk-backup
sudo chmod 644 /etc/cron.d/crewdesk-backup

# Prove it works, and prove you can restore:
sudo /usr/local/bin/crewdesk-backup
ls -lh /var/backups/crewdesk/
```

Restore drill (do this once, on a scratch database, so you know the procedure):

```bash
gunzip -c /var/backups/crewdesk/crewdesk_YYYY-MM-DD_HHMM.sql.gz \
  | sudo -u postgres psql -d crewdesk_restore_test
```

Also back up `/opt/crewdesk/backend/.env` (to a password manager, not to Git) and your nginx and
systemd unit files.

### 14.3 Logs

```bash
sudo journalctl -u crewdesk-api -f              # API, live
sudo journalctl -u crewdesk-api --since '1 hour ago' -p warning
sudo tail -f /var/log/nginx/crewdesk.access.log
sudo tail -f /var/log/nginx/crewdesk.error.log
```

Keep the journal from growing without bound:

```bash
sudo sed -i 's/^#\?SystemMaxUse=.*/SystemMaxUse=500M/' /etc/systemd/journald.conf
sudo systemctl restart systemd-journald
```

### 14.4 Routine maintenance

```bash
# OS and Node security updates — expect an API restart at most
sudo apt update && sudo apt -y upgrade

# Certificate expiry (certbot renews automatically; this is a check, not an action)
sudo certbot certificates
```

Reboot safety: `crewdesk-api`, `nginx`, and `postgresql` are all enabled, so the stack comes back
by itself. Verify once with `sudo reboot`, then re-run step 13.

---

## 15. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Browser: *blocked by CORS policy* | `FRONTEND_URL` does not match the browser's exact origin (scheme, host, port) or has a trailing slash | Set `FRONTEND_URL=https://crewdesk.example.com`, then `sudo systemctl restart crewdesk-api` |
| Browser: requests go to `http://localhost:3000` | The bundle was built without `VITE_API_BASE_URL` set for production, or with the dev value | Fix `frontend/.env.production`, **rebuild**, re-upload `dist` (this is a build-time value) |
| Page loads, but every API call 404s | A controller path is missing from the nginx proxy list | Add a `location /newpath/` prefix **and** `location = /newpath` exact match, then `sudo nginx -t && sudo systemctl reload nginx` |
| `https://…/dashboard` → 404 on refresh | SPA fallback missing or `index.html` missing from the web root | Confirm `try_files $uri $uri/index.html $uri/ /index.html;` and `ls /var/www/crewdesk/index.html` |
| Users see an old version after a deploy | The HTML shell was cached | The config sets `no-store` on `/index.html` and on prerendered pages; check a hard refresh and that `/assets/` filenames changed |
| Canonical URLs show `localhost` or `example.com` | The build ran without `frontend/.env.production`, so a development `.env` supplied `VITE_SITE_URL` | Create `.env.production` with the real origin and rebuild with `npm run build:prod` — it now fails instead of shipping this |
| A page shows the previous page's title | The route has no entry in `src/seo/routes.ts` | Add it; `npm run seo:check` (part of the build) flags this |
| `/about` shows the login page's content | The route is behind `ProtectedRoute` and was prerendered anonymously | Mark it `prerender: false` in `scripts/seo-routes.mjs` |
| `robots.txt` or `sitemap.xml` returns the app HTML | They were not generated, so the SPA fallback served `index.html` | Rebuild; the files are produced by the SEO pipeline. Check `ls /var/www/crewdesk/robots.txt` |
| Search Console: "Crawled – currently not indexed" | Normal for a new site; also happens when a page has little unique content | Request indexing, and make sure each page has a distinct title and description |
| Link previews show no image | `og:image` missing from the build output, or prerendering was skipped | `ls /var/www/crewdesk/og-image.png`; confirm the prerender step ran (it warns when `og:image` is absent) |
| Browser tab shows a blank or generic icon | The icon files were not uploaded | `ls /var/www/crewdesk/favicon.*`; then hard-refresh, because browsers cache favicons aggressively |
| `favicon.svg` renders as a plain teal square | The SVG glyph path is malformed — this fails silently, leaving only the background tile | `npm run icons:generate` then `npm run icons:verify`, which fails when the glyph is missing |
| Persian text renders in Tahoma / a system font | `/fonts/Vazirmatn-variable.woff2` is not being served as a font — usually a missing `location /fonts/` block, so the SPA fallback returned `index.html` | Run check 14 above; `content_type` must be `font/woff2` |
| Pages are not prerendered (crawlers see an empty shell) | No Chrome/Chromium/Edge on the build machine, so the step was skipped | Install a browser or set `CHROME_PATH`, then rebuild; the skip is warned about, not silent |
| API returns 502 from nginx | The Node process is down or not listening on 3000 | `systemctl status crewdesk-api` and `journalctl -u crewdesk-api -n 80` |
| API returns 500 on every endpoint | Database connection or credentials | Check the journal for a `pg` error; re-test with the step 3 `psql` command |
| `npm run build` killed, "Killed"/OOM | Not enough RAM during the Vite/TypeScript build | Add swap (step 2) or build on your workstation and upload |
| `EACCES` reading `.env` | Wrong owner/permissions | `sudo chown crewdesk:crewdesk .env && sudo chmod 600 .env` |
| API restart loops with `EADDRINUSE` | Something else already holds port 3000 | `sudo ss -ltnp \| grep 3000`, stop the old process |
| `certbot` fails: connection/timeout | DNS not propagated, port 80 blocked, or ACME endpoint unreachable | Verify with `dig` and `curl -I http://…`; otherwise use the DNS-01 or `acme.sh` route in step 11.1 |
| `nginx -t` fails after certbot | Conflicting `server_name` or duplicate `listen` | `sudo nginx -T \| grep -n server_name` to find the overlap, remove Ubuntu's `sites-enabled/default` |
| Persian text renders in a fallback font | The UI asks for `Vazirmatn` but nothing in the repo loads it | See the hardening checklist — self-host the font, do not depend on a CDN |

Diagnostic one-liners:

```bash
sudo ss -ltnp | grep -E '3000|5432|80|443'          # who is listening
sudo nginx -T | head -60                             # the merged config nginx actually uses
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://crewdesk.example.com/
sudo journalctl -u crewdesk-api -b -p err            # API errors since boot
```

---

## 16. Security hardening checklist

Do these before you invite real users.

- [ ] **Set `SEED_ADMIN=false`** after the first successful login, and remove `ADMIN_PASSWORD`
      from `.env`. Leaving it `true` keeps a known password in a file forever.
- [ ] **Strong, unique `JWT_SECRET`** (48+ random bytes) and `chmod 600` on `.env`.
- [ ] **`FRONTEND_URL` exact** — do not use `*` or a partial host.
- [ ] **Protect or remove `/docs`.** The basic-auth middleware in `backend/src/main.ts` is
      commented out; enable the nginx block from step 9.3.
- [ ] **`synchronize: true` is a development setting.** It can alter or drop columns on startup
      with no review and no rollback. Before the first schema change on live data: take a backup,
      and consider switching to TypeORM migrations with `synchronize: false` in production.
- [ ] **Non-default admin credentials.** Change the password through the app, not by editing `.env`.
- [ ] **JWT lifetime is 1 day** (`backend/src/auth/auth.module.ts`) and tokens are stored in
      browser `localStorage`. There is no refresh-token or revocation flow, so a stolen token is
      valid until it expires. Keep that in mind for shared computers; shorten `expiresIn` if the
      risk profile demands it.
- [ ] **Do not enable permissive CORS** to make an error go away. Fix `FRONTEND_URL`.
- [ ] **Rate-limit the login endpoint.** Five lines in nginx blunt credential stuffing:

      ```nginx
      limit_req_zone $binary_remote_addr zone=crewdesk_login:10m rate=10r/m;

      location = /auth/login {
          limit_req zone=crewdesk_login burst=5 nodelay;
          proxy_pass http://crewdesk_api;
      }
      ```

      (Declare `limit_req_zone` once in the `http` block, i.e. in `/etc/nginx/nginx.conf`.)
- [ ] **Self-host the Vazirmatn font.** `frontend/src/index.css` names `"Vazirmatn"` as the primary
      font but nothing loads it, so the RTL Persian UI falls back to system fonts. Ship the
      `.woff2` files in `frontend/public/fonts/` and add `@font-face` rules with `font-display: swap`
      — a local asset, not a third-party CDN that may be slow or blocked.
- [ ] **Automated backups verified with a restore drill** (step 14.2).
- [ ] **Unattended security updates** for the OS: `sudo apt -y install unattended-upgrades`.
- [ ] **Consider `fail2ban`** for SSH and nginx 401/403 bursts.
- [ ] **Rotate secrets if a release leaks them** — check that `.env` never entered the repository
      history (`git log --all -- backend/.env frontend/.env`).

---

## Appendix A: Deploying frontend and API on separate domains

Only do this if you actually need it (for example, a separate team owns the API hostname). It
costs you an extra certificate, an explicit CORS configuration, and a preflight request on every
API call.

1. **DNS:** add `api.crewdesk.example.com` → the server IP (step 10).
2. **nginx:** add a second server block whose `server_name` is `api.crewdesk.example.com`, and in
   it proxy **every** path to the API:

   ```nginx
   server {
       listen 80;
       listen [::]:80;
       server_name api.crewdesk.example.com;

       location / {
           proxy_pass http://crewdesk_api;
           proxy_http_version 1.1;
           proxy_set_header Host              $host;
           proxy_set_header X-Real-IP         $remote_addr;
           proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_set_header Connection        "";
       }
   }
   ```

3. **Certificate** for the new hostname:

   ```bash
   sudo certbot --nginx -d api.crewdesk.example.com --redirect
   ```

4. **Backend `.env`:**

   ```ini
   FRONTEND_URL=https://crewdesk.example.com,https://www.crewdesk.example.com
   ```

   `FRONTEND_URL` is passed straight to `app.enableCors({ origin })`. Express's CORS middleware
   accepts a single string; if your installed version does not split the comma-separated list,
   set exactly one origin — the one users actually browse.

5. **Frontend `.env.production`, then rebuild:**

   ```ini
   VITE_API_BASE_URL=https://api.crewdesk.example.com
   ```

   This is baked into the bundle at build time, so the rebuild and re-upload are mandatory.

6. **Remove the API `location` blocks from the main site**, and keep only the SPA + `/assets/` +
   `/index.html` rules there.

7. **Verify preflight** works, since browsers now send `OPTIONS` before authenticated requests:

   ```bash
   curl -i -X OPTIONS https://api.crewdesk.example.com/auth/login \
     -H 'Origin: https://crewdesk.example.com' \
     -H 'Access-Control-Request-Method: POST' \
     -H 'Access-Control-Request-Headers: content-type'
   # Expect 204 with Access-Control-Allow-Origin: https://crewdesk.example.com
   ```

---

## Appendix B: systemd and nginx survival notes

- **`WorkingDirectory` matters.** The API loads `.env` from its working directory through
  `ConfigModule.forRoot()`. If you change that path in the unit file, the app starts with built-in
  defaults — including `JWT_SECRET=super-secret-key` and a localhost database — instead of failing
  loudly. Keep it at `/opt/crewdesk/backend`.
- **`npm run start:prod` is just `node dist/main`.** The unit calls `node` directly to avoid an
  extra process in the tree; systemd then owns the Node process itself and restarts it cleanly.
- **Do not use `nodemon`/`nest start --watch` in production.** `start:dev` is for development;
  `Restart=always` on the unit provides the resilience instead.
- **`Requires=postgresql.service`** makes systemd start the database first and, if you stop
  PostgreSQL, stop the API too. That is intentional: a restart after a database restart is more
  predictable than a process stuck on a dead connection pool.
- **Apply config changes:** `sudo nginx -t && sudo systemctl reload nginx` for nginx,
  `sudo systemctl daemon-reload && sudo systemctl restart crewdesk-api` after editing the unit.
- **Hardening flags** (`ProtectSystem=full`, `ProtectHome=true`, `PrivateTmp=true`) are safe for
  this application today because it reads nothing outside `/opt/crewdesk/backend`. If you later add
  file uploads, add a `ReadWritePaths=/opt/crewdesk/backend/uploads` line and switch
  `ProtectSystem=strict`, or the writes will fail with `EROFS`.
