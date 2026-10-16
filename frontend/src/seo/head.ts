// src/seo/head.ts

/**
 * Helpers for writing document head tags.
 *
 * Shared by <Seo> (public pages) and <NoSeo> (the signed-in panel) so both agree on how a
 * tag is located: always update the tag that is already there rather than appending a
 * second one, because index.html declares most of them up front for the no-JavaScript
 * case. A duplicate <meta name="description"> is ignored by crawlers at best.
 */

/** Finds an existing <meta> by its name or property, or creates it. */
export function upsertMeta(attr: "name" | "property", key: string, content: string): void {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function upsertLink(rel: string, href: string): void {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}
