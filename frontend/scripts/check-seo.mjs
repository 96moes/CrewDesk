// scripts/check-seo.mjs
//
// Guards the SEO setup against silent drift. Runs as part of `npm run build` and can be
// run alone with `npm run seo:check`.
//
// It fails when:
//   1. src/seo/routes.ts and scripts/seo-routes.mjs list different paths
//   2. src/App.tsx declares a route that has no SEO entry (or vice versa)
//   3. two routes share a title or description, which makes them compete for the same query
//   4. a title or description falls well outside the length search engines display
//   5. an indexable route is marked noindex in src/seo/SeoRoute.tsx
//
// These are the mistakes that quietly cost rankings, so they are worth failing a build over.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { frontendRoot } from "./site-config.mjs";
import { ALL_PATHS, SITEMAP_PATHS } from "./seo-routes.mjs";

const errors = [];
const warnings = [];

const read = (relative) => readFileSync(resolve(frontendRoot, relative), "utf8");

// The catch-all is declared as path="*" in App.tsx, and the 404 metadata lives in
// NOT_FOUND_SEO rather than in the ROUTES array. Neither is a real route, so they are
// excluded from the path-by-path comparisons below and checked separately.
const SPECIAL_PATHS = new Set(["*", "/404"]);

// --- 1. Parse the TypeScript route inventory --------------------------------
const routesTs = read("src/seo/routes.ts");

const tsPaths = [...routesTs.matchAll(/^\s*path:\s*"([^"]+)",/gm)]
  .map((m) => m[1])
  .filter((path) => !SPECIAL_PATHS.has(path));
const tsTitles = [...routesTs.matchAll(/^\s*title:\s*"([^"]+)",/gm)].map((m) => m[1]);
// Description literals wrap onto their own line in the TypeScript source, so match the
// key and the value separately, allowing whitespace and newlines between them.
const tsDescriptions = [...routesTs.matchAll(/description:\s*"([^"]+)"/g)].map(
  (m) => m[1],
);

// --- 2. Compare with the Node-side list -------------------------------------
const tsSet = new Set(tsPaths);
const nodeSet = new Set(ALL_PATHS.filter((path) => !SPECIAL_PATHS.has(path)));

if (!routesTs.includes('path: "/404"')) {
  errors.push(
    'src/seo/routes.ts has no NOT_FOUND_SEO entry (expected a path: "/404")',
  );
}

for (const path of tsSet) {
  if (!nodeSet.has(path)) {
    errors.push(
      `route "${path}" is in src/seo/routes.ts but missing from scripts/seo-routes.mjs`,
    );
  }
}
for (const path of nodeSet) {
  if (!tsSet.has(path)) {
    errors.push(
      `route "${path}" is in scripts/seo-routes.mjs but missing from src/seo/routes.ts`,
    );
  }
}

// --- 3. Compare with the routes actually declared in App.tsx ----------------
const appTsx = read("src/App.tsx");
const appPaths = new Set(
  [...appTsx.matchAll(/<Route\s+(?:index\s+)?path="([^"]+)"/g)].map((m) => m[1]),
);
// index routes (e.g. <Route index element={<Overview />} />) live at their parent path
const hasIndexRoute = /<Route\s+index\s/.test(appTsx);

for (const path of tsSet) {
  // Nested admin children are declared as relative paths in App.tsx ("users",
  // "bulk-messages"), so compare on the final segment.
  const segment = path.replace(/^\//, "");
  const lastSegment = segment.includes("/") ? segment.split("/").pop() : segment;
  const known =
    appPaths.has(path) ||
    appPaths.has(segment) ||
    appPaths.has(lastSegment) ||
    (path === "/dashboard" && hasIndexRoute);

  if (!known) {
    errors.push(`route "${path}" has SEO metadata but no matching <Route> in src/App.tsx`);
  }
}

for (const path of appPaths) {
  if (SPECIAL_PATHS.has(path)) continue;
  const asAbsolute = path.startsWith("/") ? path : `/${path}`;
  const known =
    tsSet.has(asAbsolute) ||
    tsSet.has(path) ||
    [...tsSet].some((p) => p.endsWith(`/${path}`)) ||
    path === "/dashboard";

  if (!known) {
    errors.push(
      `<Route path="${path}"> in src/App.tsx has no SEO entry, so it inherits the previous page's title`,
    );
  }
}

// --- 4. Duplicate and length checks ----------------------------------------
function findDuplicates(values) {
  const seen = new Map();
  for (const value of values) seen.set(value, (seen.get(value) ?? 0) + 1);
  return [...seen.entries()].filter(([, count]) => count > 1).map(([value]) => value);
}

for (const duplicate of findDuplicates(tsTitles)) {
  errors.push(`duplicate title shared by more than one route: "${duplicate}"`);
}
for (const duplicate of findDuplicates(tsDescriptions)) {
  errors.push(`duplicate description shared by more than one route: "${duplicate}"`);
}

for (const title of tsTitles) {
  // Persian titles render narrower than Latin text; ~65 characters is a safe ceiling.
  if (title.length > 70) {
    warnings.push(`title is ${title.length} characters and may be truncated: "${title}"`);
  }
}
for (const description of tsDescriptions) {
  if (description.length < 50) {
    warnings.push(
      `description is only ${description.length} characters and may be replaced by Google: "${description}"`,
    );
  }
  if (description.length > 175) {
    warnings.push(
      `description is ${description.length} characters and will be truncated: "${description}"`,
    );
  }
}

// --- 5. noindex vs sitemap consistency --------------------------------------
const seoRouteTsx = read("src/seo/SeoRoute.tsx");
const noindexPrefixes = [
  ...(seoRouteTsx.match(/NOINDEX_PREFIXES\s*=\s*\[([^\]]+)\]/s)?.[1].matchAll(/"([^"]+)"/g) ??
    []),
].map((m) => m[1]);

for (const sitemapPath of SITEMAP_PATHS) {
  const blocked = noindexPrefixes.some(
    (prefix) => sitemapPath === prefix || sitemapPath.startsWith(`${prefix}/`),
  );
  if (blocked) {
    errors.push(
      `"${sitemapPath}" is in sitemap.xml but SeoRoute marks it noindex — pick one`,
    );
  }
}

// --- report -----------------------------------------------------------------
if (warnings.length > 0) {
  console.warn(`\n[seo] ${warnings.length} warning(s):`);
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n[seo] ${errors.length} error(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  console.error("\n[seo] fix the route metadata before deploying.\n");
  process.exit(1);
}

console.log(
  `[seo] route metadata OK: ${tsPaths.length} routes, ${SITEMAP_PATHS.length} indexable, no duplicate titles.`,
);
