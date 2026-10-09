# CrewDesk Frontend

The frontend is the CrewDesk React application, built and served with Vite. It contains the public site, authenticated user dashboard and group tools, and administrator pages.

For full-stack setup and environment configuration, see the [root README](../README.md).

## Requirements

- Node.js `^20.19.0` or `>=22.12.0` (required by Vite 8); Node.js 24 LTS and npm 11 were used to verify this project.
- A running CrewDesk backend (default API URL: `http://localhost:3000`).

## Setup

From this directory:

```bash
cp .env.example .env
npm ci
```

Set `VITE_API_BASE_URL` in `.env` to the backend API URL. `VITE_ADMIN_PHONE` and `VITE_TELEGRAM_ADMIN` optionally customize registration-page contact links. PowerShell equivalent for copying the template: `Copy-Item .env.example .env`.

Never put secrets in `VITE_*` variables; Vite embeds them in browser-accessible assets.

## Development and production

```bash
npm run dev
```

Vite serves the application at `http://localhost:5173` by default. Create and preview a production build with:

```bash
npm run build
npm run preview
```

`npm run build` runs the TypeScript project build followed by Vite's production build, writing static assets to `dist/`.

## Scripts

| Script | Command |
| --- | --- |
| `npm run dev` | `vite` |
| `npm run build` | `tsc -b && vite build` |
| `npm run lint` | `oxlint` |
| `npm run preview` | `vite preview` |

The frontend declares React and React DOM `^19.2.8`, React Router `^8.3.1`, Tailwind CSS `^4.3.3`, Ant Design `^6.6.2`, and Vite `^8.2.2`. See `package.json` and `package-lock.json` for the full dependency set and resolved versions. No frontend test script is currently configured.

## Brand colors

Global design tokens live in `src/index.css`. The primary color is `#59C4CF`; components use the `primary-*` Tailwind utilities generated from that centralized scale. The same theme defines accent, semantic, and teal-tinted neutral scales.

## License

The frontend package does not specify a license. See the [root README](../README.md) for repository licensing information.
