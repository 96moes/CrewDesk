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
| `ADMIN_ROLE` | Role for the seeded account: `ADMIN`, `MANAGER` or `USER` | `ADMIN` |

The seeded account is created only when the username is not already present. The API has three
roles, and the difference between them is written down once, in `src/auth/role-sets.ts`:

| Role | May do | Guarded by |
| --- | --- | --- |
| `USER` | Everything a signed-in account may do: own dashboard, own projects and tasks, the groups it manages | no `@Roles` restriction |
| `MANAGER` | All of the above, plus projects, tasks, media, social links, the bulk-message queue and the user directory behind the pickers | `@Roles(...MANAGEMENT_ROLES)` |
| `ADMIN` | All of the above, plus user accounts: list, read, create, update and delete | `@Roles(UserRole.ADMIN)` |

`USER` is the default for anything created through the API. User accounts are the whole of the
difference between `MANAGER` and `ADMIN`: every account route in `src/users/users.controller.ts`
stays administrator-only, and the only user listing a manager may read is `GET /users/directory`,
which carries nothing but an id and a username. Always set strong non-default credentials and a
unique JWT secret outside local development. Because only an administrator can manage accounts,
keep `ADMIN_ROLE=ADMIN` for the seeded account.

`SWAGGER_USER` and `SWAGGER_PASSWORD` are not currently active: Swagger's optional Basic Auth middleware is commented out. Swagger UI is available at `/docs`.

## Gallery (`/media`)

The public gallery page is fed by this module; it previously rendered hardcoded placeholders.

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/media` | public | Published items only, ordered by `sortOrder` then newest |
| `GET` | `/media/admin/all` | `ADMIN`, `MANAGER` | Every item, including unpublished drafts |
| `GET` | `/media/:id` | `ADMIN`, `MANAGER` | A single item |
| `POST` | `/media` | `ADMIN`, `MANAGER` | Create |
| `PATCH` | `/media/:id` | `ADMIN`, `MANAGER` | Update |
| `DELETE` | `/media/:id` | `ADMIN`, `MANAGER` | Delete |

An item is a `photo` or a `video`. Media is referenced by URL rather than uploaded, because the
realistic sources are Aparat/YouTube links and images hosted elsewhere.

**Video URLs are normalised on save.** An admin pastes the page URL they copied from the address
bar, and the API derives a safe player URL into `embedUrl`:

| Pasted | Stored `embedUrl` |
| --- | --- |
| `https://www.aparat.com/v/abc123` | `https://www.aparat.com/video/video/embed/videohash/abc123/vt/frame` |
| `https://youtu.be/dQw4w9WgXcQ` | `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ` |
| `https://www.youtube.com/watch?v=…&t=42s` | `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ` |

A YouTube thumbnail is derived from the id; Aparat has no predictable pattern, so an admin can
supply `thumbnailUrl`. A video URL from any other host is **rejected with 400** rather than stored,
so the gallery cannot end up showing a dead player. Normalising on the server also means raw
`<iframe>` markup is never accepted from a client.

`published: false` hides an item from `GET /media` — the filter is applied in SQL, so a draft cannot
leak to an anonymous visitor. `linkUrl`, when set, makes the gallery render the item as a link
instead of an inline figure or player.

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

Create a PostgreSQL database, then set `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, and `DB_DATABASE` in `.env`. TypeORM currently has `synchronize: true`; entity tables are synchronized when the app starts. No migrations or migration commands are currently defined. Treat synchronization as a development convenience, not a production migration strategy. Schema changes that synchronize cannot make safely on its own — renaming a column, for instance — ship as one-off scripts in `../deploy/scripts/`; see step 14.1 of `../DEPLOYMENT.md`.

### Users and groups

A user has a role (`USER`, `MANAGER` or `ADMIN`), a profile, and nothing else: the self-referencing
`managerId`/"who this user reports to" field was removed. Where a user sits in the organisation is
expressed through groups instead:

| Fact | Where it lives |
| --- | --- |
| Which groups a user belongs to | `group_members` rows. `UsersService` reduces them to `groupIds: string[]` on every user payload — the ids are derived, never stored on the user, so membership cannot disagree with itself. |
| Who manages a group | `groups."managerId"`, the single user who may change that group's members or submit a message for it. |
| Who manages a project | `projects."managerId"`, unrelated to group management. |

Membership is written only through the group endpoints (`POST`/`DELETE /groups/:id/members`), which
is why `groupIds` is read-only in the user DTOs. Adding a member to a group changes the group and
that user's `groupIds` in the same request.

#### Adding a member by name or by phone

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/groups/:id/member-candidates?q=` | the group's manager | Accounts matching `q`, by username, full name or phone number |
| `POST` | `/groups/:id/members` | the group's manager | Add one: `{ "userId": "…" }`, or `{ "phone": "…" }` |

Only the user in `groups."managerId"` may call either route — a group manager is whoever created
the group, whatever their role, so the `MANAGER` role has no special access here.

A name is not unique, so `POST` does not take one: the manager searches, the search returns the
accounts that match, and the add request carries the `userId` they picked. The `phone` form of the
add request is kept for clients that already send one, and is matched exactly.

`searchMemberCandidates` (`src/groups/groups.service.ts`) is deliberately narrow, because it is the
one place a group manager can look accounts up by something other than a phone number they already
know:

- it answers only for a group the caller manages, and only from `MIN_MEMBER_SEARCH_LENGTH` (three)
  characters upwards, so it cannot be walked through the alphabet;
- it returns at most `MEMBER_SEARCH_LIMIT` (ten) accounts, each as an id, username, full name and
  the **last four digits** of the registered phone number — enough to recognise the person the
  manager had in mind, not enough to collect numbers they never had;
- a `%` or `_` in the query is escaped, so it matches literally instead of matching everything;
- accounts already in the group are returned with `alreadyMember: true` rather than hidden, so a
  manager who searches for someone they already added sees why the result looks as it does.

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

Run `npm test` for unit specs and `npm run test:e2e` for end-to-end tests. The unit Vitest config selects `*.spec.ts` files; `src/media/utils/video-url.spec.ts` covers the video URL parser. The e2e suite imports the full application module and therefore needs PostgreSQL configured and available. The repository currently includes `test/app.e2e-spec.ts`.

## License

This package is marked `UNLICENSED`. No license for use or redistribution is granted by this repository.
