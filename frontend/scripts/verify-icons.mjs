// scripts/verify-icons.mjs
//
// Renders the generated icon set in a real browser and writes a review sheet to
// scripts/_icons-preview.png, so the favicon can be checked the way a browser draws it rather
// than assumed.
//
// This check exists because a malformed SVG fails silently: the gradient or the tile still
// renders and only the glyph disappears, so a broken favicon looks "fine" unless it is
// actually looked at.
//
//   npm run icons:verify
//
// Requires an installed Chrome/Chromium/Edge (same detection as the prerender step). The sheet
// is written next to this script; open it and confirm the mark is legible at 16px.

import { createServer } from "node:http";
import { existsSync, readFileSync } from "node:fs";
import { extname, resolve } from "node:path";
import { frontendRoot } from "./site-config.mjs";

const PUBLIC = resolve(frontendRoot, "public");
const PORT = Number(process.env.ICONS_PORT || 4201);

const MIME = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".webmanifest": "application/manifest+json",
};

const SIZES = [16, 24, 32, 48, 64, 128];

const FIXTURE = `<!doctype html>
<html lang="fa" dir="rtl"><head><meta charset="utf-8"><style>
  body { margin:0; background:#f0f4f5; font:12px/1.6 system-ui; color:#18535a; }
  h2 { font-size:13px; margin:18px 0 6px; padding:0 24px; font-weight:600; }
  .row { display:flex; align-items:flex-end; gap:26px; padding:0 24px 6px; }
  .cell { text-align:center; }
  .label { margin-top:6px; color:#4c5f61; }
  .tab { display:inline-flex; align-items:center; gap:8px; background:#fff;
         border-radius:8px 8px 0 0; padding:9px 16px; box-shadow:0 -1px 3px rgba(0,0,0,.12); }
  .tab span { color:#35484a; font-size:13px; }
  .shots { padding:0 24px 20px; }
</style></head><body>
  <h2>favicon.svg (vector) at each size</h2>
  <div class="row" id="svg-row"></div>
  <h2>PNG / ICO set at the same sizes</h2>
  <div class="row" id="png-row"></div>
  <h2>In a browser tab</h2>
  <div class="shots"><div class="tab"><img id="tab-icon" width="16" height="16" alt=""><span>قوم سلمان</span></div></div>
  <script>
    const sizes = ${JSON.stringify(SIZES)};
    const pngFor = (s) => '/favicon-' + s + 'x' + s + '.png';
    for (const s of sizes) {
      const a = document.createElement('div');
      a.className = 'cell';
      a.innerHTML = '<img src="/favicon.svg" width="' + s + '" height="' + s + '" alt=""><div class="label">svg ' + s + '</div>';
      document.getElementById('svg-row').appendChild(a);

      const b = document.createElement('div');
      b.className = 'cell';
      // Fall back to the nearest generated PNG for sizes without their own file.
      const src = [16, 32, 48].includes(s) ? pngFor(s) : (s <= 24 ? pngFor(16) : s <= 64 ? pngFor(48) : '/android-chrome-192x192.png');
      b.innerHTML = '<img src="' + src + '" width="' + s + '" height="' + s + '" alt=""><div class="label">' + src.replace('/', '') + '</div>';
      document.getElementById('png-row').appendChild(b);
    }
    document.getElementById('tab-icon').src = '/favicon.svg';
  </script>
</body></html>`;

function findBrowser() {
  const fromEnv = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && existsSync(fromEnv)) return fromEnv;

  const candidates =
    process.platform === "win32"
      ? [
          `${process.env.PROGRAMFILES}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env["PROGRAMFILES(X86)"]}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          `${process.env.PROGRAMFILES}\\Microsoft\\Edge\\Application\\msedge.exe`,
        ]
      : process.platform === "darwin"
        ? [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
          ]
        : [
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/usr/bin/chromium",
            "/usr/bin/chromium-browser",
          ];

  return candidates.find((candidate) => candidate && existsSync(candidate)) || null;
}

const server = createServer((req, res) => {
  const url = (req.url || "/").split("?")[0];
  if (url === "/" || url === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(FIXTURE);
    return;
  }
  const file = resolve(PUBLIC, `.${url}`);
  if (!file.startsWith(PUBLIC) || !existsSync(file)) {
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "Content-Type": MIME[extname(file)] || "application/octet-stream" });
  res.end(readFileSync(file));
});

let failures = 0;

try {
  await new Promise((r) => server.listen(PORT, "127.0.0.1", r));

  const executablePath = findBrowser();
  if (!executablePath) {
    console.warn(
      "[icons] SKIPPED: no Chrome, Chromium or Edge found. Set CHROME_PATH to run this check.",
    );
    process.exit(0);
  }

  const puppeteer = (await import("puppeteer-core")).default;
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1140, height: 520, deviceScaleFactor: 2 });
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 300));

  // Every declared icon must load. A 0x0 natural size means the file is missing or invalid.
  const images = await page.evaluate(() =>
    [...document.images].map((img) => ({
      src: img.getAttribute("src"),
      natural: `${img.naturalWidth}x${img.naturalHeight}`,
    })),
  );

  const broken = images.filter((i) => i.natural.startsWith("0x"));
  for (const image of images) {
    console.log(`  ${image.natural.padEnd(9)} ${image.src}`);
  }
  if (broken.length > 0) {
    failures += broken.length;
    console.error(`\n[icons] ${broken.length} icon(s) failed to load:`);
    for (const b of broken) console.error(`  - ${b.src}`);
  }

  // Prove the SVG actually contains the glyph, not just the tile. The mark is white, so a
  // rendered SVG must contain near-white pixels; a tile-only SVG would not.
  const hasGlyph = await page.evaluate(async () => {
    const img = new Image();
    img.src = "/favicon.svg";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, 128, 128);
    const { data } = ctx.getImageData(0, 0, 128, 128);
    let white = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 235 && data[i + 1] > 235 && data[i + 2] > 235 && data[i + 3] > 200) {
        white++;
      }
    }
    return white;
  });

  const glyphOk = hasGlyph > 200;
  console.log(
    `\n[icons] favicon.svg glyph coverage: ${hasGlyph} white pixels ${glyphOk ? "(OK)" : "(TOO FEW — the glyph is probably missing)"}`,
  );
  if (!glyphOk) failures++;

  const sheet = resolve(frontendRoot, "scripts", "_icons-preview.png");
  await page.screenshot({ path: sheet });
  console.log(`[icons] review sheet: ${sheet}`);

  await browser.close();
} finally {
  server.close();
}

if (failures > 0) {
  console.error(`\n[icons] ${failures} check(s) failed.\n`);
  process.exit(1);
}
console.log("\n[icons] all icon checks passed. Open the review sheet to confirm legibility.\n");
