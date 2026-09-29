// Renderiza a composição (video-demo/composition) quadro a quadro num
// Chromium headless e entrega os quadros direto pro ffmpeg, com a trilha
// sonora por baixo. Cada quadro é pedido por tempo (renderAt(t)), então o
// resultado não depende da velocidade da máquina.
//
// Uso (ferramentas de bancada, fora do package.json, como os outros scripts):
//
//   npm install --no-save playwright @ffmpeg-installer/ffmpeg sharp
//   node video-demo/scripts/render.mjs --ar 16x9
//   node video-demo/scripts/render.mjs --ar 9x16
//
// Opções: --from/--to (segundos, pra renderizar um trecho), --stills 4,20.5
// (só salva PNGs desses instantes em .cache/stills), --no-audio.
//
// Pré requisitos: mídia em video-demo/.cache/media (prepare-media.mjs e
// record-dezert-horse.mjs) e a trilha em .cache/soundtrack.wav
// (soundtrack.mjs).

import { chromium } from "playwright";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const CACHE = join(ROOT, "video-demo/.cache");
const OUT_DIR = join(ROOT, "video-demo/out");

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith("--")) acc.push([a.slice(2), all[i + 1]?.startsWith("--") || all[i + 1] === undefined ? true : all[i + 1]]);
    return acc;
  }, []),
);
const AR = args.ar === "9x16" ? "9x16" : "16x9";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "");
  const file = join(ROOT, path);
  if (!file.startsWith(ROOT) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { "content-type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const port = server.address().port;

const executablePath = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined);
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: AR === "9x16" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
page.on("console", (m) => m.type() === "warning" && console.log("[página]", m.text()));
page.on("pageerror", (e) => console.log("[erro]", e.message));
await page.goto(`http://127.0.0.1:${port}/video-demo/composition/index.html?ar=${AR}&render`);
await page.waitForFunction(() => window.__comp);
const info = await page.evaluate(async () => {
  await window.__comp.ready;
  return { fps: window.__comp.FPS, duration: window.__comp.DURATION };
});

const grab = (t) =>
  page.evaluate(async (t) => {
    await window.__comp.renderAt(t);
    return document.getElementById("stage").toDataURL("image/jpeg", 0.95);
  }, t);

if (args.stills) {
  const dir = join(CACHE, "stills");
  mkdirSync(dir, { recursive: true });
  for (const s of String(args.stills).split(",")) {
    const t = Number(s);
    const png = await page.evaluate(async (t) => {
      await window.__comp.renderAt(t);
      return document.getElementById("stage").toDataURL("image/png");
    }, t);
    const file = join(dir, `${AR}-${t.toFixed(2)}.png`);
    writeFileSync(file, Buffer.from(png.split(",")[1], "base64"));
    console.log(file);
  }
} else {
  mkdirSync(OUT_DIR, { recursive: true });
  const from = Number(args.from ?? 0);
  const to = Number(args.to ?? info.duration);
  const audio = join(CACHE, "soundtrack.wav");
  const withAudio = !args["no-audio"] && existsSync(audio);
  const out = args.out ?? join(OUT_DIR, `armando-custodio-${AR}.mp4`);
  const ff = spawn(ffmpegPath.path, [
    "-hide_banner",
    "-loglevel", "warning",
    "-y",
    "-f", "image2pipe",
    "-framerate", String(info.fps),
    "-c:v", "mjpeg",
    "-i", "-",
    ...(withAudio ? ["-ss", String(from), "-t", String(to - from), "-i", audio] : []),
    "-c:v", "libx264",
    "-preset", "slow",
    "-crf", "19",
    "-pix_fmt", "yuv420p",
    "-profile:v", "high",
    "-movflags", "+faststart",
    ...(withAudio ? ["-c:a", "aac", "-b:a", "192k", "-shortest"] : []),
    out,
  ], { stdio: ["pipe", "inherit", "inherit"] });

  const total = Math.round((to - from) * info.fps);
  const started = Date.now();
  for (let f = 0; f < total; f++) {
    const t = from + f / info.fps;
    const url = await grab(t);
    const buf = Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 60 === 0) {
      const el = (Date.now() - started) / 1000;
      console.log(`${AR} ${f}/${total} (${t.toFixed(1)}s) ${el.toFixed(0)}s decorridos`);
    }
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(out);
}

await browser.close();
server.close();
