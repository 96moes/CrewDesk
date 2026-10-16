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
// Routes behind ProtectedRoute / AdminRoute are absent from ROUTES entirely: the signed-in
// panel carries no SEO metadata (see src/seo/NoSeo.tsx), so there is nothing for the sitemap
// or the prerender step to do with it. It could not be prerendered either — an anonymous
// prerender run follows the redirect to /login, so the generated HTML would carry the login
// page's title and content under the protected URL. The paths are listed in PRIVATE_PATHS
// below so scripts/check-seo.mjs can still prove that the app and these lists agree.

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
];

/**
 * Routes behind a login. They are intentionally missing from ROUTES: no title, no
 * description, no canonical, no social tags, and nothing in sitemap.xml or the prerender
 * step. src/seo/SeoRoute.tsx matches them by prefix (NO_SEO_PREFIXES) and strips whatever
 * metadata the previously visited public page left in the head.
 *
 * Keep this in step with the <Route> elements in src/App.tsx; check-seo.mjs fails the build
 * when a route appears in one and not the other.
 */
export const PRIVATE_PATHS = [
  "/dashboard/user",
  "/dashboard/groups",
  "/dashboard",
  "/dashboard/users",
  "/dashboard/projects",
  "/dashboard/tasks",
  "/dashboard/bulk-messages",
  "/dashboard/gallery",
];

/** Every path declared in the app, including the catch-all used for drift checking. */
export const ALL_PATHS = [...ROUTES.map((r) => r.path), ...PRIVATE_PATHS, "*"];

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
