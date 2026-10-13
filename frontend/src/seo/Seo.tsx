// src/seo/Seo.tsx
import { useEffect } from "react";
import {
  SITE_NAME,
  DEFAULT_OG_IMAGE,
  absoluteUrl,
  canonicalUrl,
} from "./site";

/**
 * Per-page document head.
 *
 * Deliberately dependency-free: react-helmet and its maintained forks have a history of
 * lagging React major versions, and this app only needs title, description, canonical,
 * Open Graph, Twitter and optional JSON-LD. The effect below updates the existing tags
 * in index.html rather than adding duplicates.
 *
 * On the prerendered routes this data is also baked into the static HTML by
 * scripts/prerender.mjs, so crawlers that do not run JavaScript still see it.
 */

export interface SeoProps {
  title: string;
  description: string;
  /** Route path, used to build the canonical URL, e.g. "/about". */
  path: string;
  /** Image URL or path for social previews. Defaults to DEFAULT_OG_IMAGE. */
  image?: string;
  /** "website" for most pages, "article" for content pages. */
  type?: "website" | "article";
  /** Keep a page out of search results (login, register, admin, 404). */
  noindex?: boolean;
  /** Additional JSON-LD structured data. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Finds an existing <meta> by its name or property, or creates it. */
function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

export default function Seo({
  title,
  description,
  path,
  image,
  type = "website",
  noindex = false,
  jsonLd,
}: SeoProps) {
  const imageUrl = absoluteUrl(image || DEFAULT_OG_IMAGE);
  const canonical = canonicalUrl(path);

  // Everything except the JSON-LD script, which needs its own effect for cleanup.
  useEffect(() => {
    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta(
      "name",
      "robots",
      noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    );

    upsertLink("canonical", canonical);

    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", "fa_IR");
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    if (imageUrl) {
      upsertMeta("property", "og:image", imageUrl);
      upsertMeta("property", "og:image:alt", title);
    }

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    if (imageUrl) upsertMeta("name", "twitter:image", imageUrl);

    // The app is Persian and right-to-left; the prerender step renders a Persian shell,
    // so make sure the attributes survive whatever the host injects.
    document.documentElement.setAttribute("lang", "fa");
    document.documentElement.setAttribute("dir", "rtl");
  }, [title, description, canonical, imageUrl, type, noindex]);

  // Route-specific JSON-LD, removed when the route changes.
  useEffect(() => {
    if (!jsonLd) return;

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.seo = "route";
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [jsonLd]);

  return null;
}
