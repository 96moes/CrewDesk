# CrewDesk Backend

The backend is the NestJS API for CrewDesk. It provides JWT authentication and role-based access to users, projects, tasks, groups, and the administrator's per-recipient bulk-message queue.

For full-stack setup, configuration, and database guidance, see the [root README](../README.md).

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by the frontend's Vite 8 dependency); Node.js 24 LTS and npm 11 were used to verify this project.
- A PostgreSQL server reachable by the API. The application uses TypeORM and the `pg` driver without configuring a server-version constraint.

## Setup

From this directory:

```bash
cp .env.example .env
npm ci
```

Configure the database connection and replace the development JWT/admin credentials in `.env` before starting the API. PowerShell equivalent for copying the template: `Copy-Item .env.example .env`.

## Environment

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | API port | `3000` |
| `FRONTEND_URL` | CORS frontend origin | `http://localhost:5173` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_USERNAME` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password` |
| `DB_DATABASE` | PostgreSQL database | `your_database_name` |
| `JWT_SECRET` | JWT signing secret | `super-secret-key` |
| `SEED_ADMIN` | Seed admin at startup when `true` | `true` |
| `ADMIN_USERNAME` | Seeded admin username | `admin` |
| `ADMIN_PASSWORD` | Seeded admin password | `admin` |
| `ADMIN_ROLE` | Seeded admin role | `ADMIN` |

The seeded admin is created only when the username is not already present. The role values are `ADMIN`, `REGISTRAR`, and `REPORT_VIEWER`. Always set strong non-default credentials and a unique JWT secret outside local development.

`SWAGGER_USER` and `SWAGGER_PASSWORD` are not currently active: Swagger's optional Basic Auth middleware is commented out. Swagger UI is available at `/docs`.

## Development and production

```bash
npm run start:dev
```

The API defaults to `http://localhost:3000`. Build and start the compiled application with:

```bash
npm run build
npm run start:prod
```

`npm run start` runs Nest without watch mode. `npm run start:debug` runs watch mode with the debugger.

## Database

Create a PostgreSQL database, then set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` in `.env`. TypeORM currently has `synchronize: true`; entity tables are synchronized when the app starts. No migrations or migration commands are currently defined. Treat synchronization as a development convenience, not a production migration strategy.

## Scripts

| Script | Command |
| --- | --- |
| `npm run build` | `nest build` |
| `npm run deploy` | `nest deploy` |
| `npm run format` | Prettier on `src/**/*.ts` and `test/**/*.ts` |
| `npm run start` | `nest start` |
| `npm run start:dev` | `nest start --watch` |
| `npm run start:debug` | `nest start --debug --watch` |
| `npm run start:prod` | `node dist/main` |
| `npm run lint` | `oxlint src/ test/` |
| `npm test` | `vitest run` |
| `npm run test:watch` | `vitest` |
| `npm run test:cov` | `vitest run --coverage` |
| `npm run test:debug` | `vitest --inspect-brk --no-file-parallelism` |
| `npm run test:e2e` | `vitest run --config ./vitest.config.e2e.ts` |

The backend declares NestJS `^12`, TypeORM `^1.1.1`, `pg` `^8.23.0`, and TypeScript `^6.0.2`; refer to `package.json` and `package-lock.json` for the complete dependency versions.

## Tests

Run `npm test` for unit specs and `npm run test:e2e` for end-to-end tests. The unit Vitest config selects `*.spec.ts` files; none are currently included. The e2e suite imports the full application module and therefore needs PostgreSQL configured and available. The repository currently includes `test/app.e2e-spec.ts`.

## License

This package is marked `UNLICENSED`. No license for use or redistribution is granted by this repository.
