# CrewDesk

CrewDesk is a web application for managing projects, tasks, users, groups, and group message delivery. Group leaders can maintain member lists and submit a message for each member; administrators use a copy-and-paste queue to track delivery.

## Contents

- [Technology](#technology)
- [Repository layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Production builds](#production-builds)
- [Deployment](#deployment)
- [Search engine optimization](#search-engine-optimization)
- [Database setup](#database-setup)
- [Tests and quality checks](#tests-and-quality-checks)
- [Contributing](#contributing)
- [License](#license)

## Technology

- **Backend:** NestJS 12, TypeScript 6, TypeORM, Passport/JWT
- **Frontend:** React 19, React Router 8, Vite 8, Tailwind CSS 4, Ant Design 6
- **Frontend build:** a Node SEO pipeline that renders public routes to static HTML at build time
- **Frontend assets:** generated icons and a social preview image, produced by scripts in `frontend/scripts/` and `deploy/scripts/`
- **Database:** PostgreSQL, accessed through `pg`
- **Package manager:** npm with a separate lockfile in each application

The dependency versions in `backend/package.json` and `frontend/package.json` are authoritative. The lockfiles pin the resolved dependency graph.

## Repository layout

```text
CrewDesk/
├── backend/                 NestJS API, TypeORM entities, and API tests
│   ├── src/
│   │   ├── auth/            JWT authentication and role guards
│   │   ├── groups/          Groups and per-recipient bulk messages
│   │   ├── projects/
│   │   ├── social-links/
│   │   ├── tasks/
│   │   └── users/
│   ├── test/                End-to-end tests
│   └── README.md
├── frontend/                React/Vite client
│   ├── public/              Favicons, social preview image, web app manifest
│   ├── scripts/             Build steps: SEO check/generate/prerender/verify, icon generator
│   ├── src/
│   │   ├── api/             API clients
│   │   ├── components/      Shared UI
│   │   ├── pages/           Public, user, and admin pages
│   │   ├── seo/             Per-route titles, descriptions, and canonical URLs
│   │   └── index.css        Global styles and color tokens
│   └── README.md
├── deploy/                  Deployment assets
│   ├── scripts/             create-og-image.py
│   └── templates/           .env examples, systemd unit, nginx site
├── DEPLOYMENT.md            Step-by-step production deployment guide
└── .gitignore
```

There is no root npm workspace or root-level package script; install and run each application from its own directory.

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8); Node.js 24 LTS and npm 11 were used to verify this project.
- A PostgreSQL server reachable by the API. The application uses TypeORM with the `pg` driver and does not configure a PostgreSQL server version.

## Installation

Create the backend environment file from its template, configure the database and secrets as described below, and install each package:

```bash
cd backend
cp .env.example .env
npm ci
```

In a second terminal:

```bash
cd frontend
cp .env.example .env
npm ci
```

On Windows PowerShell, copy the example files with `Copy-Item .env.example .env`.

## Configuration

### Backend (`backend/.env`)

| Variable | Purpose | Default in application |
| --- | --- | --- |
| `PORT` | API listen port | `3000` |
| `FRONTEND_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL user | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password` |
| `DB_DATABASE` | Database name | `your_database_name` |
| `JWT_SECRET` | Secret used to sign and verify JWTs | `super-secret-key` |
| `SEED_ADMIN` | Seed an administrator during API startup when `true` | `true` |
| `ADMIN_USERNAME` | Seeded administrator username | `admin` |
| `ADMIN_PASSWORD` | Seeded administrator password | `admin` |
| `ADMIN_ROLE` | Seeded administrator role | `ADMIN` |

Set a unique, strong `JWT_SECRET` and a non-default admin password outside local development. The development seed is created only if that username is not already present. Roles supported by the API are `ADMIN`, `REGISTRAR`, and `REPORT_VIEWER`.

`SWAGGER_USER` and `SWAGGER_PASSWORD` are not active settings: the optional Swagger Basic Auth middleware is currently commented out. Swagger UI is available at `/docs` without that middleware.

### Frontend (`frontend/.env`)

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Base URL of the backend API, for example `http://localhost:3000`; empty means same-origin |
| `VITE_SITE_URL` | Public origin of the site; builds canonical URLs, `og:url`, `robots.txt` and `sitemap.xml`. Required for production builds |
| `VITE_OG_IMAGE` | Social preview image path, default `/og-image.png` |
| `VITE_ADMIN_PHONE` | Optional contact phone shown on the registration page |
| `VITE_TELEGRAM_ADMIN` | Optional Telegram username shown on the registration page |

Vite exposes `VITE_*` variables to client-side code; do not put secrets in the frontend environment file. `frontend/.env.production` provides the values for a production build and takes precedence over `.env`.

## Development

Start the API in one terminal:

```bash
cd backend
npm run start:dev
```

Start the web client in a second terminal:

```bash
cd frontend
npm run dev
```

The default local URLs are `http://localhost:3000` for the API and `http://localhost:5173` for Vite. The API documentation is at `http://localhost:3000/docs`.

## Production builds

Build each app using its package script:

```bash
cd backend
npm run build

cd ../frontend
npm run build:prod     # add the SEO pipeline; needs VITE_SITE_URL and a browser
```

`npm run build` in the frontend also produces the SEO output but tolerates a placeholder
`VITE_SITE_URL` and a missing prerender browser; `npm run build:prod` is the release build and
refuses to ship either problem. See [Search engine optimization](#search-engine-optimization).

The backend production entrypoint is `npm run start:prod` (after building). The frontend production assets are written to `frontend/dist`; the frontend package provides `npm run preview` for locally previewing a build. Deploy and serve the two builds with an appropriate production host/reverse proxy and configure environment variables for that environment.

## Deployment

For a complete, ordered production deployment on Ubuntu without Docker — PostgreSQL setup, systemd service, nginx reverse proxy, domain and DNS configuration, and HTTPS with Let's Encrypt — follow the [deployment guide](DEPLOYMENT.md).

The guide ships ready-to-use configuration templates in `deploy/templates/`:

| Template | Purpose |
| --- | --- |
| `backend.env.production.example` | Production values for `backend/.env` |
| `frontend.env.production.example` | Build-time values for `frontend/.env.production` |
| `crewdesk-api.service` | systemd unit for the API |
| `nginx-crewdesk.conf` | nginx site serving the SPA and proxying the API |

`deploy/scripts/create-og-image.py` regenerates the 1200×630 social preview image at `frontend/public/og-image.png`.

The recommended production topology is a single origin: nginx serves the built frontend, proxies the API paths (`/auth`, `/users`, `/projects`, `/tasks`, `/groups`, `/social-links`, `/docs`) to the API on `127.0.0.1:3000`, and terminates TLS. That keeps the browser same-origin and leaves one public entry point.

## Search engine optimization

The frontend is a client-side React application, so the build prerenders every public route to
static HTML, generates `robots.txt` and `sitemap.xml`, and applies unique per-route titles,
descriptions and canonical URLs. Production builds need `VITE_SITE_URL` set to the real public
origin, and a Chrome/Chromium/Edge installation to prerender with.

See [Search engine optimization](frontend/README.md#seo) in the frontend README for the full
description, the build scripts, and what to update when adding a page. Step 13.1 of the
[deployment guide](DEPLOYMENT.md#131-search-engine-setup) covers registering the site with search
engines after the first deployment.

## Database setup

1. Create a PostgreSQL database and a user with permission to connect and create/update the application schema.
2. Put the connection values in `backend/.env` (`DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE`).
3. Start the backend. TypeORM currently uses `synchronize: true` and creates/updates entity tables on startup; there are no TypeORM migration files or migration scripts in this repository.
4. The API seeds an admin account at startup by default. Configure `SEED_ADMIN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_ROLE` before first startup.

Schema synchronization is configured for development and is not a substitute for reviewed database migrations in production. Back up production data and arrange a migration-based schema process before deploying schema changes.

For a local PostgreSQL installation, create the database before starting the API, for example from `psql`:

```sql
CREATE DATABASE crewdesk;
```

## Tests and quality checks

Run the backend scripts from `backend/`:

```bash
npm test
npm run test:e2e
npm run test:cov
npm run lint
```

`npm test` runs Vitest unit specs selected by `vitest.config.ts`; no unit spec files are currently included. `npm run test:e2e` uses `vitest.config.e2e.ts` and needs a reachable PostgreSQL database because it loads the application module. The current repository includes an end-to-end test at `backend/test/app.e2e-spec.ts`. The backend also provides `npm run test:watch` and `npm run test:debug`.

Run the frontend checks from `frontend/`:

```bash
npm run build
npm run lint
```

The frontend package does not currently define a test script.

## Contributing

- Keep backend and frontend changes in their respective directories and follow the existing NestJS/React patterns.
- Update the relevant README when scripts, environment settings, or setup behavior changes.
- Do not commit `.env` files, secrets, build output, or database dumps.
- Run the relevant build, lint, and test scripts before submitting a change.

## License

No repository license file is provided. The backend package is marked `UNLICENSED`; usage and redistribution require permission from the project owner.

For application-specific details, see the [backend README](backend/README.md) and [frontend README](frontend/README.md).
