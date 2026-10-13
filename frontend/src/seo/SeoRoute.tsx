// src/seo/SeoRoute.tsx
import { useLocation } from "react-router";
import Seo from "./Seo";
import { NOT_FOUND_SEO, seoForPath } from "./routes";

/**
 * Applies route-level metadata on every navigation.
 *
 * Mount once, inside the router, next to <Routes>. Dashboards and admin pages are marked
 * `noindex` because they are behind a login: indexing a login wall produces "soft 404"
 * style results and wastes crawl budget on pages no visitor can read.
 */
const NOINDEX_PREFIXES = ["/dashboard", "/dashboard/user", "/login", "/register"];

function isNoIndex(pathname: string): boolean {
  return NOINDEX_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default function SeoRoute() {
  const { pathname } = useLocation();
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
      noindex={isNoIndex(route.path)}
    />
  );
}
