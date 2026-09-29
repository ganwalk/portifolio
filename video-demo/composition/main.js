// Composição do vídeo demonstração. Tudo é desenhado num canvas só, e cada
// quadro é uma função pura do tempo (renderAt(t)): nenhum estado acumula
// entre quadros, então o render quadro a quadro (scripts/render.mjs) e a
// prévia ao vivo no navegador mostram exatamente a mesma coisa.
//
// ?ar=16x9 (padrão) ou ?ar=9x16. Mesma peça, dois enquadramentos: cada cena
// decide o próprio layout olhando `V` (vertical).
//
// Os artefatos são os do site, reconstruídos aqui, não gravados dele:
// retículo de Bayer (src/lib/dither.ts), retrato em folha de sprite
// (src/lib/portrait-frames.ts), lente de inversão com lupa no nome
// (Hero/HeroTitleGL), arte ASCII "ganwalk" (GanwalkAsciiVideo.tsx), grade
// que se distorce sob o ponteiro (InteractiveGridImage.tsx) e a cortina de
// faixas (StripeCurtain.tsx). As prévias dos projetos são mídia real.

import { FPS, SCENES, TRANSITIONS, DURATION, CURTAIN, CURTAIN_COVER } from "./timeline.js";

const params = new URLSearchParams(location.search);
const V = params.get("ar") === "9x16";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
const G = V ? 72 : 110; // gutter

const PAPER = "#fafafa";
const INK = "#111111";
const MUTED = "#737373";

const INKTRAP = '"Whyte Inktrap", "Archivo", sans-serif';
const MONO = '"Plex Mono", "DejaVu Sans Mono", monospace';
const SWITZER = '"Switzer", "Archivo", sans-serif';
const SANS = '"Archivo", "Liberation Sans", sans-serif';

const MEDIA = "/video-demo/.cache/media";
const PUB = "/public";

const canvas = document.getElementById("stage");
canvas.width = W;
canvas.height = H;
const main = canvas.getContext("2d", { willReadFrequently: true });

// ---------------------------------------------------------------- utilidades

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const easeOutCubic = (x) => 1 - Math.pow(1 - x, 3);
const easeInOutCubic = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const easeInOutSine = (x) => -(Math.cos(Math.PI * x) - 1) / 2;

function mulberry(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// ------------------------------------------------------------------- imagens
// get() devolve a imagem se já decodificada, ou null e registra a pendência;
// renderAt redesenha depois de carregar o que faltou. Assim cada cena escreve
// desenho síncrono e o render continua determinístico.

const images = new Map();
const pending = new Set();

function load(url) {
  if (!images.has(url)) {
    const img = new Image();
    const p = new Promise((res) => {
      img.onload = () => img.decode().then(res, res);
      img.onerror = () => {
        console.warn("falhou", url);
        res();
      };
    });
    img.src = url;
    images.set(url, { img, p, ok: false });
    p.then(() => (images.get(url).ok = img.naturalWidth > 0));
  }
  return images.get(url);
}

function get(url) {
  const e = load(url);
  if (e.ok) return e.img;
  pending.add(e.p);
  return null;
}

// Quadro de uma sequência extraída (ffmpeg numera a partir de 1).
function clip(name, t, count, { loop = false, rate = 1, offset = 0 } = {}) {
  let i = Math.floor((t * rate + offset) * FPS);
  i = loop ? ((i % count) + count) % count : clamp(i, 0, count - 1);
  return get(`${MEDIA}/${name}/${String(i + 1).padStart(4, "0")}.jpg`);
}

function drawCover(ctx, img, x, y, w, h, ax = 0.5, ay = 0.5, zoom = 1) {
  if (!img) return;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s;
  const dh = ih * s;
  ctx.drawImage(img, x + (w - dw) * ax, y + (h - dh) * ay, dw, dh);
}

// --------------------------------------------------------------------- texto

function font(ctx, family, size, weight = 400, style = "normal") {
  ctx.font = `${style} ${weight} ${size}px ${family}`;
}

function text(ctx, str, x, y, { family = SANS, size = 24, weight = 400, style = "normal", color = INK, ls = 0, align = "left", baseline = "alphabetic", alpha = 1 } = {}) {
  ctx.save();
  font(ctx, family, size, weight, style);
  ctx.letterSpacing = `${ls}px`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillStyle = color;
  ctx.globalAlpha *= alpha;
  ctx.fillText(str, x, y);
  ctx.restore();
}

function measure(ctx, str, family, size, weight = 400, ls = 0, style = "normal") {
  ctx.save();
  font(ctx, family, size, weight, style);
  ctx.letterSpacing = `${ls}px`;
  const w = ctx.measureText(str).width;
  ctx.restore();
  return w;
}

function wrap(ctx, str, maxW, family, size, weight, ls = 0) {
  const words = str.split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (line && measure(ctx, next, family, size, weight, ls) > maxW) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// Maior corpo que cabe na largura (usado pro nome da hero e títulos longos).
function fit(ctx, lines, maxW, family, weight, ls, max) {
  let size = max;
  for (const l of lines) {
    const w = measure(ctx, l, family, size, weight, ls * size);
    if (w > maxW) size = (size * maxW) / w;
  }
  return Math.floor(size);
}

// Linhas que sobem por trás de uma máscara, uma de cada vez (o mesmo gesto
// do Reveal.tsx do site).
function revealLines(ctx, lines, x, y, { size, lh = 0.95, family = INKTRAP, weight = 900, color = "#fff", ls = 0, t, t0, stagger = 0.08, dur = 0.9, align = "left" }) {
  lines.forEach((line, i) => {
    const p = easeOutExpo(prog(t, t0 + i * stagger, t0 + i * stagger + dur));
    if (p <= 0) return;
    const top = y + i * size * lh;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, top - size * 0.12, W, size * 1.08);
    ctx.clip();
    text(ctx, line, x, top + (1 - p) * size * 1.05, { family, size, weight, color, ls: ls * size, align, baseline: "top" });
    ctx.restore();
  });
  return y + lines.length * size * lh;
}

// Legenda técnica abaixo do título: mono, caixa alta, espaçada. Quebra por
// item (os bullets "·"), não por palavra, pra nenhum item partir no meio.
function caption(ctx, str, x, y, maxW, { t, t0, color = "rgba(255,255,255,0.72)", size = V ? 25 : 23, align = "left" }) {
  const items = str.split(" · ");
  const lines = [];
  let line = "";
  for (const it of items) {
    const next = line ? `${line} · ${it}` : it;
    if (line && measure(ctx, next, MONO, size, 500, size * 0.12) > maxW) {
      lines.push(line);
      line = it;
    } else line = next;
  }
  if (line) lines.push(line);
  lines.forEach((l, i) => {
    const p = easeOutCubic(prog(t, t0 + i * 0.1, t0 + i * 0.1 + 0.6));
    text(ctx, l, x, y + i * size * 1.7 + (1 - p) * 12, { family: MONO, size, weight: 500, color, ls: size * 0.12, alpha: p, align, baseline: "top" });
  });
  return y + lines.length * size * 1.7;
}

function typed(str, t, t0, t1) {
  const n = Math.floor(str.length * prog(t, t0, t1));
  return str.slice(0, n);
}

// --------------------------------------------------------------------- grão
// Grão de filme (.texture-noise-animate do site): três ladrilhos de ruído
// fixos, sorteados e deslocados a cada quadro.

const GRAIN = [0, 1, 2].map((k) => {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  const d = g.createImageData(256, 256);
  const r = mulberry(99 + k);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = r() * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  return c;
});

function grain(ctx, t, alpha) {
  const f = Math.floor(t * 24);
  const r = mulberry(f * 7919);
  const tile = GRAIN[((f % 3) + 3) % 3];
  ctx.save();
  ctx.globalAlpha = alpha;
  const pat = ctx.createPattern(tile, "repeat");
  ctx.translate(-r() * 256, -r() * 256);
  ctx.fillStyle = pat;
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

// -------------------------------------------------------------------- Bayer

function buildBayer(size) {
  let m = [0];
  let s = 1;
  while (s < size) {
    const n = s * 2;
    const g = new Array(n * n);
    for (let y = 0; y < s; y++)
      for (let x = 0; x < s; x++) {
        const v = m[y * s + x];
        g[y * n + x] = 4 * v;
        g[y * n + x + s] = 4 * v + 2;
        g[(y + s) * n + x] = 4 * v + 3;
        g[(y + s) * n + x + s] = 4 * v + 1;
      }
    m = g;
    s = n;
  }
  return m;
}
const BAYER = buildBayer(8);

// Retículo de Bayer por cima de uma fonte (imagem, vídeo ou canvas), no
// mesmo modelo de dither.ts: cor original onde a luminância passa do
// limiar, preto no resto. `reveal` (0 a 1) abre células em ordem de Bayer,
// deixando a fonte limpa aparecer por baixo: o dissolver do hover.
const ditherSmall = makeCanvas(8, 8);
function dither(ctx, src, x, y, w, h, { cell = 7, phase = 0, bias = 38, reveal = 0, ax = 0.5, ay = 0.5 } = {}) {
  if (!src) return;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  drawCover(ctx, src, x, y, w, h, ax, ay);
  if (reveal < 1) {
    const sw = Math.ceil(w / cell);
    const sh = Math.ceil(h / cell);
    ditherSmall.width = sw;
    ditherSmall.height = sh;
    const g = ditherSmall.getContext("2d", { willReadFrequently: true });
    drawCover(g, src, 0, 0, sw, sh, ax, ay);
    const d = g.getImageData(0, 0, sw, sh);
    const px = phase % 8;
    const py = Math.floor(phase / 8) % 8;
    for (let j = 0; j < sh; j++)
      for (let i = 0; i < sw; i++) {
        const k = (j * sw + i) * 4;
        const b = BAYER[((j + py) % 8) * 8 + ((i + px) % 8)];
        if (b / 64 < reveal) {
          d.data[k + 3] = 0;
          continue;
        }
        const lum = 0.299 * d.data[k] + 0.587 * d.data[k + 1] + 0.114 * d.data[k + 2];
        const thr = ((b + 0.5) / 64) * 255 + bias;
        if (lum < thr) d.data[k] = d.data[k + 1] = d.data[k + 2] = 0;
        d.data[k + 3] = 255;
      }
    g.putImageData(d, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(ditherSmall, 0, 0, sw, sh, x, y, sw * cell, sh * cell);
  }
  ctx.restore();
}

// Máscara de Bayer em tela cheia: dissolve a cena B por cima da A.
const maskSmall = makeCanvas(8, 8);
function bayerMix(ctx, a, b, p, cell = 18) {
  const sw = Math.ceil(W / cell);
  const sh = Math.ceil(H / cell);
  maskSmall.width = sw;
  maskSmall.height = sh;
  const g = maskSmall.getContext("2d");
  const d = g.createImageData(sw, sh);
  for (let j = 0; j < sh; j++)
    for (let i = 0; i < sw; i++) {
      const v = BAYER[(j % 8) * 8 + (i % 8)] / 64;
      // Um leve gradiente diagonal faz o dissolver varrer a tela em vez de
      // acender tudo de uma vez.
      const sweep = (i / sw) * 0.35 + (j / sh) * 0.15;
      d.data[(j * sw + i) * 4 + 3] = v * 0.5 + sweep < p * 1.5 ? 255 : 0;
    }
  g.putImageData(d, 0, 0);
  ctx.drawImage(a, 0, 0);
  const tmp = scratch(2);
  const tg = tmp.getContext("2d");
  tg.globalCompositeOperation = "source-over";
  tg.clearRect(0, 0, W, H);
  tg.drawImage(b, 0, 0);
  tg.globalCompositeOperation = "destination-in";
  tg.imageSmoothingEnabled = false;
  tg.drawImage(maskSmall, 0, 0, sw * cell, sh * cell);
  tg.globalCompositeOperation = "source-over";
  ctx.drawImage(tmp, 0, 0);
}

const scratchPool = [];
function scratch(i) {
  if (!scratchPool[i]) scratchPool[i] = makeCanvas(W, H);
  return scratchPool[i];
}

// ------------------------------------------------------------------- cursor
// Os mesmos cursores desenhados à mão do site (public/cursor).

const CURSOR = {
  rest: `${PUB}/cursor/repouso.webp`,
  hover: `${PUB}/cursor/hover.webp`,
  click: `${PUB}/cursor/clique.webp`,
};

function drawCursor(ctx, x, y, state = "rest", alpha = 1) {
  const img = get(CURSOR[state]);
  if (!img || alpha <= 0) return;
  const s = 1.45;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x - 5 * s, y - 3 * s, img.naturalWidth * s, img.naturalHeight * s);
  ctx.restore();
}

// Caminho do cursor: chaves {t, x, y} em fração da tela, interpoladas com
// ease in out entre uma chave e a próxima.
function path(keys, t) {
  if (t <= keys[0].t) return { x: keys[0].x * W, y: keys[0].y * H };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (t <= b.t) {
      const k = easeInOutSine(prog(t, a.t, b.t));
      return { x: lerp(a.x, b.x, k) * W, y: lerp(a.y, b.y, k) * H };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l.x * W, y: l.y * H };
}

// ------------------------------------------------------------ lente da hero
// Lupa convexa (o nome "incha" sob o cursor, HeroTitleGL) seguida da
// inversão de tinta e papel com borda difusa.

function lens(ctx, cx, cy, R) {
  if (R < 2) return;
  const x0 = Math.max(0, Math.floor(cx - R));
  const y0 = Math.max(0, Math.floor(cy - R));
  const x1 = Math.min(W, Math.ceil(cx + R));
  const y1 = Math.min(H, Math.ceil(cy + R));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w <= 0 || h <= 0) return;
  const src = ctx.getImageData(x0, y0, w, h);
  const out = ctx.createImageData(w, h);
  const sig = R * 0.42;
  const A = 0.3;
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const dx = x0 + i - cx;
      const dy = y0 + j - cy;
      const s = 1 - A * Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
      const sx = clamp(Math.round(cx + dx * s - x0), 0, w - 1);
      const sy = clamp(Math.round(cy + dy * s - y0), 0, h - 1);
      const k = (j * w + i) * 4;
      const q = (sy * w + sx) * 4;
      out.data[k] = src.data[q];
      out.data[k + 1] = src.data[q + 1];
      out.data[k + 2] = src.data[q + 2];
      out.data[k + 3] = 255;
    }
  ctx.putImageData(out, x0, y0);
  ctx.save();
  ctx.globalCompositeOperation = "difference";
  const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.55, "rgba(255,255,255,1)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(x0, y0, w, h);
  ctx.restore();
}

// ------------------------------------------------------------------ retrato
// Folha de sprite 4×4 da hero: quadros 1 a 12 giram a cabeça, 13 a 16 são as
// quatro expressões, cada uma no fim de um ciclo (portrait-frames.ts).

const SPRITE = `${PUB}/frames/eu-lg.webp`;
const FRAME_S = 0.085;
const ENDING_S = 0.7;
const CYCLE_S = 12 * FRAME_S + ENDING_S;

function portraitFrame(t) {
  const c = Math.floor(t / CYCLE_S);
  const lt = t - c * CYCLE_S;
  if (lt >= 12 * FRAME_S) return { frame: 13 + (c % 4), tick: c + 1 };
  return { frame: 1 + Math.floor(lt / FRAME_S), tick: c };
}

function drawPortrait(ctx, frame, x, y, h) {
  const img = get(SPRITE);
  if (!img) return;
  const tw = img.naturalWidth / 4;
  const th = img.naturalHeight / 4;
  const i = frame - 1;
  const w = (h * tw) / th;
  ctx.drawImage(img, (i % 4) * tw, Math.floor(i / 4) * th, tw, th, x, y, w, h);
  return w;
}

// ------------------------------------------------------------ bloco padrão
// Título grande (Whyte Inktrap) e, embaixo dele, a legenda técnica em mono.
// Sem rótulo pequeno acima do título: a cena abre direto no que importa.

function titleBlock(ctx, title, cap, t, { dark = true, t0 = 0.35, maxW, bottom, size } = {}) {
  const color = dark ? "#ffffff" : INK;
  const capColor = dark ? "rgba(255,255,255,0.72)" : MUTED;
  maxW = maxW ?? (V ? W - G * 2 : 1180);
  size = size ?? (V ? 96 : 100);
  const lines = wrap(ctx, title, maxW, INKTRAP, size, 900, size * 0.01);
  const capSize = V ? 25 : 23;
  const capLines = Math.ceil(measure(ctx, cap, MONO, capSize, 500, capSize * 0.12) / maxW) + (V ? 1 : 0);
  const blockH = lines.length * size * 0.95 + 34 + capLines * capSize * 1.7;
  const top = (bottom ?? H - (V ? 150 : 110)) - blockH;
  const after = revealLines(ctx, lines, G, top, { size, color, ls: 0.01, t, t0 });
  caption(ctx, cap, G, after + 30, maxW, { t, t0: t0 + 0.45, color: capColor });
  return top;
}

// Escurece a base (ou o lado) da mídia pra o texto ler por cima dela.
function shade(ctx, strength = 0.85) {
  const g = V ? ctx.createLinearGradient(0, H * 0.35, 0, H) : ctx.createLinearGradient(0, H * 0.25, 0, H);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(0.55, `rgba(0,0,0,${strength * 0.6})`);
  g.addColorStop(1, `rgba(0,0,0,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!V) {
    const s = ctx.createLinearGradient(0, 0, W * 0.7, 0);
    s.addColorStop(0, `rgba(0,0,0,${strength * 0.45})`);
    s.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = s;
    ctx.fillRect(0, 0, W, H);
  }
}

// Seis pontos no canto, como os do carrossel de cases da home: onde a
// pessoa está entre as seis soluções.
function dots(ctx, index, dark = true) {
  const r = 6;
  const gap = 22;
  const x0 = W - G - 5 * gap;
  const y = V ? 110 : 90;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.arc(x0 + i * gap, y, i === index ? r : r * 0.75, 0, Math.PI * 2);
    ctx.fillStyle = dark ? (i === index ? "#fff" : "rgba(255,255,255,0.35)") : i === index ? INK : "rgba(17,17,17,0.25)";
    ctx.fill();
  }
}

function metricRow(ctx, metrics, x, y, t, t0, { dark = true, size = V ? 92 : 88, gap = V ? 60 : 80, maxW, right = false } = {}) {
  const widths = metrics.map((m) => Math.max(measure(ctx, `${m.prefix ?? ""}${m.to}${m.suffix ?? ""}`, INKTRAP, size, 900, size * 0.01), measure(ctx, m.label, MONO, 20, 500, 2.4), maxW ?? 0));
  let cx = right ? W - G - widths.reduce((a, b) => a + b, 0) - gap * (metrics.length - 1) : x;
  metrics.forEach((m, i) => {
    const p = easeOutCubic(prog(t, t0 + i * 0.15, t0 + i * 0.15 + 1.3));
    const v = Math.round(m.to * p);
    const str = `${m.prefix ?? ""}${v}${m.suffix ?? ""}`;
    const a = clamp(prog(t, t0 + i * 0.15, t0 + i * 0.15 + 0.3));
    text(ctx, str, cx, y, { family: INKTRAP, size, weight: 900, color: dark ? "#fff" : INK, baseline: "top", alpha: a, ls: size * 0.01 });
    text(ctx, m.label, cx, y + size * 1.02, { family: MONO, size: 20, weight: 500, color: dark ? "rgba(255,255,255,0.72)" : MUTED, baseline: "top", ls: 2.4, alpha: a });
    cx += widths[i] + gap;
  });
}

// ==================================================================== cenas

const SCENE = {};

// 00 · abertura: preto, uma frase digitada em mono, no mesmo tom do balão
// "eu ODEIO animações!" do cabeçalho do site.
SCENE.intro = (ctx, t) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const size = V ? 44 : 46;
  const l1 = typed("você tem uma ideia.", t, 0.35, 1.25);
  const l2 = typed("eu faço ela existir na tela.", t, 1.55, 2.55);
  const cx = V ? G : W / 2 - 400;
  const cy = H / 2 - size;
  text(ctx, l1, cx, cy, { family: MONO, size, weight: 400, color: "#fff" });
  text(ctx, l2, cx, cy + size * 1.6, { family: MONO, size, weight: 400, color: "#fff" });
  // Caret piscando no fim da linha ativa.
  const on = Math.floor(t * 2.2) % 2 === 0;
  if (on) {
    const active = t < 1.45 ? l1 : l2;
    const ly = t < 1.45 ? cy : cy + size * 1.6;
    const w = measure(ctx, active, MONO, size, 400);
    ctx.fillStyle = "#fff";
    ctx.fillRect(cx + w + 6, ly - size * 0.8, size * 0.55, size * 0.95);
  }
  grain(ctx, t, 0.07);
};

// 01 · hero: o nome, o retrato girando, a roleta "Designer de" e a lente.
const WORDS = ["produtos", "experiências", "aplicativos", "interfaces", "sistemas", "músicas", "sonhos"];

const HERO_CURSOR = [
  { t: 0.6, x: 1.08, y: 0.95 },
  { t: 1.6, x: V ? 0.3 : 0.2, y: V ? 0.1 : 0.25 },
  { t: 2.7, x: V ? 0.72 : 0.42, y: V ? 0.12 : 0.24 },
  { t: 3.6, x: V ? 0.4 : 0.3, y: V ? 0.16 : 0.42 },
  { t: 4.5, x: V ? 0.62 : 0.5, y: V ? 0.15 : 0.4 },
  { t: 5.5, x: V ? 0.52 : 0.1, y: V ? 0.855 : 0.83 },
];

SCENE.hero = (ctx, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Barra do topo com a assinatura e o fio, como o cabeçalho do site.
  const barH = V ? 120 : 84;
  text(ctx, "ARMANDO CUSTODIO", G, barH / 2 + 2, { family: INKTRAP, size: V ? 30 : 24, weight: 900, color: INK, baseline: "middle", ls: 0.6 });
  ctx.fillStyle = "rgba(17,17,17,0.12)";
  ctx.fillRect(0, barH, W, 1.5);

  const { frame, tick } = portraitFrame(Math.max(0, t - 0.2));

  // Retrato.
  const pH = V ? 900 : 700;
  const pW = (pH * 640) / 719;
  const pX = V ? (W - pW) / 2 : W - G - pW + 30;
  const pY = V ? 640 : 210;
  const pa = easeOutCubic(prog(t, 0.1, 0.8));
  ctx.save();
  ctx.globalAlpha = pa;
  drawPortrait(ctx, frame, pX, pY + (1 - pa) * 30, pH);
  ctx.restore();

  // Nome.
  const lines = ["ARMANDO", "CUSTODIO"];
  const size = fit(ctx, lines, V ? W - G * 2 : 1240, INKTRAP, 900, 0.015, V ? 230 : 235);
  const nameTop = V ? 190 : 200;
  const after = revealLines(ctx, lines, V ? W / 2 : G, nameTop, { size, lh: 0.86, color: INK, ls: 0.015, t, t0: 0.15, align: V ? "center" : "left", stagger: 0.1, dur: 1.1 });

  // Roleta: a palavra troca junto com a expressão do retrato.
  const subSize = V ? 64 : 72;
  const subY = after + (V ? 40 : 56);
  const prefix = "Designer de";
  const word = WORDS[tick % WORDS.length];
  const prev = WORDS[(tick + WORDS.length - 1) % WORDS.length];
  const changeAt = tick === 0 ? -1 : 0.2 + (tick - 1) * CYCLE_S + 12 * FRAME_S;
  const k = tick === 0 ? 1 : easeOutExpo(prog(t, changeAt, changeAt + 0.45));
  const sa = easeOutCubic(prog(t, 0.7, 1.3));
  const pw = measure(ctx, prefix, SWITZER, subSize, 400, -subSize * 0.02, "italic") + subSize * 0.26;
  const ww = measure(ctx, word, SWITZER, subSize, 400, 0, "italic");
  const sx = V ? W / 2 - (pw + ww) / 2 : G;
  text(ctx, prefix, sx, subY, { family: SWITZER, size: subSize, style: "italic", color: MUTED, baseline: "top", alpha: sa, ls: -subSize * 0.02 });
  ctx.save();
  ctx.beginPath();
  ctx.rect(sx + pw - 4, subY - subSize * 0.15, 900, subSize * 1.35);
  ctx.clip();
  if (k < 1) text(ctx, prev, sx + pw, subY - k * subSize * 1.2, { family: SWITZER, size: subSize, style: "italic", color: MUTED, baseline: "top", alpha: sa * (1 - k), ls: -subSize * 0.02 });
  text(ctx, word, sx + pw, subY + (1 - k) * subSize * 1.2, { family: SWITZER, size: subSize, style: "italic", color: MUTED, baseline: "top", alpha: sa, ls: -subSize * 0.02 });
  ctx.restore();

  // Rodapé da hero: CTA e as duas linhas de contexto do site.
  const ba = easeOutCubic(prog(t, 1.0, 1.6));
  const monoS = V ? 24 : 19;
  const ctaY = V ? H - 280 : H - 190;
  const cta = "VEJA MEU TRABALHO  ↓";
  const ctaW = measure(ctx, cta, MONO, V ? 30 : 24, 500, 3);
  const ctaX = V ? W / 2 - ctaW / 2 : G;
  text(ctx, cta, ctaX, ctaY, { family: MONO, size: V ? 30 : 24, weight: 500, color: INK, ls: 3, baseline: "top", alpha: ba });
  // Sublinhado que corre no hover do CTA.
  const hov = prog(t, 5.3, 5.7);
  ctx.fillStyle = INK;
  ctx.globalAlpha = ba;
  ctx.fillRect(ctaX, ctaY + (V ? 44 : 36), (ctaW - (V ? 50 : 40)) * (0.35 + 0.65 * easeOutCubic(hov)), 2);
  ctx.globalAlpha = 1;
  const l1 = "UX/UI · WEBAPPS · DESIGN SYSTEMS";
  const l2 = "BASEADO NO BRASIL · DISPONÍVEL PARA PROJETOS NO MUNDO TODO 🌍";
  if (V) {
    text(ctx, l1, W / 2, H - 190, { family: MONO, size: monoS, color: MUTED, ls: 2.4, align: "center", alpha: ba });
    text(ctx, "BASEADO NO BRASIL", W / 2, H - 145, { family: MONO, size: monoS, color: MUTED, ls: 2.4, align: "center", alpha: ba });
    text(ctx, "DISPONÍVEL PARA PROJETOS NO MUNDO TODO 🌍", W / 2, H - 108, { family: MONO, size: monoS, color: MUTED, ls: 2.4, align: "center", alpha: ba });
  } else {
    text(ctx, l1, G, H - 90, { family: MONO, size: monoS, color: MUTED, ls: 2.4, alpha: ba });
    text(ctx, l2, W - G, H - 90, { family: MONO, size: monoS, color: MUTED, ls: 2.4, align: "right", alpha: ba });
  }

  grain(ctx, t, 0.1);

  // Lente: abre quando o cursor chega no nome, encolhe perto do CTA.
  const c = path(HERO_CURSOR, t);
  const open = easeOutCubic(prog(t, 1.3, 2.0)) * (1 - easeInOutCubic(prog(t, 4.4, 5.2)));
  lens(ctx, c.x, c.y, (V ? 200 : 230) * open);
  const state = t > 5.85 && t < 6.05 ? "click" : t > 5.2 ? "hover" : "rest";
  drawCursor(ctx, c.x, c.y, state);
};

// 02 · capítulo: o índice das seis soluções, em mono sobre preto.
const SOLUTIONS = [
  "Identidade interativa",
  "Mundos 3D no navegador",
  "Tipografia viva",
  "Design Systems",
  "Landing pages que convertem",
  "Ilustração, animação e som",
];

SCENE.chapter = (ctx, t) => {
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const size = V ? 104 : 112;
  const title = "Seis coisas que eu já coloquei no ar e posso fazer por você.";
  const lines = wrap(ctx, title.toUpperCase(), V ? W - G * 2 : 1300, INKTRAP, size, 900, size * 0.01);
  const top = V ? 300 : 150;
  const after = revealLines(ctx, lines, G, top, { size, color: "#fff", ls: 0.01, t, t0: 0.1, stagger: 0.07 });
  const ls = V ? 34 : 26;
  const cols = V ? 1 : 2;
  const colW = (W - G * 2) / cols;
  const y0 = after + (V ? 90 : 70);
  SOLUTIONS.forEach((s, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const t0 = 0.55 + i * 0.12;
    const str = `${String(i + 1).padStart(2, "0")}  ${typed(s.toUpperCase(), t, t0, t0 + 0.35)}`;
    const a = prog(t, t0 - 0.05, t0);
    text(ctx, str, G + col * colW, y0 + row * ls * 2.1, { family: MONO, size: ls, weight: 500, color: "rgba(255,255,255,0.8)", ls: ls * 0.1, alpha: a, baseline: "top" });
  });
  grain(ctx, t, 0.06);
};

// 03 · identidade interativa: a arte ASCII "ganwalk" do site, gerada ao vivo
// a partir do clipe, com as letras fugindo do cursor.
const asciiSmall = makeCanvas(8, 8);
const ASCII_CURSOR = [
  { t: 0.3, x: 0.78, y: 0.2 },
  { t: 1.6, x: 0.55, y: 0.42 },
  { t: 2.8, x: 0.7, y: 0.55 },
  { t: 3.9, x: 0.45, y: 0.3 },
  { t: 5.2, x: 0.62, y: 0.4 },
];

SCENE.ascii = (ctx, t) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const src = clip("ganwalk2", t, 240, { loop: true, offset: 0.5 });
  const GRID = 26;
  const aspect = W / H;
  const gw = aspect >= 1 ? Math.floor(GRID * 2 * aspect) : Math.floor(GRID * 2);
  const gh = aspect >= 1 ? Math.floor(GRID * 2) : Math.floor((GRID * 2) / aspect);
  if (src) {
    asciiSmall.width = gw;
    asciiSmall.height = gh;
    const g = asciiSmall.getContext("2d", { willReadFrequently: true });
    drawCover(g, src, 0, 0, gw, gh);
    const data = g.getImageData(0, 0, gw, gh).data;
    const cw = W / gw;
    const ch = H / gh;
    const c = path(ASCII_CURSOR, t);
    const sig = 170;
    const push = 120 * easeOutCubic(prog(t, 0.3, 1.0));
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let ci = 0;
    for (let y = 0; y < gh; y++)
      for (let x = 0; x < gw; x++) {
        const i = (y * gw + x) * 4;
        let v = Math.min(255, 1.6 * (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]));
        let px = x * cw + cw / 2;
        let py = y * ch + ch / 2;
        const dx = px - c.x;
        const dy = py - c.y;
        const d2 = dx * dx + dy * dy;
        const f = Math.exp(-d2 / (2 * sig * sig));
        const d = Math.sqrt(d2) || 1;
        px += (dx / d) * push * f;
        py += (dy / d) * push * f;
        v = Math.min(255, v + 140 * f);
        if (v < 40) continue;
        const k = v / 255;
        ctx.fillStyle = `rgb(${Math.floor(255 * k)},${Math.floor(200 * k)},0)`;
        const size = Math.max(1, Math.floor(k * ch * 1.4));
        ctx.font = `500 ${size}px ${MONO}`;
        ctx.fillText("ganwalk"[ci % 7], px, py);
        ci++;
      }
    shade(ctx, 0.9);
    drawCursor(ctx, c.x, c.y, "hover", easeOutCubic(prog(t, 0.2, 0.6)));
  }
  dots(ctx, 0);
  titleBlock(ctx, "IDENTIDADES VISUAIS QUE REAGEM AO TOQUE", "LOGO EM PARTÍCULAS WEBGL · MIXER AO VIVO COM LOOPER E GRAVAÇÃO · TUDO RODANDO NO NAVEGADOR", t);
  grain(ctx, t, 0.05);
};

// 04 · mundos 3D: o deserto em Three.js do site de verdade, gravado quadro a
// quadro (scripts/record-dezert-horse.mjs), com o painel retrô ao lado.
SCENE.desert = (ctx, t) => {
  ctx.fillStyle = "#1a120b";
  ctx.fillRect(0, 0, W, H);
  const f = clip(V ? "dh916" : "dh169b", t, 330, { offset: 1.2 });
  drawCover(ctx, f, 0, V ? -120 : -60, W, H, 0.5, 0.5, (V ? 1.15 : 1.22) + t * 0.008);
  if (!V) {
    const panel = get(`${MEDIA}/dh-panel.png`);
    if (panel) {
      const p = easeOutExpo(prog(t, 1.4, 2.4));
      const pw = 430;
      const ph = (pw * panel.naturalHeight) / panel.naturalWidth;
      const px = W - G - pw + (1 - p) * 520;
      const py = 150;
      ctx.save();
      ctx.globalAlpha = 0.96 * p;
      dither(ctx, panel, px, py, pw, ph, { cell: 5, phase: Math.floor(t * 12), bias: 10, reveal: easeOutCubic(prog(t, 1.8, 2.8)) });
      ctx.restore();
    }
  }
  shade(ctx, 0.85);
  dots(ctx, 1);
  titleBlock(ctx, "MUNDOS 3D PRA EXPLORAR SEM INSTALAR NADA", "CENA EM THREE.JS · PAINEL DE CONTROLE RETRÔ · ÁLBUM INTEIRO TOCANDO NO SITE", t);
  grain(ctx, t, 0.05);
};

// 05 · tipografia viva: o nome em partículas com física de mola (gravação
// real do site, com o próprio cursor de quem gravou mexendo nas letras).
SCENE.particles = (ctx, t) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const f = clip(V ? "pinkv" : "pinkh", t, 300, { offset: 1.2 });
  if (V) drawCover(ctx, f, 0, -260, W, H, 0.5, 0.5, 1.02);
  else drawCover(ctx, f, 0, -230, W, H, 0.5, 0.5, 0.8 + t * 0.008);
  shade(ctx, 0.8);
  dots(ctx, 2);
  titleBlock(ctx, "TIPOGRAFIA VIVA, COM FÍSICA DE VERDADE", "PARTÍCULAS COM FÍSICA DE MOLA · SITE OFICIAL EM PÁGINA ÚNICA · LEVE, SEM FRAMEWORK", t);
  grain(ctx, t, 0.05);
};

// 06 · Design System: a peça de motion da intranet mais os números reais.
SCENE.system = (ctx, t) => {
  ctx.fillStyle = "#0b0b0b";
  ctx.fillRect(0, 0, W, H);
  const f = clip("intranet", t, 270, { rate: 1.35, offset: 0.3 });
  if (V) drawCover(ctx, f, -40, 60, W + 80, 1100, 0.5, 0.5, 1.25);
  else drawCover(ctx, f, 0, -60, W, H + 60, 0.5, 0.4, 1.02);
  shade(ctx, 0.92);
  dots(ctx, 3);
  const metrics = [
    { to: 110, label: "COMPONENTES REACT" },
    { to: 70, label: "DOCUMENTADOS" },
    { to: 10, label: "ÁREAS NO TOM DE VOZ" },
  ];
  if (V) {
    titleBlock(ctx, "DESIGN SYSTEM QUE SEGURA UM ECOSSISTEMA INTEIRO", "INTRANET COMPLETA · COMPONENTES DOCUMENTADOS · MANUAL DE TOM E VOZ", t, { bottom: H - 380 });
    metricRow(ctx, metrics, G, H - 300, t, 2.2, { size: 88, gap: 56 });
  } else {
    titleBlock(ctx, "DESIGN SYSTEM QUE SEGURA UM ECOSSISTEMA INTEIRO", "INTRANET COMPLETA · COMPONENTES DOCUMENTADOS · MANUAL DE TOM E VOZ", t, { maxW: 900, size: 88 });
    metricRow(ctx, metrics, 0, H - 250, t, 2.2, { size: 80, gap: 48, right: true });
  }
  grain(ctx, t, 0.05);
};

// 07 · landing pages: as páginas reais do ecossistema rolando em colunas.
const LPS = ["capital", "escola", "sempre", "wealth", "etfs", "credito", "cambio", "seguros", "agro", "private-day", "giro-itinerante"];

SCENE.landing = (ctx, t) => {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  const cols = V ? 3 : 5;
  const gap = 26;
  const colW = V ? 330 : 350;
  const total = cols * colW + (cols - 1) * gap;
  const x0 = (W - total) / 2;
  for (let c = 0; c < cols; c++) {
    const speed = [95, 150, 115, 170, 105][c];
    let y = -((t + 3) * speed) - c * 420;
    let k = c * 3;
    const x = x0 + c * (colW + gap);
    // Empilha páginas até cobrir a tela, recomeçando a lista quando acaba.
    let guard = 0;
    while (y < H && guard++ < 40) {
      const img = get(`${PUB}/photos/landing-pages/${LPS[k % LPS.length]}.webp`);
      const h = img ? (colW * img.naturalHeight) / img.naturalWidth : 1400;
      if (img && y + h > 0) ctx.drawImage(img, x, y, colW, h);
      y += h + gap;
      k++;
    }
  }
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(0, 0, W, H);
  shade(ctx, 0.95);
  dots(ctx, 4);
  const metrics = [
    { to: 20, suffix: " MIL+", label: "ACESSOS POR DIA" },
    { to: 90, suffix: "+", label: "PERFORMANCE MÍNIMA" },
    { to: 8, suffix: "%+", label: "CONVERSÃO" },
  ];
  if (V) {
    titleBlock(ctx, "LANDING PAGES QUE CONVERTEM E APARECEM NA BUSCA", "SEO E RANKING EM IA · CLARITY E GOOGLE ANALYTICS · MANUTENÇÃO CONTÍNUA", t, { bottom: H - 380 });
    metricRow(ctx, metrics, G, H - 300, t, 2.2, { size: 84, gap: 50 });
  } else {
    titleBlock(ctx, "LANDING PAGES QUE CONVERTEM E APARECEM NA BUSCA", "SEO E RANKING EM IA · CLARITY E GOOGLE ANALYTICS · MANUTENÇÃO CONTÍNUA", t, { maxW: 900, size: 88 });
    metricRow(ctx, metrics, 0, H - 250, t, 2.2, { size: 80, gap: 48, right: true });
  }
  grain(ctx, t, 0.05);
};

// 08 · ilustração, animação e som: os cartões do bloco Extras, com o
// retículo de Bayer que dissolve quando o cursor passa por cima.
const ILUSTRAS = ["venturo", "cabeca", "manuzika", "simetria", "auuuuu", "flores", "irezumi", "majuju"];
const EXTRA_CARDS = [
  { title: "Colagens e ilustrações digitais", medium: "ESTAMPAS, QUADROS E PÔSTERES" },
  { title: "Estudos de movimento", medium: "ANIMAÇÃO" },
  { title: "Produção musical", medium: "ÁUDIO" },
];
const EXTRAS_CURSOR = [
  { t: 0.4, x: 1.05, y: V ? 0.3 : 0.75 },
  { t: 1.4, x: V ? 0.55 : 0.2, y: V ? 0.3 : 0.52 },
  { t: 2.5, x: V ? 0.5 : 0.5, y: V ? 0.52 : 0.55 },
  { t: 3.7, x: V ? 0.55 : 0.8, y: V ? 0.75 : 0.5 },
  { t: 5.2, x: V ? 0.9 : 0.93, y: V ? 0.93 : 0.9 },
];

SCENE.extras = (ctx, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const size = V ? 88 : 84;
  const title = "ILUSTRAÇÃO, ANIMAÇÃO E TRILHA PRA DAR ALMA À MARCA";
  const lines = wrap(ctx, title, V ? W - G * 2 : 1500, INKTRAP, size, 900, size * 0.01);
  const top = V ? 170 : 110;
  const after = revealLines(ctx, lines, G, top, { size, color: INK, ls: 0.01, t, t0: 0.1 });

  const c = path(EXTRAS_CURSOR, t);
  const n = 3;
  const gap = V ? 36 : 48;
  const cardW = V ? W - G * 2 : (W - G * 2 - gap * 2) / 3;
  const mediaH = V ? 330 : cardW;
  const labelH = V ? 96 : 100;
  const y0 = after + (V ? 70 : 60);
  for (let i = 0; i < n; i++) {
    const x = V ? G : G + i * (cardW + gap);
    const y = V ? y0 + i * (mediaH + labelH + gap) : y0;
    const a = easeOutCubic(prog(t, 0.4 + i * 0.12, 1.0 + i * 0.12));
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(0, (1 - a) * 40);
    let src;
    if (i === 0) src = get(`${PUB}/photos/ilustra-${ILUSTRAS[Math.floor(t / 0.75) % ILUSTRAS.length]}.webp`);
    else if (i === 1) src = clip("cagumela", t, 240, { loop: true });
    else src = clip("som", t, 240, { loop: true, offset: 1 });
    // Hover: quanto tempo o cursor já passou dentro do cartão, sem estado
    // guardado (varre o caminho pra trás em passos pequenos).
    let inside = 0;
    for (let s = 0; s < 0.8; s += 0.05) {
      const q = path(EXTRAS_CURSOR, t - s);
      if (q.x > x && q.x < x + cardW && q.y > y && q.y < y + mediaH + labelH) inside += 0.05;
      else break;
    }
    const reveal = easeOutCubic(clamp(inside / 0.5));
    dither(ctx, src, x, y, cardW, mediaH, { cell: V ? 8 : 7, phase: Math.floor(t * 10), bias: 38, reveal });
    ctx.strokeStyle = "rgba(17,17,17,0.14)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x, y, cardW, mediaH + labelH);
    text(ctx, EXTRA_CARDS[i].title, x + 22, y + mediaH + 26, { family: SANS, size: V ? 30 : 28, weight: 450, color: INK, baseline: "top" });
    text(ctx, EXTRA_CARDS[i].medium, x + 22, y + mediaH + (V ? 66 : 64), { family: MONO, size: V ? 19 : 18, color: MUTED, ls: 2.2, baseline: "top" });
    ctx.restore();
  }
  dots(ctx, 5, false);
  grain(ctx, t, 0.06);
  drawCursor(ctx, c.x, c.y, "hover");
};

// 09 · marcas: as logos do site passando em faixas.
const LOGOS = ["auvp", "minuto-indie", "hits-perdidos", "defensoria-goias", "mais-saude", "hapvida", "vivo-fibra", "boi-verde"];
// Mesma ideia do `size` de data/brands.ts: algumas logos têm muito respiro
// interno e precisam de mais corpo pra pesar igual às outras.
const LOGO_SCALE = { "minuto-indie": 1.35, "hits-perdidos": 1.35, "mais-saude": 1.6 };

SCENE.brands = (ctx, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const size = V ? 104 : 110;
  const lines = V ? ["ACREDITAM", "NO MEU", "TRABALHO"] : ["ACREDITAM NO", "MEU TRABALHO"];
  const top = V ? 260 : 150;
  const after = revealLines(ctx, lines, G, top, { size, color: INK, ls: 0.01, t, t0: 0.1 });
  const rows = V ? 3 : 2;
  const rowH = V ? 190 : 170;
  const y0 = after + (V ? 120 : 80);
  for (let r = 0; r < rows; r++) {
    const dir = r % 2 ? 1 : -1;
    const logoH = 92;
    const slot = 380;
    const offset = ((t * 160 * dir) % (slot * LOGOS.length)) - slot * LOGOS.length;
    for (let k = 0; k < LOGOS.length * 3; k++) {
      const img = get(`${PUB}/logos/${LOGOS[(k + r * 3) % LOGOS.length]}.webp`);
      if (!img) continue;
      const name = LOGOS[(k + r * 3) % LOGOS.length];
      const lhTarget = logoH * (LOGO_SCALE[name] ?? 1);
      const lw = Math.min(slot - 80, (lhTarget * img.naturalWidth) / img.naturalHeight);
      const lh = (lw * img.naturalHeight) / img.naturalWidth;
      const x = offset + k * slot;
      if (x > W || x + lw < 0) continue;
      // As logos já vêm em preto e branco (build-brand-logos.mjs);
      // multiply some com o fundo branco das que não têm transparência.
      ctx.save();
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = easeOutCubic(prog(t, 0.3 + r * 0.1, 0.9 + r * 0.1));
      ctx.drawImage(img, x, y0 + r * rowH + (logoH - lh) / 2, lw, lh);
      ctx.restore();
    }
  }
  grain(ctx, t, 0.08);
};

// 10 · contato: a foto em grade que se distorce sob o ponteiro, o convite em
// trinta e seis idiomas e os contatos no lugar do link do portfólio.
const PHRASES = [
  ["Fale", "comigo!"], ["Talk", "to me!"], ["¡Habla", "conmigo!"], ["跟我", "聊聊！"],
  ["Parle", "moi !"], ["Sprich", "mit mir!"], ["Parla", "con me!"], ["話して", "ください"],
  ["나에게", "말해줘!"], ["Поговори", "со мной!"], ["تحدث", "معي!"], ["मुझसे", "बात करो"],
  ["Praat", "met mij!"], ["Prata", "med mig!"], ["Pogadaj", "ze mną!"], ["Benimle", "konuş!"],
  ["Μίλα", "μου!"], ["דבר", "איתי!"], ["คุย", "กับฉัน!"], ["Nói chuyện", "với tôi!"],
  ["Ngobrol", "denganku!"], ["Ongea", "nami!"], ["با من", "صحبت کن!"], ["Поговори", "зі мною!"],
  ["Mluv", "se mnou!"], ["Vorbește", "cu mine!"], ["Beszélj", "velem!"], ["আমার সাথে", "কথা বলো!"],
  ["مجھ سے", "بات کرو!"], ["என்னிடம்", "பேசு!"], ["Bercakap", "dengan saya!"], ["Khuluma", "nami!"],
  ["Bá mi", "sọ̀rọ̀!"], ["ከእኔ ጋር", "ተነጋገር!"], ["Надтай", "ярь!"], ["Talaðu", "við mig!"],
];

function gridImage(ctx, img, X, Y, GW, GH, pointer, strength) {
  if (!img) return;
  const COLS = 6;
  const ROWS = 6;
  const BOOST = 2.6 * strength;
  const SIG = 0.16;
  const weights = (n, total, p) => {
    const w = [];
    for (let i = 0; i < n; i++) {
      const center = ((i + 0.5) / n) * total;
      const d = (p - center) / (SIG * total);
      w.push(1 + BOOST * Math.exp(-0.5 * d * d));
    }
    const sum = w.reduce((a, b) => a + b, 0);
    const sizes = w.map((v) => (v / sum) * total);
    const pos = [0];
    for (const s of sizes) pos.push(pos[pos.length - 1] + s);
    return { sizes, pos };
  };
  const { sizes: cw, pos: cx } = weights(COLS, GW, pointer.x - X);
  const { sizes: rh, pos: cy } = weights(ROWS, GH, pointer.y - Y);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ca = GW / GH;
  let sx = 0;
  let sy = 0;
  let sw = iw;
  let sh = ih;
  if (iw / ih > ca) {
    sw = ih * ca;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / ca;
    sy = (ih - sh) / 2;
  }
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const dx = X + cx[c] + 1;
      const dy = Y + cy[r] + 1;
      const dw = Math.max(cw[c] - 2, 0.5);
      const dh = Math.max(rh[r] - 2, 0.5);
      ctx.drawImage(img, sx + (c * sw) / COLS, sy + (r * sh) / ROWS, sw / COLS, sh / ROWS, dx, dy, dw, dh);
      const words = PHRASES[(r * COLS + c) % PHRASES.length];
      const fs = Math.max(9, Math.min(dw, dh) * 0.1);
      ctx.save();
      ctx.font = `400 ${fs}px "Liberation Sans", "FreeSans", "WenQuanYi Zen Hei", sans-serif`;
      ctx.fillStyle = "#fff";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      words.forEach((w, i) => ctx.fillText(w, dx + dw - fs * 0.4, dy + fs * 0.4 + i * fs * 1.15));
      ctx.restore();
    }
}

const CONTACT_CURSOR = [
  { t: 0.5, x: V ? 1.05 : 1.05, y: V ? 0.3 : 0.6 },
  { t: 1.7, x: V ? 0.3 : 0.64, y: V ? 0.12 : 0.3 },
  { t: 3.0, x: V ? 0.72 : 0.86, y: V ? 0.3 : 0.62 },
  { t: 4.3, x: V ? 0.45 : 0.72, y: V ? 0.22 : 0.45 },
  { t: 6.0, x: V ? 0.5 : 0.26, y: V ? 0.64 : 0.57 },
];

const CONTACTS = [
  ["WHATSAPP", "+55 62 99217 4047"],
  ["INSTAGRAM", "@ganwalk"],
  ["LINKEDIN", "in/armando-custodio-00080320a"],
  ["GITHUB", "github.com/ganwalk"],
];

SCENE.contact = (ctx, t) => {
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const c = path(CONTACT_CURSOR, t);
  const photo = get(`${PUB}/photos/armando-contato.webp`);
  const gx = V ? 0 : W / 2;
  const gy = 0;
  const gW = V ? W : W / 2;
  const gH = V ? 820 : H;
  const overGrid = c.x > gx && c.y < gy + gH;
  const pa = easeOutCubic(prog(t, 0.0, 0.8));
  ctx.save();
  ctx.globalAlpha = pa;
  const strength = clamp(prog(t, 1.0, 1.6)) * (1 - prog(t, 4.6, 5.4));
  gridImage(ctx, photo, gx, gy, gW, gH, overGrid || strength > 0 ? c : { x: gx + gW / 2, y: gy + gH / 2 }, strength);
  ctx.restore();

  // Coluna de texto.
  const tx = G;
  const ty = V ? gH + 90 : 170;
  const size = V ? 150 : 150;
  const after = revealLines(ctx, ["Vamos", "conversar?"], tx, ty, { size, lh: 0.92, color: INK, ls: -0.005, t, t0: 0.3 });
  const sub = easeOutCubic(prog(t, 0.9, 1.5));
  text(ctx, "Aberto a projetos, colaborações e boas ideias.", tx, after + 36, { family: SANS, size: V ? 36 : 32, weight: 400, color: MUTED, baseline: "top", alpha: sub });

  // Email, o mesmo destaque sublinhado do site, e depois os outros canais.
  const ey = after + (V ? 130 : 120);
  const es = V ? 46 : 38;
  const email = "ARMANDOCUSTODIO0@GMAIL.COM";
  const ea = easeOutCubic(prog(t, 1.2, 1.8));
  const ew = measure(ctx, email, INKTRAP, es, 900, 0.5);
  text(ctx, email, tx, ey, { family: INKTRAP, size: es, weight: 900, color: INK, baseline: "top", ls: 0.5, alpha: ea });
  const hovered = t > 5.7;
  ctx.fillStyle = INK;
  ctx.globalAlpha = ea;
  ctx.fillRect(tx, ey + es * 1.05, ew * (hovered ? 1 : easeOutCubic(prog(t, 1.4, 2.2))), hovered ? 4 : 2.5);
  ctx.globalAlpha = 1;

  const ms = V ? 25 : 22;
  CONTACTS.forEach(([k, v], i) => {
    const t0 = 1.6 + i * 0.14;
    const a = easeOutCubic(prog(t, t0, t0 + 0.5));
    const y = ey + (V ? 120 : 108) + i * ms * 2.05;
    text(ctx, k, tx, y + (1 - a) * 10, { family: MONO, size: ms, weight: 500, color: MUTED, ls: ms * 0.14, baseline: "top", alpha: a });
    text(ctx, v, tx + (V ? 250 : 220), y + (1 - a) * 10, { family: MONO, size: ms, weight: 500, color: INK, ls: ms * 0.04, baseline: "top", alpha: a });
  });
  const aa = easeOutCubic(prog(t, 2.4, 3.0));
  text(ctx, V ? "DISPONÍVEL PARA PROJETOS NO MUNDO TODO 🌍" : "BASEADO NO BRASIL · DISPONÍVEL PARA PROJETOS NO MUNDO TODO 🌍", tx, H - (V ? 110 : 90), { family: MONO, size: V ? 23 : 19, color: MUTED, ls: 2.4, alpha: aa });

  grain(ctx, t, 0.08);
  const state = t > 8.05 && t < 8.3 ? "click" : t > 5.7 ? "hover" : "rest";
  drawCursor(ctx, c.x, c.y, state, 1 - prog(t, 9.2, 9.8));
};

// =============================================================== montagem

function sceneAt(t) {
  let i = SCENES.findIndex((s) => t < s.end);
  if (i < 0) i = SCENES.length - 1;
  return i;
}

function drawScene(ctx, i, t) {
  const s = SCENES[i];
  ctx.save();
  SCENE[s.id](ctx, t - s.start);
  ctx.restore();
}

function curtain(ctx, t, tr) {
  const start = tr.at - CURTAIN_COVER - CURTAIN.hold / 2;
  const revealStart = tr.at + CURTAIN.hold / 2;
  const sw = W / CURTAIN.stripes;
  ctx.fillStyle = tr.color;
  for (let i = 0; i < CURTAIN.stripes; i++) {
    const a = easeOutCubic(prog(t, start + i * CURTAIN.stagger, start + i * CURTAIN.stagger + CURTAIN.stripe));
    const b = easeInOutCubic(prog(t, revealStart + i * CURTAIN.stagger, revealStart + i * CURTAIN.stagger + CURTAIN.stripe));
    // Cobre de cima pra baixo, revela saindo por baixo.
    const top = b * H;
    const bottom = a * H;
    if (bottom > top) ctx.fillRect(Math.floor(i * sw), top, Math.ceil(sw) + 1, bottom - top);
  }
}

function compose(t) {
  const i = sceneAt(t);
  const tr = TRANSITIONS.find((x) => x.kind === "dither" && t >= x.from && t < x.to);
  if (tr) {
    const a = scratch(0);
    const b = scratch(1);
    const ai = sceneAt(tr.at - 0.001);
    const bi = sceneAt(tr.at);
    drawScene(a.getContext("2d"), ai, t);
    drawScene(b.getContext("2d"), bi, t);
    bayerMix(main, a, b, easeInOutCubic(prog(t, tr.from, tr.to)));
  } else {
    drawScene(main, i, t);
  }
  for (const c of TRANSITIONS) {
    if (c.kind !== "curtain") continue;
    if (t > c.at - CURTAIN_COVER - 0.2 && t < c.at + CURTAIN_COVER + 0.3) curtain(main, t, c);
  }
}

async function renderAt(t) {
  for (let attempt = 0; attempt < 6; attempt++) {
    pending.clear();
    compose(t);
    if (!pending.size) return;
    await Promise.all([...pending]);
  }
  compose(t);
}

// Recursos fixos e fontes antes do primeiro quadro.
const ready = (async () => {
  const fixed = [SPRITE, ...Object.values(CURSOR), `${PUB}/photos/armando-contato.webp`, `${MEDIA}/dh-panel.png`, ...LOGOS.map((l) => `${PUB}/logos/${l}.webp`), ...LPS.map((l) => `${PUB}/photos/landing-pages/${l}.webp`), ...ILUSTRAS.map((l) => `${PUB}/photos/ilustra-${l}.webp`)];
  await Promise.all(fixed.map((u) => load(u).p));
  const faces = [`900 40px ${INKTRAP}`, `italic 400 40px ${SWITZER}`, `500 40px ${MONO}`, `400 40px ${MONO}`, `400 40px ${SANS}`];
  await Promise.all(faces.map((f) => document.fonts.load(f, "AÇÃÍáçãí")));
  await document.fonts.ready;
})();

window.__comp = { W, H, FPS, DURATION, ready, renderAt, frames: Math.round(DURATION * FPS) };

// Prévia ao vivo: sem ?render, toca em tempo real (clique pausa/continua).
if (!params.has("render")) {
  let t0 = performance.now();
  let paused = false;
  let at = Number(params.get("t") ?? 0);
  canvas.addEventListener("click", () => {
    paused = !paused;
    t0 = performance.now() - at * 1000;
  });
  ready.then(() => {
    const loop = async () => {
      if (!paused) at = ((performance.now() - t0) / 1000 + Number(params.get("t") ?? 0)) % DURATION;
      pending.clear();
      compose(at);
      requestAnimationFrame(loop);
    };
    loop();
  });
}
