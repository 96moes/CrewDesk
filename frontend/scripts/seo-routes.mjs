// scripts/seo-routes.mjs
//
// Plain-JS mirror of the route inventory in src/seo/routes.ts.
//
// Node build scripts cannot import that TypeScript module, so the list is duplicated
// here on purpose. `scripts/check-seo.mjs` runs as part of `npm run build` and fails the
// build when the two lists disagree, so they cannot silently drift apart.
//
// `index: true`      -> included in sitemap.xml
// `prerender: false` -> excluded from the static prerender step
//
// Routes behind ProtectedRoute / AdminRoute are marked `prerender: false`: an anonymous
// prerender run follows the redirect to /login, so the generated HTML would carry the
// login page's title and content under the protected URL. They are also noindex, so
// there is nothing to gain from prerendering them.

export const ROUTES = [
  { path: "/", index: true },
  { path: "/about", index: true },
  { path: "/education", index: true },
  { path: "/gallery", index: true },
  { path: "/cooperation", index: true },
  { path: "/donations", index: true },
  { path: "/events", index: true },
  { path: "/login", index: false },
  { path: "/register", index: false },
  { path: "/dashboard/user", index: false, prerender: false },
  { path: "/dashboard/groups", index: false, prerender: false },
  { path: "/dashboard", index: false, prerender: false },
  { path: "/dashboard/users", index: false, prerender: false },
  { path: "/dashboard/projects", index: false, prerender: false },
  { path: "/dashboard/tasks", index: false, prerender: false },
  { path: "/dashboard/bulk-messages", index: false, prerender: false },
];

/** Every path declared in the app, including the catch-all used for drift checking. */
export const ALL_PATHS = [...ROUTES.map((r) => r.path), "*"];

export const SITEMAP_PATHS = ROUTES.filter((r) => r.index === true).map((r) => r.path);

export const PRERENDER_PATHS = ROUTES.filter((r) => r.prerender !== false).map(
  (r) => r.path,
);

/**
 * Output file for a prerendered route, relative to the build output directory.
 * "/" -> index.html, "/about" -> about/index.html
 *
 * Both forms are served by the nginx configuration in DEPLOYMENT.md: `try_files $uri $uri/`
 * resolves a directory to its index.html through the `index` directive.
 */
export function outputFileFor(routePath) {
  if (routePath === "/") return "index.html";
  return `${routePath.replace(/^\/+|\/+$/g, "")}/index.html`;
}
