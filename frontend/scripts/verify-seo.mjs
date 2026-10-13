// SEO output verification. Checks the built dist/ the way a crawler would see it.
// Run with: node scripts/verify-seo.mjs
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PRERENDER_PATHS, SITEMAP_PATHS, outputFileFor } from "./seo-routes.mjs";

const dist = resolve("dist");
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}${detail ? `  — ${detail}` : ""}`);
  if (!ok) failures++;
};

console.log("\n=== prerendered pages ===");
for (const page of PRERENDER_PATHS.map(outputFileFor)) {
  const file = resolve(dist, page);
  if (!existsSync(file)) {
    check(false, page, "missing");
    continue;
  }
  const html = readFileSync(file, "utf8");
  const head = html.slice(0, html.indexOf("</head>"));

  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  const desc = (head.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "";
  const h1Count = (html.match(/<h1/g) || []).length;
  const noindex = /name="robots" content="noindex/.test(head);

  const problems = [
    title.length < 5 && "no title",
    desc.length < 40 && "no description",
    !/<link rel="canonical" href="https?:\/\//.test(head) && "no canonical",
    !/<meta property="og:image" content="https?:\/\//.test(head) && "no og:image",
    /<noscript/.test(html) && "noscript left in",
    h1Count !== 1 && `${h1Count} h1 tags`,
    /id="root"\s*><\/div>/.test(html) && "root empty",
    !/<script type="module"[^>]+src="\/assets\//.test(html) && "bundle not referenced",
  ].filter(Boolean);

  check(problems.length === 0, page, problems.join(", "));
  if (problems.length === 0) {
    console.log(`          title: ${title}`);
    if (noindex) console.log(`          (noindex)`);
  }
}

console.log("\n=== crawler files ===");
for (const f of ["robots.txt", "sitemap.xml", "og-image.png"]) {
  check(existsSync(resolve(dist, f)), f);
}

const robots = readFileSync(resolve(dist, "robots.txt"), "utf8");
check(/Sitemap:\s+https?:\/\/\S+/.test(robots), "robots.txt declares a sitemap");
check(/Disallow: \/dashboard/.test(robots), "robots.txt blocks /dashboard");
check(/Disallow: \/docs/.test(robots), "robots.txt blocks /docs");
check(!/Disallow: \/assets/.test(robots), "robots.txt does not block /assets");
check(
  !/Disallow: \/(about|education|gallery|cooperation|donations|events)\b/.test(robots),
  "robots.txt does not block indexable pages",
);

const sitemap = readFileSync(resolve(dist, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(
  locs.length === SITEMAP_PATHS.length,
  `sitemap has ${SITEMAP_PATHS.length} URLs`,
  `found ${locs.length}`,
);
check(locs.every((l) => l.startsWith("http")), "sitemap URLs are absolute");
check(
  !locs.some((l) => /dashboard|login|register|groups/.test(l)),
  "sitemap excludes private pages",
);
check(
  SITEMAP_PATHS.every((p) => locs.some((l) => l.endsWith(p === "/" ? "/" : p))),
  "sitemap covers every indexable route",
);

console.log(
  `\n=== sitemap origin ===\n  ${locs[0] ? new URL(locs[0]).origin : "n/a"}\n`,
);

console.log(`${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
