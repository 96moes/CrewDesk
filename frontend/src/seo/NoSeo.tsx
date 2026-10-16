// src/seo/NoSeo.tsx
import { useEffect } from "react";
import { upsertMeta } from "./head";
import { SITE_NAME } from "./site";

/**
 * Head handling for the signed-in panel.
 *
 * The panel sits behind a login, so SEO metadata on it is wasted effort: nothing there
 * can rank, and a title or description left over from the page the visitor came from
 * actively misdescribes it. So this does not write metadata — it removes every tag
 * <Seo> manages and leaves exactly one instruction behind: do not index this page.
 *
 * Removing rather than merely skipping matters because this is a single-page app.
 * Arriving at /dashboard from /events would otherwise leave the events title,
 * description, canonical URL and Open Graph tags describing a page the visitor has
 * already left, both in the tab and in anything that reads the head. Everything
 * removed here is recreated by <Seo> on the next public route, so nothing is lost.
 *
 * Two groups are deliberately left alone: the site-level Organization/WebSite JSON-LD
 * and the icon/theme-color tags from index.html. They describe the site rather than
 * the page, and <Seo> cannot recreate them — removing them here would quietly degrade
 * every public page visited later in the same session.
 */
const MANAGED_TAGS = [
  'meta[name="description"]',
  'link[rel="canonical"]',
  'meta[property^="og:"]',
  'meta[name^="twitter:"]',
  'script[data-seo="route"]',
];

export default function NoSeo() {
  useEffect(() => {
    for (const selector of MANAGED_TAGS) {
      for (const tag of document.head.querySelectorAll(selector)) tag.remove();
    }

    // The tab stays labelled — with the site name only, no per-page SEO copy.
    document.title = SITE_NAME;

    upsertMeta("name", "robots", "noindex, nofollow");
  }, []);

  return null;
}
