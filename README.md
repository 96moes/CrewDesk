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
- [Database setup](#database-setup)
- [Tests and quality checks](#tests-and-quality-checks)
- [Contributing](#contributing)
- [License](#license)

## Technology

- **Backend:** NestJS 12, TypeScript 6, TypeORM, Passport/JWT
- **Frontend:** React 19, React Router 8, Vite 8, Tailwind CSS 4, Ant Design 6
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
│   ├── public/
│   ├── src/
│   │   ├── api/             API clients
│   │   ├── components/      Shared UI
│   │   ├── pages/           Public, user, and admin pages
│   │   └── index.css        Global styles and color tokens
│   └── README.md
└── .gitignore
```

There is no root npm workspace or root-level package script; install and run each application from its own directory.

## Prerequisites

- Node.js 24 LTS (the project was checked with Node 24); npm 11 is recommended.
- PostgreSQL 16 or later, running locally or reachable by the API.

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
| `VITE_API_BASE_URL` | Base URL of the backend API, for example `http://localhost:3000` |
| `VITE_ADMIN_PHONE` | Optional contact phone shown on the registration page |
| `VITE_TELEGRAM_ADMIN` | Optional Telegram username shown on the registration page |

Vite exposes `VITE_*` variables to client-side code; do not put secrets in the frontend environment file.

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
npm run build
```

The backend production entrypoint is `npm run start:prod` (after building). The frontend production assets are written to `frontend/dist`; the frontend package provides `npm run preview` for locally previewing a build. Deploy and serve the two builds with an appropriate production host/reverse proxy and configure environment variables for that environment.

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
