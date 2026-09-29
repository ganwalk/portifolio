// Captura um site publicado (o cenário 3D do Dezert Horse, o logotipo de
// partículas do Ganwalk) quadro a quadro, com relógio virtual:
// requestAnimationFrame, performance.now e Date.now passam a obedecer um tempo
// controlado daqui de fora, então cada quadro sai limpo, sem depender da
// velocidade da GPU emulada do headless.
import { createRequire } from "node:module";
const { chromium } = createRequire("/opt/node22/lib/node_modules/")("playwright");
import { mkdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

// O Chromium do container não confia na CA do proxy de saída, o curl confia:
// toda requisição do navegador é atendida pelo curl daqui de fora.
function viaCurl(url) {
  const out = execFileSync("curl", ["-sSL", "--compressed", "-D", "-", url], { maxBuffer: 1 << 28 });
  let cut = 0, headerText = "";
  // Pula blocos de cabeçalho de redirecionamento e de CONNECT.
  for (;;) {
    const end = out.indexOf("\r\n\r\n", cut);
    const block = out.subarray(cut, end).toString();
    cut = end + 4;
    headerText = block;
    if (!/^HTTP\/[\d.]+ (1\d\d|3\d\d)|Connection established/i.test(block)) break;
  }
  const status = +headerText.split(" ")[1] || 200;
  const type = /content-type:\s*([^\r\n]+)/i.exec(headerText)?.[1] ?? "application/octet-stream";
  return { status, body: out.subarray(cut), contentType: type };
}

//   node capture-site.mjs <url> <pasta> <largura> <altura> <segundos> <fps>
const [, , URL_ALVO, outDir, W = "1280", H = "720", SECONDS = "6", FPS = "30"] = process.argv;
mkdirSync(outDir, { recursive: true });

const clock = `
(() => {
  let now = 0;
  const realNow = performance.now.bind(performance);
  const t0Date = Date.now();
  const cbs = new Map(); let id = 0;
  performance.now = () => now;
  Date.now = () => t0Date + now;
  window.requestAnimationFrame = (cb) => { id += 1; cbs.set(id, cb); return id; };
  window.cancelAnimationFrame = (i) => cbs.delete(i);
  window.__free = true;
  // Antes da captura, o tempo corre de verdade (carregamento, botão de início).
  const pump = () => { if (!window.__free) return; now = realNow(); const list = [...cbs]; cbs.clear(); for (const [,cb] of list) { try { cb(now); } catch (e) {} } setTimeout(pump, 16); };
  window.__pump = pump;
  pump();
  window.__step = (ms) => { window.__free = false; now += ms; const list = [...cbs]; cbs.clear(); for (const [,cb] of list) { try { cb(now); } catch (e) { console.error(e); } } };
})();`;

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--mute-audio"],
});
const page = await browser.newPage({ viewport: { width: +W, height: +H } });
await page.addInitScript(clock);
await page.route("**/*", async (route) => {
  const url = route.request().url();
  if (!url.startsWith("http")) return route.continue();
  // Áudio não entra no vídeo e é o que mais demora pra baixar.
  if (!process.env.AUDIO && /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(url)) return route.abort();
  try { await route.fulfill(viaCurl(url)); } catch (e) { console.log("falhou", url); await route.abort(); }
});
page.on("console", (m) => m.type() === "error" && console.log("[page]", m.text()));
await page.goto(URL_ALVO, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(3000);
await page.addStyleTag({ content: "#main-nav,#hud,#hud-toggle-btn,#cam-tooltip,#presave-popup{display:none!important}" });
const start = await page.$("#start-btn");
if (start) { await start.click({ force: true }).catch(() => {}); }
await page.waitForTimeout(+(process.env.WARM ?? 20000));
console.log(await page.evaluate(() => [...document.querySelectorAll("canvas")].map((c) => c.id + ":" + c.width + "x" + c.height + ":" + getComputedStyle(c).opacity)));
await page.addStyleTag({ content: "#main-nav,#hud,#hud-toggle-btn,#cam-tooltip,#presave-popup{display:none!important}" });
// CLICK=1 clica no centro da tela depois do aquecimento (entrada de sites
// com tela de "clique para começar"), e dá mais WARM pra cena assentar.
// START_SEL clica num elemento específico; EVAL roda um trecho no site
// (trocar de experiência, por exemplo).
if (process.env.START_SEL) {
  await page.click(process.env.START_SEL, { force: true, timeout: 60000 }).catch((e) => console.log("clique falhou", e.message));
  await page.waitForTimeout(3000);
}
if (process.env.EVAL) {
  await page.evaluate(process.env.EVAL).catch((e) => console.log("eval falhou", e.message));
  await page.waitForTimeout(+(process.env.WARM ?? 20000));
}
if (process.env.CLICK) {
  await page.mouse.click(+W / 2, +H / 2);
  await page.waitForTimeout(+(process.env.WARM ?? 20000));
}
// Diagnóstico: SHOT=1 salva uma captura da página inteira antes de gravar.
if (process.env.SHOT) await page.screenshot({ path: `${outDir}/pagina.jpg`, timeout: 180000 });
// CANVAS escolhe qual canvas gravar quando o site tem mais de um.
const CANVAS = process.env.CANVAS ?? "canvas";
const total = +SECONDS * +FPS;
// DRAG="x,y" arrasta a partir desse ponto (fração da tela) durante a
// gravação, num arco lento: a interação de verdade do site, não simulada.
const drag = process.env.DRAG?.split(",").map(Number);
if (drag) {
  await page.mouse.move(drag[0] * +W, drag[1] * +H);
  await page.mouse.down();
}
for (let i = 0; i < total; i++) {
  if (drag) {
    const a = (i / total) * Math.PI * 2;
    await page.mouse.move(drag[0] * +W + Math.sin(a) * +W * 0.12 + (i / total) * +W * 0.1, drag[1] * +H + Math.sin(a * 2) * +H * 0.05);
  }
  // Lê o canvas na mesma tarefa do render: o buffer ainda está íntegro,
  // sem precisar de preserveDrawingBuffer nem de screenshot (lento demais
  // no WebGL emulado).
  const data = await page.evaluate(([ms, sel]) => {
    window.__step(ms);
    const src = document.querySelector(sel);
    // Canvas transparente: achata sobre a cor de fundo da página.
    const flat = document.createElement("canvas");
    flat.width = src.width;
    flat.height = src.height;
    const fctx = flat.getContext("2d");
    fctx.fillStyle = getComputedStyle(document.body).backgroundColor || "#000";
    fctx.fillRect(0, 0, flat.width, flat.height);
    fctx.drawImage(src, 0, 0);
    return flat.toDataURL("image/jpeg", 0.93);
  }, [1000 / +FPS, CANVAS]);
  writeFileSync(`${outDir}/${String(i).padStart(4, "0")}.jpg`, Buffer.from(data.split(",")[1], "base64"));
  if (i % 30 === 0) console.log("quadro", i);
}
if (drag) await page.mouse.up();
// OVERLAY=1: a interface em HTML por cima do canvas (logotipo, painel,
// navegação) sai numa camada transparente à parte, pra composição pôr por
// cima de cada quadro.
if (process.env.OVERLAY) {
  // HIDE: seletores que ficam de fora da camada (painéis, navegação).
  const hide = process.env.HIDE ? `${process.env.HIDE}{visibility:hidden!important}` : "";
  await page.addStyleTag({ content: `html,body{background:transparent!important} canvas{visibility:hidden!important} ${hide}` });
  await page.evaluate(() => { window.__free = true; window.__pump(); });
  await page.screenshot({ path: `${outDir}/camada.png`, omitBackground: true, timeout: 240000 });
}
await browser.close();
