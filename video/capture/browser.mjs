// Abre o site de verdade (o build estático em out/) num Chromium com relógio
// virtual, servido no MESMO endereço de produção
// (https://ganwalk.github.io/portifolio/), interceptando as requisições. Isso
// importa por causa do Dezert Horse: o iframe dele (ganwalk.github.io/cavalo/)
// só é limpo e congelado pelo portfólio quando os dois dividem a origem,
// exatamente como no ar.
//
// O build precisa ter sido feito com o basePath de produção:
//   NEXT_PUBLIC_BASE_PATH=/portifolio npx next build

import { readFile, stat, mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { extname, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ORIGIN = "https://ganwalk.github.io";
export const SITE = `${ORIGIN}/portifolio`;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// O Chromium do Playwright não decodifica HEVC nem H.264: cada vídeo do site
// ganha uma cópia VP9 (ainda em .mp4, pra bater com o type das <source>).
async function playableVideo(file) {
  const out = join(root, "video", ".cache", "vp9", basename(file));
  if (!existsSync(out)) {
    await mkdir(dirname(out), { recursive: true });
    execFileSync("ffmpeg", ["-v", "error", "-y", "-i", file, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "30", "-row-mt", "1", "-deadline", "realtime", "-cpu-used", "8", out]);
  }
  return out;
}

async function serve(route, pathname) {
  let rel = decodeURIComponent(pathname.replace(/^\/portifolio/, "")) || "/";
  let file = join(root, "out", rel);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
  } catch {
    if (existsSync(`${file}.html`)) file = `${file}.html`;
  }
  try {
    if (extname(file) === ".mp4") file = await playableVideo(file);
    const body = await readFile(file);
    const type = TYPES[extname(file)] ?? "application/octet-stream";
    // Vídeo precisa de resposta parcial (206): sem suporte a Range o
    // Chromium não consegue buscar um instante, e o vídeo fica preso no 0.
    const range = route.request().headers()["range"];
    const match = range && /bytes=(\d*)-(\d*)/.exec(range);
    if (match) {
      const start = match[1] ? Number(match[1]) : 0;
      const end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
      await route.fulfill({
        status: 206,
        body: body.subarray(start, end + 1),
        headers: { "content-type": type, "accept-ranges": "bytes", "content-range": `bytes ${start}-${end}/${body.length}`, "content-length": String(end - start + 1) },
      });
      return;
    }
    await route.fulfill({ status: 200, body, headers: { "content-type": type, "accept-ranges": "bytes", "content-length": String(body.length) } });
  } catch {
    await route.fulfill({ status: 404, body: "" });
  }
}

async function remote(route) {
  const url = route.request().url();
  const key = createHash("sha1").update(url).digest("hex");
  const dir = join(root, "video", ".cache", "remote");
  const body = join(dir, key);
  const meta = `${body}.type`;
  try {
    if (!existsSync(body)) {
      await mkdir(dir, { recursive: true });
      const type = execFileSync("curl", ["-sSL", "--max-time", "60", "-o", body, "-w", "%{content_type}", url]).toString();
      await writeFile(meta, type);
    }
    const type = existsSync(meta) ? await readFile(meta, "utf8") : "application/octet-stream";
    await route.fulfill({ status: 200, body: await readFile(body), headers: { "content-type": type || "application/octet-stream" } });
  } catch {
    await route.fulfill({ status: 404, body: "" });
  }
}

export async function openSite({ width, height, scale = 1, colorScheme = "light" }) {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--font-render-hinting=none", "--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, colorScheme, reducedMotion: "no-preference" });
  await context.addInitScript({ path: join(root, "video", "capture", "timeshim.js") });
  // Fora do portfólio (o Dezert Horse em ganwalk.github.io/cavalo/), vem da rede de
  // verdade, buscado pelo curl (que já conhece o proxy do ambiente) e
  // guardado em disco: a segunda tomada não depende mais da rede.
  // Vale também pra qualquer CDN que o Dezert Horse carregue.
  await context.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(`${SITE}/`)) return serve(route, new URL(url).pathname);
    if (url.startsWith("http")) return remote(route);
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (err) => console.error("site:", err.message));
  return { browser, context, page };
}

/** Anda o relógio virtual de todos os frames (página e iframes) em `ms`. */
export async function step(page, ms) {
  await Promise.all(
    page.frames().map((frame) => frame.evaluate((d) => window.__vt && window.__vt.step(d), ms).catch(() => {})),
  );
}

/** Anda `seconds` de relógio virtual a 60Hz, dando folga real pra rede. */
export async function advance(page, seconds, realPauseMs = 4) {
  const steps = Math.round(seconds * 60);
  for (let i = 0; i < steps; i++) {
    await step(page, 1000 / 60);
    if (realPauseMs) await new Promise((r) => setTimeout(r, realPauseMs));
  }
}
