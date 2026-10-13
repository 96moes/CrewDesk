// scripts/site-config.mjs
//
// Resolves the public site origin for the build-time SEO scripts.
//
// Precedence:
//   1. process.env.VITE_SITE_URL        (explicit override, useful in CI)
//   2. .env.production                  (what a real deployment build uses)
//   3. .env                             (local defaults)
//   4. .env.example                     (committed placeholder)
//   5. FALLBACK_SITE_URL
//
// Written by hand rather than with dotenv so the build has no extra dependency.

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const FALLBACK_SITE_URL = "https://quomsalman.ir";

export const frontendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Minimal .env reader: KEY=value, ignores blanks and # comments, tolerates quotes. */
export function readEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;

  for (const rawLine of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    out[key] = value;
  }
  return out;
}

export function resolveSiteUrl() {
  if (process.env.VITE_SITE_URL) {
    return { url: process.env.VITE_SITE_URL, source: "process.env.VITE_SITE_URL" };
  }

  for (const name of [".env.production", ".env", ".env.example"]) {
    const file = resolve(frontendRoot, name);
    const value = readEnvFile(file).VITE_SITE_URL;
    if (value) return { url: value, source: name };
  }

  return { url: FALLBACK_SITE_URL, source: "built-in fallback" };
}

/** Site origin without a trailing slash, e.g. "https://quomsalman.ir". */
export function siteOrigin() {
  return resolveSiteUrl().url.trim().replace(/\/+$/, "");
}

export function absoluteUrl(path) {
  return `${siteOrigin()}${path.startsWith("/") ? "" : "/"}${path}`;
}

/** The directory `vite build` writes to. */
export function distDir() {
  return resolve(frontendRoot, "dist");
}

/**
 * Warns when the resolved site URL still looks like a placeholder. Canonical URLs and
 * sitemap entries built from a placeholder point search engines at a domain you do not
 * own, which is worse than having no sitemap at all.
 */
export function warnIfPlaceholder(url, source) {
  const isPlaceholder = isPlaceholderUrl(url);

  if (isPlaceholder) {
    console.warn(
      `\n  [seo] WARNING: site URL "${url}" (from ${source}) looks like a placeholder.\n` +
        `        Set VITE_SITE_URL in frontend/.env.production to your real domain before\n` +
        `        deploying, or canonical URLs and sitemap.xml will point at the wrong site.\n`,
    );
  }
  return isPlaceholder;
}

export function isPlaceholderUrl(url) {
  return (
    /example\.(com|org|net)$/i.test(url) ||
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(url)
  );
}

/**
 * Fails a production build when the site URL is still localhost or a placeholder.
 *
 * This is a hard stop on purpose. Shipping a production build whose canonical URLs point
 * at http://localhost:5173 tells Google the real content lives on a machine it can never
 * reach, and the whole site can drop out of the index. A local `.env` is the usual cause,
 * which is exactly why it is worth failing loudly instead of warning.
 *
 * Pass --allow-placeholder-site-url (or NO_STRICT_SITE_URL=1) to override.
 */
export function assertProductionSiteUrl(url, source) {
  if (!isPlaceholderUrl(url)) return;
  if (
    process.argv.includes("--allow-placeholder-site-url") ||
    process.env.NO_STRICT_SITE_URL === "1"
  ) {
    console.warn(`[seo] placeholder site URL "${url}" allowed by flag.`);
    return;
  }

  console.error(
    `\n[seo] ERROR: VITE_SITE_URL resolved to "${url}" (from ${source}) for a production build.\n` +
      `\n  Canonical URLs, og:url, robots.txt and sitemap.xml would all point there, and\n` +
      `  search engines would treat that address as the real site.\n` +
      `\n  Set VITE_SITE_URL to your real origin in frontend/.env.production:\n` +
      `      VITE_SITE_URL=https://your-domain.example\n` +
      (source === ".env" || source === ".env.development"
        ? `\n  The value currently comes from ${source}, which holds development values.\n` +
          `  A .env.production file takes precedence and is what a release build should use.\n`
        : "") +
      `\n  To build anyway (not for deployment), run with NO_STRICT_SITE_URL=1.\n`,
  );
  process.exit(1);
}
