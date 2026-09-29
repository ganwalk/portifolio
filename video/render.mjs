// Renderiza o reel quadro a quadro e entrega cada PNG direto no ffmpeg.
//
//   node video/prepare-media.mjs          (uma vez: extrai as prévias)
//   node video/render.mjs landscape       (1920×1080 → video/out/reel-16x9.mp4)
//   node video/render.mjs portrait        (1080×1920 → video/out/reel-9x16.mp4)
//   node video/render.mjs landscape --stills 3,6,12   (só PNGs desses segundos)
//
// Precisa de playwright-core (npm i --no-save playwright-core) e ffmpeg no
// PATH. CHROMIUM_PATH aponta pro executável do Chromium, se não estiver no
// lugar padrão do Playwright.

import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const format = process.argv[2] === "portrait" ? "portrait" : "landscape";
const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > -1 ? process.argv[stillsArg + 1].split(",").map(Number) : null;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".json": "application/json",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
  try {
    const body = await readFile(join(root, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((resolve) => server.listen(0, resolve));
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ["--font-render-hinting=none", "--disable-lcd-text"],
});
const size = format === "portrait" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };
const page = await browser.newPage({ viewport: size, deviceScaleFactor: 1 });
page.on("pageerror", (err) => console.error("página:", err.message));
await page.goto(`http://localhost:${port}/video/composition.html?f=${format}`);
await page.evaluate(() => window.ready);
const meta = await page.evaluate(() => window.meta);
console.log("duração", meta.DURATION.toFixed(2), "s,", meta.frames, "quadros");
const stage = await page.$("#stage");

const out = join(root, "video", "out");
await mkdir(out, { recursive: true });

if (stills) {
  for (const second of stills) {
    const frame = Math.round(second * meta.FPS);
    await page.evaluate((f) => window.renderAt(f), frame);
    const file = join(out, `still-${format}-${String(second).replace(".", "_")}.png`);
    await writeFile(file, await stage.screenshot({ type: "png" }));
    console.log(file);
  }
} else {
  const name = format === "portrait" ? "reel-9x16.mp4" : "reel-16x9.mp4";
  const ffmpeg = spawn(
    "ffmpeg",
    [
      "-v", "error", "-y",
      "-f", "image2pipe", "-framerate", String(meta.FPS), "-c:v", "png", "-i", "-",
      "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-tune", "grain",
      "-pix_fmt", "yuv420p", "-movflags", "+faststart",
      join(out, name),
    ],
    { stdio: ["pipe", "inherit", "inherit"] },
  );
  const started = Date.now();
  for (let f = 0; f < meta.frames; f++) {
    await page.evaluate((n) => window.renderAt(n), f);
    const png = await stage.screenshot({ type: "png" });
    if (!ffmpeg.stdin.write(png)) await new Promise((r) => ffmpeg.stdin.once("drain", r));
    if (f % 60 === 0) console.log(`${format}: ${f}/${meta.frames} (${((Date.now() - started) / 1000).toFixed(0)}s)`);
  }
  ffmpeg.stdin.end();
  await new Promise((resolve) => ffmpeg.on("close", resolve));
  console.log(join(out, name));
}

await browser.close();
server.close();
