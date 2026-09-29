// Grava o Dezert Horse (cenário 3D em Three.js, github.com/ganwalk/cavalo)
// quadro a quadro, com relógio virtual: performance.now e Date.now ficam
// congelados e só andam 1/30s por quadro, então a animação sai lisa a 30fps
// mesmo renderizando WebGL por software (SwiftShader), que é lento demais
// pra gravar em tempo real.
//
// O site é servido a partir de um clone local do repositório; o resto
// (Three.js da jsDelivr, o modelo Horse.glb e o céu do threejs.org) é
// buscado por curl e entregue ao Chromium pela interceptação de rede, com
// cache em disco. O áudio é bloqueado: a peça tem trilha própria.
//
// Durante a gravação o painel do próprio site é mexido por código, como uma
// pessoa faria: velocidade do trote sobe, a lente fecha (o cavalo cresce no
// quadro), um pouco de alongamento surreal, e a câmera orbita devagar.
//
// Uso:
//   git clone --depth 1 https://github.com/ganwalk/cavalo ../cavalo
//   node video-demo/scripts/record-dezert-horse.mjs 1920 1080 dh169b ../cavalo
//   node video-demo/scripts/record-dezert-horse.mjs 1080 1920 dh916 ../cavalo
//   node video-demo/scripts/record-dezert-horse.mjs 1280 720 panel ../cavalo
//
// "panel" não grava a cena: espera o painel de controle abrir e salva só
// ele (media/dh-panel.png), o cartão que entra ao lado do deserto no 16:9.

import { chromium } from "playwright";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const [W, H] = [Number(process.argv[2]), Number(process.argv[3])];
const NAME = process.argv[4];
const SITE = resolve(process.argv[5] ?? "../cavalo", "index.htm");
const SECONDS = 11;
const PANEL = NAME === "panel";

const CACHE = fileURLToPath(new URL("../.cache/", import.meta.url));
const OUT = join(CACHE, "media", PANEL ? "" : NAME);
const NET = join(CACHE, "net");
mkdirSync(OUT, { recursive: true });
mkdirSync(NET, { recursive: true });

const executablePath = process.env.CHROMIUM_PATH || (existsSync("/opt/pw-browsers/chromium-1194/chrome-linux/chrome") ? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" : undefined);
const browser = await chromium.launch({
  executablePath,
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

await context.route("**/*", async (route) => {
  const url = route.request().url();
  if (url.startsWith("https://ganwalk.github.io/cavalo/")) return route.fulfill({ body: readFileSync(SITE), contentType: "text/html" });
  if (!url.startsWith("http")) return route.continue();
  if (/\.mp3|bandcamp|spotify|apple\.com|ffm\.to|instagram|analytics|googletagmanager/.test(url)) return route.abort();
  const file = join(NET, createHash("md5").update(url).digest("hex"));
  try {
    if (!existsSync(file)) {
      const head = execFileSync("curl", ["-sSL", "-A", "Mozilla/5.0", "-D", "-", "-o", file, url], { timeout: 60000 }).toString();
      writeFileSync(`${file}.ct`, [...head.matchAll(/content-type:\s*([^\r\n]+)/gi)].pop()?.[1] ?? "");
    }
    return route.fulfill({ body: readFileSync(file), contentType: readFileSync(`${file}.ct`, "utf8") || undefined, headers: { "access-control-allow-origin": "*" } });
  } catch {
    return route.abort();
  }
});

const page = await context.newPage();
page.on("pageerror", (e) => console.log("[erro]", e.message.slice(0, 200)));

// Relógio virtual: livre durante o carregamento, congelado a partir do
// clique em "iniciar", e daí só anda por __advance.
await page.addInitScript(() => {
  let v = 0;
  let live = true;
  const base = Date.parse("2026-09-29T20:00:00");
  const realNow = performance.now.bind(performance);
  const realDate = Date.now;
  performance.now = () => (live ? realNow() : v);
  Date.now = () => (live ? realDate() : base + v);
  window.__freeze = () => {
    v = realNow();
    live = false;
  };
  window.__advance = (ms) =>
    new Promise((r) => {
      v += ms;
      requestAnimationFrame(() => requestAnimationFrame(r));
    });
});

await page.goto("https://ganwalk.github.io/cavalo/", { waitUntil: "load", timeout: 120000 });
for (let i = 0; i < 120; i++) {
  await page.waitForTimeout(250);
  if (await page.evaluate(() => document.querySelector("#start-btn")?.style.display === "block")) break;
}

// Só a cena: navegação, HUD, dicas, popup e rodapé do site saem do quadro.
await page.addStyleTag({
  content: PANEL ? "#main-nav,#cam-tooltip,#presave-popup{display:none!important}" : "#main-nav,#hud,#hud-toggle-btn,#cam-tooltip,#presave-popup,.desktop-footer,.mobile-footer{display:none!important} *{cursor:none!important}",
});
await page.evaluate(() => {
  window.__freeze();
  document.querySelector("#start-btn").click();
});

const slider = (id, value) =>
  page.evaluate(([id, value]) => {
    const el = document.getElementById(id);
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, [id, value]);
const ease = (x) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);

if (PANEL) {
  for (let i = 0; i < 180; i++) await page.evaluate(() => window.__advance(1000 / 30));
  await page.waitForTimeout(1500);
  await page.locator("#hud").screenshot({ path: join(OUT, "dh-panel.png") });
  await browser.close();
  process.exit(0);
}

let dragging = false;
for (let f = 0; f < SECONDS * 30; f++) {
  const t = f / 30;
  // Depois do voo de entrada da câmera (~3,5s), o painel entra em ação.
  if (t > 3.5) {
    const k = ease(Math.max(0, Math.sin(Math.min(1, (t - 3.5) / 5) * Math.PI)));
    await slider("stretch-slider", Math.round(k * 28));
    await slider("fov-slider", Math.round(40 - k * 14));
    await slider("speed-slider", Math.round(100 + k * 40));
    const cx = W * 0.5;
    const cy = H * 0.55;
    if (!dragging) {
      await page.mouse.move(cx, cy);
      await page.mouse.down();
      dragging = true;
    }
    await page.mouse.move(cx - (t - 3.5) * Math.min(W, H) * 0.009, cy + Math.sin(t) * 6);
  }
  await page.evaluate(() => window.__advance(1000 / 30));
  await page.screenshot({ path: join(OUT, `${String(f + 1).padStart(4, "0")}.jpg`), type: "jpeg", quality: 90 });
  if (f % 30 === 0) console.log(NAME, f);
}

await browser.close();
