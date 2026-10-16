// scripts/check-seo.mjs
//
// Guards the SEO setup against silent drift. Runs as part of `npm run build` and can be
// run alone with `npm run seo:check`.
//
// It fails when:
//   1. src/seo/routes.ts and scripts/seo-routes.mjs list different paths
//   2. src/App.tsx declares a route that is in neither src/seo/routes.ts nor
//      PRIVATE_PATHS (or either list names a route App.tsx does not declare)
//   3. two routes share a title or description, which makes them compete for the same query
//   4. a title or description falls well outside the length search engines display
//   5. an indexable route is marked noindex in src/seo/SeoRoute.tsx
//   6. a PRIVATE_PATHS route is in the sitemap, or is not covered by the NO_SEO_PREFIXES
//      that strip its metadata on the client
//
// These are the mistakes that quietly cost rankings, so they are worth failing a build over.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { frontendRoot } from "./site-config.mjs";
import { ALL_PATHS, PRIVATE_PATHS, SITEMAP_PATHS } from "./seo-routes.mjs";

const errors = [];
const warnings = [];

const read = (relative) => readFileSync(resolve(frontendRoot, relative), "utf8");

// The catch-all is declared as path="*" in App.tsx, and the 404 metadata lives in
// NOT_FOUND_SEO rather than in the ROUTES array. Neither is a real route, so they are
// excluded from the path-by-path comparisons below and checked separately.
const SPECIAL_PATHS = new Set(["*", "/404"]);

// Routes behind a login. They carry no SEO metadata on purpose, so they must appear in
// neither src/seo/routes.ts nor ROUTES — but they do have to match App.tsx.
const privateSet = new Set(PRIVATE_PATHS);

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
const nodeSet = new Set(
  ALL_PATHS.filter((path) => !SPECIAL_PATHS.has(path) && !privateSet.has(path)),
);

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

/**
 * Every path App.tsx actually serves, resolved to absolute form.
 *
 * Resolving the nesting matters rather than matching on final segments: the admin media
 * page is declared as path="gallery" under /dashboard, so a last-segment match would
 * happily accept it as the public "/gallery" and dropping its PRIVATE_PATHS entry would
 * go unnoticed. Keeping the parent path on a stack removes that ambiguity.
 */
function collectServedPaths(source) {
  // The prose comments mention routes; strip block comments before tokenizing.
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "");

  const served = new Set();
  const stack = [];
  const context = () => (stack.length > 0 ? stack[stack.length - 1] : undefined);

  /** Index of the ">" closing the tag that starts at `from`, ignoring quotes and braces. */
  function tagEnd(from) {
    let quote = null;
    let braces = 0;
    for (let i = from; i < code.length; i++) {
      const char = code[i];
      if (quote) {
        if (char === quote) quote = null;
      } else if (char === '"' || char === "'") {
        quote = char;
      } else if (char === "{") {
        braces += 1;
      } else if (char === "}") {
        braces -= 1;
      } else if (char === ">" && braces === 0) {
        return i;
      }
    }
    return -1;
  }

  for (const match of code.matchAll(/<(\/?)Route\b/g)) {
    if (match[1] === "/") {
      stack.pop();
      continue;
    }

    const end = tagEnd(match.index + match[0].length);
    if (end === -1) continue;

    const attrs = code.slice(match.index + match[0].length, end);
    const rawPath = attrs.match(/\bpath="([^"]*)"/)?.[1];
    const isIndex = /(^|\s)index(\s|=|\/|$)/.test(attrs);
    const selfClosing = code[end - 1] === "/";
    const parent = context();

    let absolute;
    if (rawPath !== undefined) {
      // A child path without a leading slash is relative to its parent route.
      absolute =
        rawPath === "*"
          ? "*"
          : rawPath.startsWith("/") || parent === undefined || parent === "/"
            ? `/${rawPath.replace(/^\//, "")}`
            : `${parent}/${rawPath}`;
      served.add(absolute);
    } else if (isIndex && parent !== undefined) {
      // An index route is served at its parent's path.
      served.add(parent);
    }

    // A pathless layout (<Route element={<MainLayout />}>) keeps the parent's path so
    // that its children still resolve correctly.
    if (!selfClosing) stack.push(absolute ?? parent);
  }

  return served;
}

const appPaths = collectServedPaths(appTsx);

for (const path of tsSet) {
  if (!appPaths.has(path)) {
    errors.push(`route "${path}" has SEO metadata but no matching <Route> in src/App.tsx`);
  }
}

for (const path of privateSet) {
  if (!appPaths.has(path)) {
    errors.push(
      `route "${path}" is listed in PRIVATE_PATHS but has no matching <Route> in src/App.tsx`,
    );
  }
}

for (const path of appPaths) {
  if (SPECIAL_PATHS.has(path)) continue;
  if (tsSet.has(path) || privateSet.has(path)) continue;

  errors.push(
    `<Route> resolving to "${path}" in src/App.tsx has neither SEO metadata nor a ` +
      `PRIVATE_PATHS entry: add it to src/seo/routes.ts, or to PRIVATE_PATHS in ` +
      `scripts/seo-routes.mjs if it is a signed-in page that should carry no metadata`,
  );
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

/** Reads a `const NAME = ["a", "b"]` prefix list out of a source file. */
function parsePrefixList(source, name) {
  const body = source.match(new RegExp(`${name}\\s*=\\s*\\[([^\\]]+)\\]`, "s"))?.[1] ?? "";
  return [...body.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

const privatePrefixes = parsePrefixList(seoRouteTsx, "NO_SEO_PREFIXES");
// Panel routes are noindex too — they are just noindex *and* stripped of metadata.
const noindexPrefixes = [
  ...parsePrefixList(seoRouteTsx, "NOINDEX_PREFIXES"),
  ...privatePrefixes,
];

const isUnder = (path, prefixes) =>
  prefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));

for (const path of privateSet) {
  if (!isUnder(path, privatePrefixes)) {
    errors.push(
      `"${path}" is in PRIVATE_PATHS but no NO_SEO_PREFIXES entry in src/seo/SeoRoute.tsx ` +
        `covers it, so it would keep whatever metadata the previous route wrote`,
    );
  }
  if (SITEMAP_PATHS.includes(path)) {
    errors.push(`"${path}" carries no SEO metadata but is listed in sitemap.xml — pick one`);
  }
}

for (const sitemapPath of SITEMAP_PATHS) {
  if (isUnder(sitemapPath, noindexPrefixes)) {
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
  `[seo] route metadata OK: ${tsPaths.length} routes with metadata, ` +
    `${privateSet.size} signed-in routes with none (noindex), ` +
    `${SITEMAP_PATHS.length} indexable, no duplicate titles.`,
);
