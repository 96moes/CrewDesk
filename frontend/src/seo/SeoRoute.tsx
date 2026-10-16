// src/seo/SeoRoute.tsx
import { useLocation } from "react-router";
import NoSeo from "./NoSeo";
import Seo from "./Seo";
import { NOT_FOUND_SEO, seoForPath } from "./routes";

/**
 * Applies route-level metadata on every navigation.
 *
 * Only the pages everyone can see carry metadata; everything behind a login is handled
 * specially instead, because such a page has no search value and indexing a login wall
 * produces "soft 404" style results and wastes crawl budget:
 *
 *   NO_SEO_PREFIXES  every signed-in route, in both signed-in sections: the user area
 *                    (/dashboard/user, /dashboard/groups) and the administrator area
 *                    (/dashboard and its children). They get no SEO metadata at all — no
 *                    title, description, canonical, Open Graph or Twitter tags. See
 *                    <NoSeo>, which actively strips them.
 *
 *   NOINDEX_PREFIXES login and registration. These keep their title and description —
 *                    they are public pages a visitor can reach without an account —
 *                    but ask not to be indexed.
 *
 * scripts/check-seo.mjs reads both lists and fails the build if a route the app
 * declares falls outside them, so keep the names and the array literal shape.
 */
const NO_SEO_PREFIXES = ["/dashboard"];
const NOINDEX_PREFIXES = ["/login", "/register"];

/** True when `pathname` is one of the prefixes or sits underneath it. */
function isUnder(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function SeoRoute() {
  const { pathname } = useLocation();

  // Signed-in pages: strip the metadata a previous public route left behind.
  if (isUnder(pathname, NO_SEO_PREFIXES)) {
    return <NoSeo />;
  }

  const route = seoForPath(pathname);

  // Unknown path: the NotFound page. Never index it, and use site-level fallback copy.
  if (!route) {
    return (
      <Seo
        title={NOT_FOUND_SEO.title}
        description={NOT_FOUND_SEO.description}
        path={pathname}
        noindex
      />
    );
  }

  return (
    <Seo
      title={route.title}
      description={route.description}
      path={route.path}
      noindex={isUnder(route.path, NOINDEX_PREFIXES)}
    />
  );
}
