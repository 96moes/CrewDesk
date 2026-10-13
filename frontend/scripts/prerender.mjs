// scripts/prerender.mjs
//
// Turns the single-page app's empty HTML shell into real static HTML — one file per
// route — so crawlers that do not execute JavaScript (and every social preview bot)
// receive the fully rendered page instead of <div id="root"></div>.
//
// How it works:
//   1. `vite preview` serves the just-built dist/ directory
//   2. a headless browser loads each route and lets React render
//   3. the resulting DOM is written to dist/<route>/index.html
//
// The plain "/" file is rewritten in place, so a failed run can never leave the site
// without an index.html.
//
// Uses an already-installed Chrome/Edge via puppeteer-core, so `npm ci` does not
// download a second browser. If no browser is found the step is skipped with a warning
// rather than failing the build — the site still works, it is just not prerendered.

import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { PRERENDER_PATHS, outputFileFor } from "./seo-routes.mjs";
import {
  frontendRoot,
  distDir,
  siteOrigin,
  resolveSiteUrl,
  warnIfPlaceholder,
} from "./site-config.mjs";

const PORT = Number(process.env.PRERENDER_PORT || 4178);
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CONCURRENCY = Number(process.env.PRERENDER_CONCURRENCY || 2);
const ROUTE_TIMEOUT_MS = Number(process.env.PRERENDER_TIMEOUT_MS || 20000);
const FAIL_ON_ERROR = process.argv.includes("--fail-on-error");

const dist = distDir();

if (!existsSync(dist)) {
  console.error(
    `[prerender] ${dist} does not exist. Run \`vite build\` before prerendering.`,
  );
  process.exit(1);
}

// --- locate a browser -------------------------------------------------------
function findBrowser() {
  const fromEnv =
    process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && existsSync(fromEnv)) return { path: fromEnv, source: "environment" };

  const candidates =
    process.platform === "win32"
      ? [
          `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
            "/snap/bin/chromium",
            "/usr/bin/microsoft-edge",
          ];

  for (const candidate of candidates) {
    if (candidate && existsSync(candidate)) return { path: candidate, source: "auto" };
  }
  return null;
}

// --- preview server ---------------------------------------------------------
// stdio is ignored rather than piped: the preview server produces no output we need,
// and piped stdio is unavailable in some confined execution environments.
async function startPreview() {
  const viteBin = resolve(frontendRoot, "node_modules", "vite", "bin", "vite.js");
  if (!existsSync(viteBin)) {
    throw new Error(`vite not found at ${viteBin}. Run \`npm ci\` first.`);
  }

  const server = spawn(
    process.execPath,
    [viteBin, "preview", "--port", String(PORT), "--strictPort", "--host", "127.0.0.1"],
    { cwd: frontendRoot, stdio: "ignore" },
  );

  server.on("error", (error) => {
    console.error("[prerender] failed to start vite preview:", error.message);
  });

  // Poll instead of parsing stdout, so we do not depend on the server's log format.
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE_URL, { redirect: "manual" });
      if (res.status < 500) return server;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }

  server.kill();
  throw new Error(`vite preview did not become ready on ${BASE_URL} within 30s`);
}

// --- rendering --------------------------------------------------------------
async function renderRoute(browser, routePath) {
  const page = await browser.newPage();

  try {
    // Persian content is small; block nothing, but keep the viewport desktop-sized so
    // responsive images and layout resolve the same way they do for a crawler.
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(`${BASE_URL}${routePath}`, {
      waitUntil: "networkidle2",
      timeout: ROUTE_TIMEOUT_MS,
    });

    // networkidle2 can fire before React's first commit; wait for actual markup.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return !!root && root.children.length > 0;
      },
      { timeout: ROUTE_TIMEOUT_MS, polling: 100 },
    );

    // Give title/meta effects one more frame to run.
    await new Promise((r) => setTimeout(r, 250));

    const html = await page.evaluate(() => {
      // Remove the no-JS fallback: for a prerendered page the real content is present,
      // and keeping it would duplicate the page's headings.
      //
      // Removed by tag, not by id: with scripting enabled the HTML parser treats the
      // contents of <noscript> as raw text, so its children are not reachable through
      // document.getElementById.
      for (const el of document.querySelectorAll("noscript")) el.remove();

      // Remove anything the automation tool injected into the DOM.
      for (const el of document.querySelectorAll("[data-puppeteer-id]")) el.remove();

      const doctype = "<!doctype html>";
      return `${doctype}\n${document.documentElement.outerHTML}`;
    });

    const title = await page.title();
    return { html, title, ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  } finally {
    await page.close().catch(() => {});
  }
}

async function runPool(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  });

  await Promise.all(runners);
  return results;
}

// --- main -------------------------------------------------------------------
async function main() {
  const { url, source } = resolveSiteUrl();
  warnIfPlaceholder(url, source);

  const browserInfo = findBrowser();
  if (!browserInfo) {
    console.warn(
      "\n  [prerender] SKIPPED: no Chrome, Chromium or Edge executable was found.\n" +
        "              The site still builds and runs, but crawlers that do not run\n" +
        "              JavaScript will receive the empty app shell.\n" +
        "              Install a browser, or point CHROME_PATH at one, to enable prerendering.\n",
    );
    return;
  }

  console.log(`[prerender] browser: ${browserInfo.path}`);
  console.log(`[prerender] origin:  ${siteOrigin()}`);
  console.log(`[prerender] routes:  ${PRERENDER_PATHS.length}`);

  let puppeteer;
  try {
    ({ default: puppeteer } = await import("puppeteer-core"));
  } catch {
    console.warn(
      "[prerender] SKIPPED: puppeteer-core is not installed. Run `npm ci` to install it.",
    );
    return;
  }

  const server = await startPreview();
  let browser;

  try {
    browser = await puppeteer.launch({
      executablePath: browserInfo.path,
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--hide-scrollbars",
      ],
    });

    const stamp = `<!-- prerendered by scripts/prerender.mjs on ${new Date().toISOString()} -->`;

    const results = await runPool(
      PRERENDER_PATHS,
      async (routePath) => {
        const outcome = await renderRoute(browser, routePath);
        if (!outcome.ok) {
          console.error(`[prerender] FAILED ${routePath}: ${outcome.error}`);
          return outcome;
        }

        const target = resolve(dist, outputFileFor(routePath));
        const html = outcome.html.replace(
          /^<!doctype html>\s*/i,
          `<!doctype html>\n${stamp}\n`,
        );

        // Write via a temporary file and rename, so a crash mid-write cannot corrupt
        // the existing page.
        mkdirSync(dirname(target), { recursive: true });
        const temp = `${target}.tmp`;
        writeFileSync(temp, html, "utf8");
        rmSync(target, { force: true });
        renameSync(temp, target);

        console.log(
          `[prerender] ${routePath.padEnd(24)} -> ${outputFileFor(routePath)}  (${Math.round(html.length / 1024)} kB)`,
        );
        return outcome;
      },
      CONCURRENCY,
    );

    const failures = results.filter((r) => r && !r.ok);
    if (failures.length > 0) {
      const message = `[prerender] ${failures.length} of ${PRERENDER_PATHS.length} routes failed to prerender.`;
      if (FAIL_ON_ERROR) {
        throw new Error(message);
      }
      console.warn(`${message} The remaining pages were written successfully.`);
    } else {
      console.log(`[prerender] done: ${PRERENDER_PATHS.length} pages written.`);
    }

    // Prune stale prerendered pages. Without this, a route that is no longer prerendered
    // leaves an orphaned <route>/index.html behind, and nginx (whose try_files checks
    // $uri/index.html) would keep serving that outdated page forever.
    //
    // Routes nest (/dashboard/user), so match on the full relative path and then remove
    // the directories that pruning leaves empty — never a whole tree, or a parent such as
    // /dashboard/ would take /dashboard/user/ with it.
    const wanted = new Set(PRERENDER_PATHS.map(outputFileFor));
    const staleFiles = [];

    const walk = (dir, prefix) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === "assets") continue;
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        const candidate = `${relative}/index.html`;
        if (existsSync(resolve(dist, candidate)) && !wanted.has(candidate)) {
          staleFiles.push(candidate);
        }
        walk(resolve(dir, entry.name), relative);
      }
    };
    walk(dist, "");

    for (const stale of staleFiles) {
      rmSync(resolve(dist, stale), { force: true });
      console.log(`[prerender] pruned stale page ${stale}`);
    }

    // Remove directories left empty by the pruning above, deepest first. Each call
    // recurses into its own children, so no callback is re-entered mid-traversal.
    const removeEmptyDirs = (dir) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (!entry.isDirectory() || entry.name === "assets") continue;
        const child = resolve(dir, entry.name);
        removeEmptyDirs(child);
        if (readdirSync(child).length === 0) {
          rmSync(child, { recursive: true, force: true });
          console.log(
            `[prerender] removed empty directory ${child.replace(`${dist}${sep}`, "")}/`,
          );
        }
      }
    };
    removeEmptyDirs(dist);

    // Warn about a missing social preview image: a broken og:image URL is worse than
    // no og:image at all, because the preview renders as an empty card.
    const ogImage = process.env.VITE_OG_IMAGE || "/og-image.png";
    if (ogImage.startsWith("/") && !existsSync(resolve(dist, ogImage.slice(1)))) {
      console.warn(
        `\n  [prerender] WARNING: ${ogImage} is referenced as og:image but is not in ` +
          `the build output.\n              Add it to frontend/public/ (1200x630 PNG) so ` +
          `link previews render.\n`,
      );
    }

    // Sanity check: every prerendered page must carry rendered content inside #root,
    // and index.html must not have been left as the empty shell.
    const rootChecks = [
      { name: "index.html", file: resolve(dist, "index.html") },
      ...readdirSync(dist, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && entry.name !== "assets")
        .map((entry) => ({
          name: entry.name,
          file: resolve(dist, entry.name, "index.html"),
        })),
    ].filter((entry) => existsSync(entry.file));

    const empty = rootChecks.filter((entry) => {
      const contents = readFileSync(entry.file, "utf8");
      // Either the shell is untouched, or #root rendered nothing.
      return (
        !contents.includes('id="root"') ||
        /id="root"\s*>\s*<\/div>/.test(contents)
      );
    });

    if (empty.length > 0) {
      console.warn(
        `[prerender] WARNING: these pages look empty after rendering: ${empty
          .map((e) => e.name)
          .join(", ")}`,
      );
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
}

main().catch((error) => {
  console.error("[prerender] failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
