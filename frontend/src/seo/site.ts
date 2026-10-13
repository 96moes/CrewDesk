// src/seo/site.ts

/**
 * Public origin of the site, without a trailing slash.
 *
 * Set `VITE_SITE_URL` in frontend/.env.production before building — canonical URLs,
 * Open Graph tags, the sitemap and robots.txt are all built from this value. A wrong
 * origin here tells search engines to index someone else's address, so it is the one
 * value worth double-checking after every production build.
 */
export const SITE_URL: string = (
  import.meta.env.VITE_SITE_URL || "https://quomsalman.ir"
).replace(/\/+$/, "");

/** Site name used in titles and structured data. */
export const SITE_NAME = "قوم سلمان";

/** Default social preview image, 1200x630. */
export const DEFAULT_OG_IMAGE: string = import.meta.env.VITE_OG_IMAGE || "/og-image.png";

/** Turns any path or URL into an absolute URL on the site origin. */
export function absoluteUrl(pathOrUrl?: string): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/**
 * Canonical URL for a path.
 *
 * The home page keeps its trailing slash ("/") because that is how it is served and
 * linked; every other route is emitted without one, so a single address is indexed
 * instead of two variants of the same page.
 */
export function canonicalUrl(path: string): string {
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "" || clean === "/") return `${SITE_URL}/`;
  return `${SITE_URL}${clean.startsWith("/") ? clean : `/${clean}`}`.replace(/\/+$/, "");
}
