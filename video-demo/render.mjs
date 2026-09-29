// Exporta a composição quadro a quadro e entrega os quadros direto ao ffmpeg.
//
//   node render.mjs h                 16:9, vídeo inteiro
//   node render.mjs v                 9:16, vídeo inteiro
//   node render.mjs h --stills 1,12   só alguns quadros em PNG, pra revisar
//
// Um servidor estático local serve a raiz do repositório: a composição lê
// fontes, fotos e quadros extraídos por caminho relativo, e pelo http o
// canvas não fica "sujo" (file:// bloquearia o toDataURL).
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "..");
const format = process.argv[2] === "v" ? "v" : "h";
const stillsArg = process.argv.indexOf("--stills");
const stills = stillsArg > 0 ? process.argv[stillsArg + 1].split(",").map(Number) : null;
const FPS = 30;

const TYPES = { ".html": "text/html", ".js": "text/javascript", ".woff2": "font/woff2", ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };
const server = createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname));
    const body = await readFile(join(root, path));
    res.writeHead(200, { "content-type": TYPES[extname(path)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, r));
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: format === "v" ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
page.on("console", (m) => m.type() === "error" && console.log("[página]", m.text()));
await page.goto(`http://127.0.0.1:${port}/video-demo/composicao/index.html?f=${format}`);
await page.evaluate(() => window.ready);
const total = await page.evaluate(() => window.TOTAL);

const outDir = join(here, "saida");
await mkdir(outDir, { recursive: true });

if (stills) {
  for (const s of stills) {
    const data = await page.evaluate((t) => window.renderFrame(t), s);
    const file = join(outDir, `still-${format}-${String(s).replace(".", "_")}.png`);
    await writeFile(file, Buffer.from(data.split(",")[1], "base64"));
    console.log(file);
  }
} else {
  const name = format === "v" ? "armando-custodio-demo-9x16.mp4" : "armando-custodio-demo-16x9.mp4";
  const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", join(outDir, name)], { stdio: ["pipe", "inherit", "inherit"] });
  const frames = Math.round(total * FPS);
  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const data = await page.evaluate((t) => window.renderFrame(t), i / FPS);
    const buf = Buffer.from(data.split(",")[1], "base64");
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
    if (i % 60 === 0) console.log(`${format} ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log(join(outDir, name));
}
await browser.close();
server.close();
