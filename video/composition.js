// Reel do portfólio, desenhado quadro a quadro num canvas só.
//
// Nada aqui depende de relógio real: `renderAt(frame)` desenha exatamente o
// quadro pedido, sempre igual, e é o render.mjs quem anda de quadro em quadro
// e entrega cada um pro ffmpeg. Por isso nenhuma animação usa rAF, CSS ou
// <video>: tudo é função do tempo `t`, em segundos.
//
// A linguagem visual vem direto da landing:
// · a matriz de Bayer (src/lib/dither.ts) é a porta de entrada e saída de
//   toda mídia, do mesmo jeito que os cartões do Playground cintilam;
// · o retrato em flipbook anda na mesma sequência de src/lib/portrait-frames.ts
//   (12 quadros de 85ms, expressão final segurando 700ms) e a roleta do
//   subtítulo gira no mesmo pulso;
// · a lente da hero inverte tinta e papel com a mesma máscara radial de borda
//   difusa, e no fim cresce até engolir a tela inteira;
// · a cortina de réguas é o gesto de entrada do site (StripeCurtain.tsx).
//
// Formato por query string: ?f=landscape (1920×1080) ou ?f=portrait (1080×1920).

"use strict";

const params = new URLSearchParams(location.search);
const V = params.get("f") === "portrait";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
const FPS = 30;
const DURATION = 36.5;
const G = V ? 72 : 96;

const INK = "#0b0b0b";
const PAPER = "#f4f4f2";
const MUTED = "#6d6d6d";
const LIGHT = "#f4f4f4";
const DIM = "#9b9b9b";

const INKTRAP = '"Whyte Inktrap", "Archivo", sans-serif';
const SWITZER = '"Switzer", "Archivo", sans-serif';
const MONO = '"IBM Plex Mono", monospace';
const SANS = '"Archivo", Arial, sans-serif';

const canvas = document.getElementById("stage");
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d");

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

// ─── tempo e curvas ────────────────────────────────────────────────────────

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const sx = (u) => ((ax * u + bx) * u + cx) * u;
  const sy = (u) => ((ay * u + by) * u + cy) * u;
  const dx = (u) => (3 * ax * u + 2 * bx) * u + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 10; i++) {
      const x = sx(u) - t;
      if (Math.abs(x) < 1e-6) break;
      const d = dx(u);
      if (Math.abs(d) < 1e-6) break;
      u = clamp(u - x / d);
    }
    return sy(u);
  };
}

// A mesma curva de todas as entradas da hero (Hero.tsx, globals.css).
const expo = bezier(0.16, 1, 0.3, 1);
const outCubic = (p) => 1 - Math.pow(1 - p, 3);
const inCubic = (p) => p * p * p;
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── roteiro ───────────────────────────────────────────────────────────────

const T = {
  heroIn: 1.95,
  heroClock: 2.3,
  maniStart: 9.2,
  projStart: 12.6,
  projDur: 3.2,
  extrasStart: 25.4,
  contactStart: 29.8,
  endStart: 33.9,
};

// ─── carregamento ──────────────────────────────────────────────────────────

const cache = new Map();
let pending = [];
let frameNo = 0;
let manifest = {};

function image(url) {
  let entry = cache.get(url);
  if (!entry) {
    const img = new Image();
    entry = { img, ready: false, used: frameNo, volatile: url.includes("/.cache/") };
    entry.promise = new Promise((resolve) => {
      img.onload = () => img.decode().catch(() => {}).then(() => { entry.ready = true; resolve(); });
      img.onerror = () => { entry.ready = true; entry.failed = true; resolve(); };
    });
    img.src = url;
    cache.set(url, entry);
  }
  entry.used = frameNo;
  if (!entry.ready) {
    pending.push(entry.promise);
    return null;
  }
  return entry.failed ? null : entry.img;
}

function evict() {
  for (const [url, entry] of cache) {
    if (entry.volatile && entry.ready && frameNo - entry.used > 20) cache.delete(url);
  }
}

/** Quadro da prévia `name` no instante `time` (em segundos), em loop. */
function media(name, time, offset = 0) {
  const info = manifest[name];
  if (!info) return null;
  const index = ((Math.floor(Math.max(0, time) * FPS) + offset) % info.count) + 1;
  return image(`/video/.cache/${name}/${String(index).padStart(4, "0")}.jpg`);
}

const asset = (path) => image(`/public/${path}`);

// ─── retrato em flipbook (mesma batida de src/lib/portrait-frames.ts) ──────

const SEQ = [];
for (const ending of [13, 14, 15, 16]) {
  for (let f = 1; f <= 12; f++) SEQ.push({ frame: f, hold: 0.085, ending: false });
  SEQ.push({ frame: ending, hold: 0.7, ending: true });
}
const SEQ_TOTAL = SEQ.reduce((s, x) => s + x.hold, 0);

function portraitState(time) {
  const t = Math.max(0, time);
  const cycles = Math.floor(t / SEQ_TOTAL);
  let rest = t - cycles * SEQ_TOTAL;
  let ticks = cycles * 4;
  let lastTick = cycles * SEQ_TOTAL - SEQ_TOTAL + (SEQ_TOTAL - 0.7);
  let at = 0;
  for (const step of SEQ) {
    if (step.ending) {
      ticks += 1;
      lastTick = cycles * SEQ_TOTAL + at;
    }
    if (rest < step.hold) return { frame: step.frame, ticks, sinceTick: t - lastTick };
    rest -= step.hold;
    at += step.hold;
  }
  return { frame: 1, ticks, sinceTick: 99 };
}

function drawPortrait(c, time, x, y, w, filter = "none") {
  const sheet = asset("frames/eu-lg.webp");
  if (!sheet) return;
  const tw = sheet.naturalWidth / 4;
  const th = sheet.naturalHeight / 4;
  const i = portraitState(time).frame - 1;
  c.save();
  c.filter = filter;
  c.drawImage(sheet, (i % 4) * tw, Math.floor(i / 4) * th, tw, th, x, y, w, (w * th) / tw);
  c.restore();
}

// ─── Bayer (mesma construção recursiva de src/lib/dither.ts) ───────────────

function buildBayer(size) {
  let m = [0];
  let s = 1;
  while (s < size) {
    const n = s * 2;
    const g = new Array(n * n);
    for (let yy = 0; yy < s; yy++) {
      for (let xx = 0; xx < s; xx++) {
        const v = m[yy * s + xx];
        g[yy * n + xx] = 4 * v;
        g[yy * n + xx + s] = 4 * v + 2;
        g[(yy + s) * n + xx] = 4 * v + 3;
        g[(yy + s) * n + xx + s] = 4 * v + 1;
      }
    }
    m = g;
    s = n;
  }
  return m;
}
const BAYER8 = buildBayer(8).map((v) => (v + 0.5) / 64);
const BAYER4 = buildBayer(4);
// As quatro fases do Playground (useBayerDither.ts), trocando a cada 175ms.
const PHASES = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];
const phaseAt = (t) => PHASES[Math.floor(t / 0.175) % 4];

const scratch = makeCanvas(8, 8);
const sctx = scratch.getContext("2d", { willReadFrequently: true });

function coverCrop(sw, sh, dw, dh, anchorY = 0.5) {
  const sr = sw / sh;
  const dr = dw / dh;
  if (sr > dr) {
    const w = sh * dr;
    return [(sw - w) / 2, 0, w, sh];
  }
  const h = sw / dr;
  return [0, (sh - h) * anchorY, sw, h];
}

/**
 * Revelação pela matriz: cada pixel acende quando `amount` passa do limiar de
 * Bayer dele, com a cor original. `cell` é o tamanho do pixel na tela: grande
 * no começo (retículo grosso), 1 no fim. Acima de 0.82 a versão nítida entra
 * por cima, pra não terminar num retículo fino que ainda "treme".
 */
function ditherReveal(c, src, crop, dx, dy, dw, dh, amount, cell, opts = {}) {
  if (!src || amount <= 0) return;
  const filter = opts.filter || "none";
  const crisp = prog(amount, 0.82, 1) * (cell <= 3 ? 1 : 0);
  if (amount >= 1 && cell <= 1.01) {
    c.save();
    c.filter = filter;
    c.drawImage(src, ...crop, dx, dy, dw, dh);
    c.restore();
    return;
  }
  const lw = Math.max(2, Math.round(dw / Math.max(1, cell)));
  const lh = Math.max(2, Math.round(dh / Math.max(1, cell)));
  if (scratch.width !== lw || scratch.height !== lh) {
    scratch.width = lw;
    scratch.height = lh;
  }
  sctx.filter = filter;
  sctx.clearRect(0, 0, lw, lh);
  sctx.drawImage(src, ...crop, 0, 0, lw, lh);
  sctx.filter = "none";
  const data = sctx.getImageData(0, 0, lw, lh);
  const px = data.data;
  const bias = opts.lumBias ?? 0.35;
  for (let yy = 0; yy < lh; yy++) {
    for (let xx = 0; xx < lw; xx++) {
      const i = (yy * lw + xx) * 4;
      const thr = BAYER8[((yy & 7) << 3) + (xx & 7)];
      const lum = (0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]) / 255;
      // Pixels claros acendem antes dos escuros: a imagem "nasce" pelas
      // luzes, que é como o olho lê uma cena surgindo do preto.
      const gate = thr * (1 - bias) + (1 - lum) * bias;
      if (gate >= amount) px[i + 3] = 0;
      else px[i + 3] = 255;
    }
  }
  sctx.putImageData(data, 0, 0);
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(scratch, dx, dy, dw, dh);
  if (crisp > 0) {
    c.globalAlpha = crisp;
    c.filter = filter;
    c.imageSmoothingEnabled = true;
    c.drawImage(src, ...crop, dx, dy, dw, dh);
  }
  c.restore();
}

/**
 * Dither do Playground (ditherFrame em src/lib/dither.ts): matriz 4×4, cor
 * original acima do limiar, preto abaixo, viés +42, fase cintilando.
 */
function ditherPlayground(c, src, crop, dx, dy, dw, dh, t, lowWidth = 96) {
  if (!src) return;
  const lw = lowWidth;
  const lh = Math.max(2, Math.round((lowWidth * dh) / dw));
  if (scratch.width !== lw || scratch.height !== lh) {
    scratch.width = lw;
    scratch.height = lh;
  }
  sctx.drawImage(src, ...crop, 0, 0, lw, lh);
  const data = sctx.getImageData(0, 0, lw, lh);
  const px = data.data;
  const phase = phaseAt(t);
  for (let yy = 0; yy < lh; yy++) {
    const row = ((yy + phase.y) & 3) * 4;
    for (let xx = 0; xx < lw; xx++) {
      const i = (yy * lw + xx) * 4;
      const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      const thr = BAYER4[row + ((xx + phase.x) & 3)] * (255 / 16) + 42;
      if (lum < thr) px[i] = px[i + 1] = px[i + 2] = 0;
      px[i + 3] = 255;
    }
  }
  sctx.putImageData(data, 0, 0);
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(scratch, dx, dy, dw, dh);
  c.restore();
}

/**
 * Retrato em retículo branco sobre preto: o traço do desenho vira ponto aceso.
 * `bias` sobe pra apagar (os pontos somem na ordem da matriz).
 */
const portraitScratch = makeCanvas(8, 8);
const pctx = portraitScratch.getContext("2d", { willReadFrequently: true });
function ditherPortrait(c, time, x, y, w, cell, t, fade = 0) {
  const sheet = asset("frames/eu-lg.webp");
  if (!sheet) return;
  const h = (w * 9) / 8;
  const lw = Math.max(2, Math.round(w / cell));
  const lh = Math.max(2, Math.round(h / cell));
  portraitScratch.width = lw;
  portraitScratch.height = lh;
  pctx.fillStyle = "#fff";
  pctx.fillRect(0, 0, lw, lh);
  const tw = sheet.naturalWidth / 4;
  const th = sheet.naturalHeight / 4;
  const i = portraitState(time).frame - 1;
  pctx.drawImage(sheet, (i % 4) * tw, Math.floor(i / 4) * th, tw, th, 0, 0, lw, lh);
  const data = pctx.getImageData(0, 0, lw, lh);
  const px = data.data;
  const phase = phaseAt(t);
  for (let yy = 0; yy < lh; yy++) {
    for (let xx = 0; xx < lw; xx++) {
      const k = (yy * lw + xx) * 4;
      const ink = 1 - (0.299 * px[k] + 0.587 * px[k + 1] + 0.114 * px[k + 2]) / 255;
      const thr = BAYER8[(((yy + phase.y) & 7) << 3) + ((xx + phase.x) & 7)];
      const on = ink * 1.15 > thr && thr > fade;
      px[k] = px[k + 1] = px[k + 2] = 244;
      px[k + 3] = on ? 255 : 0;
    }
  }
  pctx.putImageData(data, 0, 0);
  c.save();
  c.imageSmoothingEnabled = false;
  c.drawImage(portraitScratch, x, y, w, h);
  c.restore();
}

// ─── grão (o mesmo ruído que pula de posição na hero do site) ──────────────

const grainTiles = [];
{
  const rand = mulberry32(7);
  for (let k = 0; k < 4; k++) {
    const g = makeCanvas(256, 256);
    const gc = g.getContext("2d");
    const d = gc.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) {
      const v = Math.floor(rand() * 255);
      d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
      d.data[i + 3] = 255;
    }
    gc.putImageData(d, 0, 0);
    grainTiles.push(g);
  }
}
function grain(t, alpha) {
  const step = Math.floor(t * 12);
  const tile = grainTiles[step % 4];
  const ox = (step * 73) % 256;
  const oy = (step * 151) % 256;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  ctx.translate(-ox, -oy);
  ctx.fillStyle = ctx.createPattern(tile, "repeat");
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}

// ─── texto ─────────────────────────────────────────────────────────────────

function font(c, size, family, weight = 400, style = "normal", spacing = "0px") {
  c.font = `${style} ${weight} ${size}px ${family}`;
  c.letterSpacing = spacing;
}

function wrap(c, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (c.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Linha que sobe de dentro de uma máscara, como cada palavra do nome na hero. */
function riseLine(c, text, x, baseline, size, p, opts = {}) {
  const lift = opts.exit ? -expo(opts.exit) * size * 1.12 : 0;
  const offset = (1 - expo(p)) * size * 1.12 + lift;
  if (p <= 0 || (opts.exit && opts.exit >= 1)) return;
  c.save();
  c.beginPath();
  c.rect(-W, baseline - size * 1.02, W * 3, size * 1.3);
  c.clip();
  c.fillText(text, x, baseline + offset);
  c.restore();
}

/** Entrada padrão dos elementos de apoio na hero: sobe 40px e aparece. */
function reveal(c, p, draw) {
  if (p <= 0) return;
  const e = expo(p);
  c.save();
  c.globalAlpha *= e;
  c.translate(0, (1 - e) * 40);
  draw();
  c.restore();
}

function fitSize(c, lines, family, weight, maxWidth, maxSize) {
  font(c, 100, family, weight);
  const widest = Math.max(...lines.map((l) => c.measureText(l).width));
  return Math.min(maxSize, (100 * maxWidth) / widest);
}

// ─── cortina de réguas (StripeCurtain.tsx) ─────────────────────────────────

/**
 * `p` de 0 (tela coberta) a 1 (aberta). Réguas alternam a dobradiça entre topo
 * e base, e fecham/abrem em leque da esquerda pra direita.
 */
function stripeClip(c, p, open = true) {
  const n = 8;
  const stagger = 0.35;
  c.beginPath();
  for (let i = 0; i < n; i++) {
    const local = clamp((p - (i / n) * stagger) / (1 - stagger));
    const s = open ? 1 - outCubic(local) : inCubic(local);
    const x0 = Math.floor((i * W) / n);
    const x1 = Math.ceil(((i + 1) * W) / n);
    const h = H * s;
    if (h <= 0) continue;
    if (i % 2 === 0) c.rect(x0, 0, x1 - x0, h);
    else c.rect(x0, H - h, x1 - x0, h);
  }
}

function stripes(p, color, open = true) {
  if ((open && p >= 1) || (!open && p <= 0)) return;
  ctx.save();
  stripeClip(ctx, p, open);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// ─── cursor (os mesmos três estados do cursor do site) ─────────────────────

function cursor(x, y, state = "repouso", alpha = 1) {
  const img = asset(`cursor/${state}.webp`);
  if (!img || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const s = V ? 1.5 : 1.35;
  ctx.drawImage(img, x - 6 * s, y - 4 * s, img.naturalWidth * s, img.naturalHeight * s);
  ctx.restore();
}

function catmull(points, t) {
  // points: [{t, x, y}] em ordem de tempo
  if (t <= points[0].t) return points[0];
  const last = points[points.length - 1];
  if (t >= last.t) return last;
  let i = 0;
  while (t > points[i + 1].t) i++;
  const p0 = points[Math.max(0, i - 1)];
  const p1 = points[i];
  const p2 = points[i + 1];
  const p3 = points[Math.min(points.length - 1, i + 2)];
  const u = inOutCubic((t - p1.t) / (p2.t - p1.t));
  const cr = (a, b, cc, d) =>
    0.5 * (2 * b + (-a + cc) * u + (2 * a - 5 * b + 4 * cc - d) * u * u + (-a + 3 * b - 3 * cc + d) * u * u * u);
  return { x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) };
}

// ─── camadas ───────────────────────────────────────────────────────────────

const layerA = makeCanvas(W, H);
const actx = layerA.getContext("2d");
const layerB = makeCanvas(W, H);
const bctx = layerB.getContext("2d");
const layerC = makeCanvas(W, H);
const cctx = layerC.getContext("2d");

/**
 * Lente: `base` desenhada normal e, dentro do círculo de borda difusa, a mesma
 * cena invertida (com o leve desfoque de vidro do site e um pouco de zoom).
 */
function lens(base, cx, cy, r, zoom = 1.06) {
  ctx.drawImage(base, 0, 0);
  if (r <= 1) return;
  bctx.save();
  bctx.clearRect(0, 0, W, H);
  bctx.filter = "invert(1) blur(1.2px)";
  bctx.translate(cx, cy);
  bctx.scale(zoom, zoom);
  bctx.translate(-cx, -cy);
  bctx.drawImage(base, 0, 0);
  bctx.restore();

  cctx.save();
  cctx.clearRect(0, 0, W, H);
  const g = cctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.46, "rgba(0,0,0,0.9)");
  g.addColorStop(0.72, "rgba(0,0,0,0.4)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  cctx.fillStyle = g;
  cctx.fillRect(0, 0, W, H);
  cctx.globalCompositeOperation = "source-in";
  cctx.drawImage(layerB, 0, 0);
  cctx.restore();
  ctx.drawImage(layerC, 0, 0);
}

// ─── HUD (o cabeçalho fixo do site, em difference sobre qualquer fundo) ───

const SECTIONS = [
  [T.heroIn, "01 · INÍCIO"],
  [T.maniStart, "02 · SOBRE"],
  [T.projStart, "03 · PROJETOS"],
  [T.extrasStart, "04 · EXTRAS"],
  [T.contactStart, "05 · CONTATO"],
];

function hud(t) {
  if (t < T.heroIn + 0.4 || t >= T.endStart) return;
  const a = prog(t, T.heroIn + 0.4, T.heroIn + 0.9);
  let label = SECTIONS[0][1];
  for (const [start, name] of SECTIONS) if (t >= start) label = name;
  ctx.save();
  ctx.globalCompositeOperation = "difference";
  ctx.globalAlpha = a;
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "alphabetic";
  const y = V ? 96 : 62;
  font(ctx, V ? 26 : 22, INKTRAP, 700, "normal", "0.02em");
  ctx.textAlign = "left";
  ctx.fillText("ARMANDO CUSTODIO", G, y);
  font(ctx, V ? 19 : 16, MONO, 400, "normal", "0.12em");
  ctx.textAlign = "right";
  ctx.fillText(label, W - G, y);
  if (!V) {
    ctx.textAlign = "center";
    ctx.fillText("REEL 2026", W / 2, y);
  }
  ctx.restore();
}

// ─── cena 0: carregamento ──────────────────────────────────────────────────

const loaderLayer = makeCanvas(W, H);
const lctx = loaderLayer.getContext("2d");
const fieldCanvas = makeCanvas(W / 8, H / 8);
const fctx = fieldCanvas.getContext("2d");

function drawLoader(t) {
  const c = lctx;
  c.fillStyle = "#050505";
  c.fillRect(0, 0, W, H);

  // Campo de retículo: um gradiente radial que respira, quantizado pela
  // matriz 8×8. É o dither do site sem imagem nenhuma por trás, só luz.
  const fw = fieldCanvas.width;
  const fh = fieldCanvas.height;
  const d = fctx.createImageData(fw, fh);
  const load = expo(prog(t, 0.1, 1.9));
  const cx = fw / 2;
  const cy = fh / 2;
  const R = Math.min(fw, fh) * 0.55;
  for (let yy = 0; yy < fh; yy++) {
    for (let xx = 0; xx < fw; xx++) {
      const dist = Math.hypot(xx - cx, (yy - cy) * 1.05) / R;
      const wave = 0.5 + 0.5 * Math.sin(dist * 7 - t * 5);
      const v = clamp((1.05 - dist) * (0.15 + 0.7 * load)) * (0.55 + 0.45 * wave);
      const thr = BAYER8[((yy & 7) << 3) + (xx & 7)];
      const k = (yy * fw + xx) * 4;
      const on = v > thr;
      d.data[k] = d.data[k + 1] = d.data[k + 2] = 244;
      d.data[k + 3] = on ? 255 : 0;
    }
  }
  fctx.putImageData(d, 0, 0);
  c.save();
  c.imageSmoothingEnabled = false;
  c.globalAlpha = prog(t, 0, 0.35);
  c.drawImage(fieldCanvas, 0, 0, W, H);
  c.restore();

  const count = Math.round(100 * outCubic(prog(t, 0.15, 1.8)));
  const size = V ? 190 : 210;
  c.save();
  font(c, size, INKTRAP, 900, "normal", "0.02em");
  c.textAlign = "center";
  c.textBaseline = "middle";
  const label = String(count).padStart(3, "0");
  const tw = c.measureText(label).width;
  c.fillStyle = "#050505";
  c.fillRect(W / 2 - tw / 2 - 36, H / 2 - size * 0.55, tw + 72, size * 1.1);
  c.fillStyle = LIGHT;
  c.fillText(label, W / 2, H / 2 + size * 0.04);
  font(c, V ? 20 : 17, MONO, 400, "normal", "0.18em");
  const tag = (text, y) => {
    const w = c.measureText(text).width + 36;
    c.fillStyle = "#050505";
    c.fillRect(W / 2 - w / 2, y - 22, w, 44);
    c.fillStyle = DIM;
    c.fillText(text, W / 2, y + 1);
  };
  tag("PORTFÓLIO 2026", H / 2 - size * 0.55 - 40);
  tag("ARMANDO CUSTODIO · DESIGN ENGINEER", H / 2 + size * 0.55 + 40);
  c.restore();
}

// ─── cena 1: hero ──────────────────────────────────────────────────────────

const WORDS = ["produtos", "experiências", "aplicativos", "interfaces", "sistemas", "músicas", "sonhos", "embalagens", "sites"];
const heroLayer = makeCanvas(W, H);
const hctx = heroLayer.getContext("2d");
let HL = null;

function heroLayout() {
  const c = hctx;
  const names = ["ARMANDO", "CUSTODIO"];
  const L = {};
  if (V) {
    L.fs = fitSize(c, names, INKTRAP, 900, W - 2 * G, 400);
    font(c, L.fs, INKTRAP, 900);
    L.cap = c.measureText("A").actualBoundingBoxAscent;
    L.x = W / 2;
    L.align = "center";
    L.base1 = 250 + L.cap;
    L.base2 = L.base1 + L.fs * 0.86;
    L.subFs = 64;
    L.subBase = L.base2 + 120;
    L.pw = 740;
    L.px = (W - L.pw) / 2;
    L.py = L.subBase + 150;
    L.ctaY = H - 250;
    L.factsY = [H - 160, H - 124];
  } else {
    L.fs = fitSize(c, names, INKTRAP, 900, W * 0.55, 400);
    font(c, L.fs, INKTRAP, 900);
    L.cap = c.measureText("A").actualBoundingBoxAscent;
    L.x = G;
    L.align = "left";
    L.base1 = 200 + L.cap;
    L.base2 = L.base1 + L.fs * 0.86;
    L.subFs = L.fs * 0.36;
    L.subBase = L.base2 + L.fs * 0.9;
    L.pw = 600;
    L.px = W - G - L.pw + 10;
    L.py = 150;
    L.ctaY = H - 176;
    L.factsY = [H - 92];
  }
  L.ph = (L.pw * 9) / 8;
  L.nameW = Math.max(...names.map((n) => c.measureText(n).width));
  return L;
}

function drawHero(c, t) {
  const L = HL;
  const h = t - T.heroClock;
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, H);

  // retrato: a mesma entrada do portrait-enter do CSS
  const pp = expo(prog(h, 0.45, 1.35));
  c.save();
  c.globalAlpha = pp;
  drawPortrait(c, t - T.heroClock, L.px, L.py + (1 - pp) * 60, L.pw);
  c.restore();

  c.fillStyle = INK;
  c.textAlign = L.align;
  c.textBaseline = "alphabetic";
  font(c, L.fs, INKTRAP, 900, "normal", "0.015em");
  riseLine(c, "ARMANDO", L.x, L.base1, L.fs, prog(h, 0.1, 1.05));
  riseLine(c, "CUSTODIO", L.x, L.base2, L.fs, prog(h, 0.23, 1.18));

  // subtítulo com a roleta
  const ps = portraitState(h);
  const word = WORDS[ps.ticks % WORDS.length];
  const prev = WORDS[(ps.ticks + WORDS.length - 1) % WORDS.length];
  const roll = ps.ticks === 0 ? 1 : prog(ps.sinceTick, 0, 0.42);
  reveal(c, prog(h, 0.47, 1.37), () => {
    font(c, L.subFs, SWITZER, 400, "italic");
    c.fillStyle = MUTED;
    const drawWord = (text, x, y, align) => {
      const e = expo(roll);
      c.save();
      c.textAlign = align;
      c.beginPath();
      c.rect(-W, y - L.subFs * 1.05, W * 3, L.subFs * 1.4);
      c.clip();
      if (roll < 1) {
        c.save();
        c.filter = `blur(${(1 - e) * 3}px)`;
        c.globalAlpha = 1 - e;
        c.fillText(prev, x, y - e * L.subFs * 1.1);
        c.restore();
      }
      c.filter = `blur(${(1 - e) * 3}px)`;
      c.fillText(text, x, y + (1 - e) * L.subFs * 1.1);
      c.restore();
    };
    if (V) {
      c.textAlign = "center";
      c.fillText("Designer de", W / 2, L.subBase);
      drawWord(word, W / 2, L.subBase + L.subFs * 1.12, "center");
    } else {
      c.textAlign = "left";
      c.fillText("Designer de", L.x, L.subBase);
      const pre = c.measureText("Designer de ").width;
      drawWord(word, L.x + pre, L.subBase, "left");
    }
  });

  // CTA e rodapé de fatos
  reveal(c, prog(h, 0.59, 1.49), () => {
    font(c, V ? 22 : 19, MONO, 400, "normal", "0.1em");
    c.fillStyle = INK;
    c.textAlign = V ? "center" : "left";
    const label = "VEJA MEU TRABALHO  ↓";
    const w = c.measureText("VEJA MEU TRABALHO").width;
    const x0 = V ? W / 2 - c.measureText(label).width / 2 : L.x;
    c.fillText(label, V ? W / 2 : L.x, L.ctaY);
    c.fillRect(x0, L.ctaY + 12, w, 1.5);
  });
  reveal(c, prog(h, 0.71, 1.61), () => {
    font(c, V ? 16 : 14, MONO, 400, "normal", "0.12em");
    c.fillStyle = MUTED;
    if (V) {
      c.textAlign = "center";
      c.fillText("UX/UI · WEBAPPS · DESIGN SYSTEMS", W / 2, L.factsY[0]);
      c.fillText("DISPONÍVEL PARA PROJETOS NO MUNDO TODO", W / 2, L.factsY[1]);
    } else {
      c.textAlign = "left";
      c.fillText("UX/UI · WEBAPPS · DESIGN SYSTEMS", G, L.factsY[0]);
      c.textAlign = "right";
      c.fillText("BASEADO NO BRASIL · DISPONÍVEL PARA PROJETOS NO MUNDO TODO", W - G, L.factsY[0]);
    }
  });
}

function heroLensPath() {
  const L = HL;
  const nameLeft = V ? W / 2 - L.nameW / 2 : L.x;
  const mid1 = L.base1 - L.cap / 2;
  const mid2 = L.base2 - L.cap / 2;
  const face = { x: L.px + L.pw * 0.5, y: L.py + L.ph * 0.36 };
  const k = T.heroClock;
  if (V) {
    return [
      { t: k + 2.0, x: W + 80, y: mid1 + 40 },
      { t: k + 2.6, x: nameLeft + L.nameW * 0.8, y: mid1 },
      { t: k + 3.3, x: nameLeft + L.nameW * 0.2, y: mid2 },
      { t: k + 4.0, x: W / 2 + 60, y: L.subBase + L.subFs * 0.7 },
      { t: k + 4.8, x: face.x - 90, y: face.y },
      { t: k + 5.5, x: face.x + 20, y: face.y + 30 },
      { t: k + 6.9, x: face.x + 20, y: face.y + 30 },
    ];
  }
  return [
    { t: k + 2.0, x: nameLeft - 160, y: mid1 + 120 },
    { t: k + 2.6, x: nameLeft + L.nameW * 0.22, y: mid1 },
    { t: k + 3.3, x: nameLeft + L.nameW * 0.7, y: mid1 + 30 },
    { t: k + 3.9, x: nameLeft + L.nameW * 0.45, y: mid2 },
    { t: k + 4.5, x: nameLeft + L.nameW * 0.55, y: L.subBase - L.subFs * 0.3 },
    { t: k + 5.2, x: face.x - 60, y: face.y },
    { t: k + 5.8, x: face.x + 10, y: face.y + 20 },
    { t: k + 6.9, x: face.x + 10, y: face.y + 20 },
  ];
}

function sceneHero(t) {
  drawHero(hctx, t);
  const h = t - T.heroClock;
  const path = heroLensPath();
  const pos = catmull(path, t);
  const base = V ? 200 : 230;
  const grow = outCubic(prog(h, 2.2, 2.8));
  const cover = inOutCubic(prog(h, 5.75, 6.75));
  const full = Math.hypot(W, H) * 1.25;
  const r = base * grow + (full - base) * cover;
  lens(heroLayer, pos.x, pos.y, r, 1.035 - 0.035 * cover);
  grain(t, lerp(0.14, 0.08, cover));
  const cursorAlpha = prog(h, 1.9, 2.1) * (1 - prog(h, 5.6, 5.9));
  cursor(pos.x, pos.y, "repouso", cursorAlpha);
}

// ─── cena 2: manifesto ─────────────────────────────────────────────────────

function sceneManifesto(t) {
  const m = t - T.maniStart;
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);
  const L = HL;

  // O retrato sai de onde a lente o deixou (invertido) e vira retículo.
  const zoom = lerp(1, 1.1, inOutCubic(prog(m, 0, 3.4)));
  const pw = L.pw * zoom * (V ? 1.05 : 1.12);
  const px = V ? (W - pw) / 2 : L.px + L.pw / 2 - pw / 2 - 40 * prog(m, 0, 3.4);
  const py = V ? H - pw * 1.125 - 180 : L.py + L.ph / 2 - (pw * 1.125) / 2;
  const cell = lerp(1.2, 6, expo(prog(m, 0, 0.7))) + 10 * inCubic(prog(m, 2.9, 3.4));
  const fade = inCubic(prog(m, 2.85, 3.35)) * 1.01;
  ditherPortrait(ctx, t - T.heroClock, px, py, pw, cell, t, fade);

  const size = V ? fitSize(ctx, ["DO BANKING"], INKTRAP, 900, W - 2 * G, 150) : 158;
  const x = G;
  const top = V ? 320 : 330;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const exit = (i) => prog(m, 2.8 + i * 0.06, 3.35 + i * 0.06);
  reveal(ctx, prog(m, 0.05, 0.9) * (1 - prog(m, 2.8, 3.1)), () => {
    font(ctx, V ? 20 : 17, MONO, 400, "normal", "0.16em");
    ctx.fillStyle = DIM;
    ctx.fillText("O QUE EU FAÇO", x, top - 60);
  });
  font(ctx, size, INKTRAP, 900, "normal", "0.01em");
  ctx.fillStyle = LIGHT;
  const lines = ["DO BANKING", "À MÚSICA,"];
  lines.forEach((line, i) => {
    riseLine(ctx, line, x, top + size * 0.78 + i * size * 0.88, size, prog(m, 0.15 + i * 0.12, 1.1 + i * 0.12), { exit: exit(i) });
  });
  const sub = V ? ["interfaces que", "resolvem problema", "de verdade."] : ["interfaces que resolvem", "problema de verdade."];
  const subSize = V ? 68 : 64;
  font(ctx, subSize, SWITZER, 400, "italic");
  ctx.fillStyle = DIM;
  const subTop = top + size * 0.78 + size * 0.88 + (V ? 130 : 120);
  sub.forEach((line, i) => {
    riseLine(ctx, line, x, subTop + i * subSize * 1.12, subSize, prog(m, 0.55 + i * 0.1, 1.5 + i * 0.1), { exit: exit(2 + i) });
  });
  grain(t, 0.06);
}

// ─── cena 3: projetos ──────────────────────────────────────────────────────

const PROJECTS = [
  {
    title: ["GANWALK"],
    area: "MÚSICA",
    headline: "Desenhei a identidade visual interativa do Ganwalk.",
    tags: ["WebGL", "Three.js", "Interatividade"],
    media: { L: "ganwalk", P: "ganwalk" },
    offset: 30,
    ascii: true,
  },
  {
    title: ["PINK OPALA"],
    titleP: ["PINK", "OPALA"],
    area: "MÚSICA",
    headline: "Desenvolvi o site oficial do Pink Opala, duo indie pop de Goiânia.",
    tags: ["Canvas 2D", "Tailwind CSS", "Interatividade"],
    media: { L: "pink-h", P: "pink-v" },
    offset: 40,
  },
  {
    title: ["DESIGN SYSTEM"],
    titleP: ["DESIGN", "SYSTEM"],
    area: "BANKING",
    headline: "Construí uma intranet robusta para todo o ecossistema.",
    metrics: [
      [70, "", "componentes documentados"],
      [110, "", "componentes React no total"],
      [10, "", "áreas mapeadas no tom de voz"],
    ],
    media: { L: "intranet", P: "intranet" },
    offset: 40,
  },
  {
    title: ["LANDING PAGES"],
    titleP: ["LANDING", "PAGES"],
    area: "BANKING",
    headline: "Desenho e mantenho o ecossistema de webpages da AUVP Capital.",
    metrics: [
      [20, " mil+", "acessos diários"],
      [90, "+/100", "performance mínima"],
      [8, "%+", "conversão"],
    ],
    media: { L: "landing", P: "landing" },
    offset: 0,
    anchorY: 0,
  },
];

// O ASCII âmbar do card do Ganwalk no carrossel (GanwalkAsciiVideo.tsx):
// a palavra "ganwalk" soletrada sobre os pixels claros do vídeo, com o
// tamanho da letra seguindo o brilho.
const asciiLayer = makeCanvas(W, H);
const asciiCtx = asciiLayer.getContext("2d");
const asciiGrid = makeCanvas(8, 8);
const asciiGridCtx = asciiGrid.getContext("2d", { willReadFrequently: true });
function ganwalkAscii(src) {
  const gw = V ? 52 : Math.floor(52 * (W / H));
  const gh = V ? Math.floor(52 * (H / W)) : 52;
  asciiGrid.width = gw;
  asciiGrid.height = gh;
  asciiGridCtx.drawImage(src, ...coverCrop(src.naturalWidth, src.naturalHeight, gw, gh), 0, 0, gw, gh);
  const data = asciiGridCtx.getImageData(0, 0, gw, gh).data;
  const c = asciiCtx;
  c.fillStyle = "#000";
  c.fillRect(0, 0, W, H);
  c.textAlign = "center";
  c.textBaseline = "middle";
  const cw = W / gw;
  const ch = H / gh;
  let ci = 0;
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      const i = (y * gw + x) * 4;
      const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      if (v < 40) continue;
      // Um pouco mais aceso que no site: em vídeo comprimido o âmbar escuro
      // afunda no preto.
      const k = Math.min(1, (v / 255) * 1.7);
      c.fillStyle = `rgb(${Math.floor(255 * k)}, ${Math.floor(200 * k)}, 0)`;
      c.font = `${Math.max(1, Math.floor(k * ch * 1.4))}px ${MONO}`;
      c.fillText("ganwalk"[ci++ % 7], x * cw + cw / 2, y * ch + ch / 2);
    }
  }
  return asciiLayer;
}

function projectMedia(p, local) {
  const name = V ? p.media.P : p.media.L;
  const img = media(name, local, p.offset);
  if (img && p.ascii) {
    const layer = ganwalkAscii(img);
    return { img: layer, w: W, h: H };
  }
  return { img, w: img?.naturalWidth, h: img?.naturalHeight };
}

function sceneProjects(t) {
  const k = Math.min(PROJECTS.length - 1, Math.floor((t - T.projStart) / T.projDur));
  const p = PROJECTS[k];
  const u = t - T.projStart - k * T.projDur;
  const D = T.projDur;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);

  const { img, w: iw, h: ih } = projectMedia(p, u);
  const inP = prog(u, 0, 0.7);
  const outP = prog(u, D - 0.5, D);
  const amount = Math.min(outCubic(inP), 1 - inCubic(outP));
  const cell = outP > 0 ? lerp(1, 26, inCubic(outP)) : lerp(26, 1, outCubic(inP));
  const push = lerp(1.06, 1, outCubic(prog(u, 0, D)));

  if (img) {
    const aspect = iw / ih;
    const fullBleed = !V || aspect < 1;
    if (fullBleed) {
      const dw = W * push;
      const dh = H * push;
      ditherReveal(ctx, img, coverCrop(iw, ih, W, H, p.anchorY ?? 0.5), (W - dw) / 2, (H - dh) / 2, dw, dh, amount, cell, { filter: p.filter });
    } else {
      // Vertical com mídia horizontal: fundo em retículo grosso da própria
      // mídia, e a prévia nítida num cartão por cima.
      ditherReveal(ctx, img, coverCrop(iw, ih, W, H), 0, 0, W, H, amount * 0.999, Math.max(14, cell), { filter: p.filter });
      ctx.fillStyle = "rgba(5,5,5,0.72)";
      ctx.fillRect(0, 0, W, H);
      const cw = W - 2 * G;
      const ch = cw / Math.max(aspect, 1.25);
      const cy = 330;
      const cardP = expo(prog(u, 0.05, 0.9));
      ctx.save();
      ctx.translate(0, (1 - cardP) * 50);
      ditherReveal(ctx, img, coverCrop(iw, ih, cw, ch, p.anchorY ?? 0.5), G, cy, cw, ch, amount, cell, { filter: p.filter });
      ctx.strokeStyle = `rgba(244,244,244,${0.25 * amount})`;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(G + 0.5, cy + 0.5, cw - 1, ch - 1);
      ctx.restore();
    }
  }

  // leitura: escurece a base, como o gradiente dos cards do carrossel
  const g = ctx.createLinearGradient(0, H * (V ? 0.45 : 0.35), 0, H);
  g.addColorStop(0, "rgba(5,5,5,0)");
  g.addColorStop(1, "rgba(5,5,5,0.9)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!V) {
    const g2 = ctx.createLinearGradient(0, 0, W * 0.6, 0);
    g2.addColorStop(0, "rgba(5,5,5,0.55)");
    g2.addColorStop(1, "rgba(5,5,5,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);
    if (p.metrics) {
      const g3 = ctx.createLinearGradient(W * 0.6, 0, W, 0);
      g3.addColorStop(0, "rgba(5,5,5,0)");
      g3.addColorStop(1, "rgba(5,5,5,0.75)");
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, W, H);
    }
  }

  const textOut = prog(u, D - 0.55, D - 0.25);
  const fade = 1 - textOut;

  // índice e bolinhas do carrossel
  ctx.save();
  ctx.globalAlpha = fade;
  reveal(ctx, prog(u, 0.2, 1.0), () => {
    font(ctx, V ? 20 : 17, MONO, 400, "normal", "0.16em");
    ctx.fillStyle = LIGHT;
    ctx.textAlign = "left";
    const y = V ? 240 : 150;
    ctx.fillText(`0${k + 1} / 0${PROJECTS.length}  ·  ${p.area}`, G, y);
    for (let i = 0; i < PROJECTS.length; i++) {
      ctx.beginPath();
      ctx.arc(W - G - (PROJECTS.length - 1 - i) * 22, y - 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === k ? LIGHT : "rgba(244,244,244,0.3)";
      ctx.fill();
    }
  });
  ctx.restore();

  // título
  const lines = V && p.titleP ? p.titleP : p.title;
  const maxW = V ? W - 2 * G : p.metrics ? W * 0.56 : W * 0.62;
  const size = fitSize(ctx, lines, INKTRAP, 900, maxW, V ? 190 : 210);
  const lastBase = V ? H - 560 : H - 240;
  font(ctx, size, INKTRAP, 900, "normal", "0.01em");
  ctx.fillStyle = LIGHT;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    const base = lastBase - (lines.length - 1 - i) * size * 0.88;
    riseLine(ctx, line, G, base, size, prog(u, 0.3 + i * 0.1, 1.2 + i * 0.1), { exit: prog(u, D - 0.6 + i * 0.05, D - 0.1) });
  });

  // botão quadrado e frase do case
  ctx.save();
  ctx.globalAlpha = fade;
  const btnW = V ? 250 : 230;
  const btnH = V ? 72 : 64;
  const btnY = V ? H - 220 : H - 180;
  reveal(ctx, prog(u, 0.6, 1.5), () => {
    ctx.strokeStyle = LIGHT;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(G + 0.75, btnY + 0.75, btnW - 1.5, btnH - 1.5);
    font(ctx, V ? 19 : 17, MONO, 400, "normal", "0.14em");
    ctx.fillStyle = LIGHT;
    ctx.textAlign = "center";
    ctx.fillText("VER CASE  →", G + btnW / 2, btnY + btnH / 2 + 6);
  });
  reveal(ctx, prog(u, 0.7, 1.6), () => {
    font(ctx, V ? 32 : 24, SANS, 400);
    ctx.fillStyle = "#cfcfcf";
    ctx.textAlign = "left";
    if (V) {
      const hl = wrap(ctx, p.headline, W - 2 * G);
      hl.forEach((l, i) => ctx.fillText(l, G, H - 490 + i * 42));
    } else {
      const hl = wrap(ctx, p.headline, 430);
      hl.forEach((l, i) => ctx.fillText(l, G + btnW + 32, btnY + 24 + i * 32));
    }
  });

  // métricas reais ou tags
  if (p.metrics) {
    // Landscape: coluna à direita, uma métrica por linha. Vertical: três colunas.
    const colW = V ? (W - 2 * G) / 3 : 330;
    const x0 = V ? G : W - G - colW;
    const y0 = V ? H - 360 : H - 470;
    p.metrics.forEach(([value, suffix, label], i) => {
      reveal(ctx, prog(u, 0.8 + i * 0.1, 1.7 + i * 0.1), () => {
        const n = Math.round(value * outCubic(prog(u, 0.8 + i * 0.1, 2.0 + i * 0.1)));
        const x = V ? x0 + i * colW : x0;
        const y = V ? y0 : y0 + i * 118;
        if (!V) {
          ctx.fillStyle = "rgba(244,244,244,0.25)";
          ctx.fillRect(x, y - 70, colW, 1);
        }
        font(ctx, V ? 58 : 60, INKTRAP, 900);
        ctx.fillStyle = LIGHT;
        ctx.textAlign = "left";
        ctx.fillText(`${n}${suffix}`, x, y);
        font(ctx, V ? 16 : 14, MONO, 400, "normal", "0.08em");
        ctx.fillStyle = DIM;
        wrap(ctx, label.toUpperCase(), colW - 24).forEach((l, j) => ctx.fillText(l, x, y + 32 + j * 22));
      });
    });
  } else if (p.tags) {
    font(ctx, V ? 17 : 15, MONO, 400, "normal", "0.12em");
    const pad = 18;
    const widths = p.tags.map((tag) => ctx.measureText(tag.toUpperCase()).width + pad * 2);
    let x = V ? G : W - G - widths.reduce((a, b) => a + b + 12, -12);
    const y = V ? H - 380 : H - 170;
    p.tags.forEach((tag, i) => {
      reveal(ctx, prog(u, 0.8 + i * 0.08, 1.7 + i * 0.08), () => {
        font(ctx, V ? 17 : 15, MONO, 400, "normal", "0.12em");
        ctx.strokeStyle = "rgba(244,244,244,0.5)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, widths[i] - 1, 44);
        ctx.fillStyle = LIGHT;
        ctx.textAlign = "left";
        ctx.fillText(tag.toUpperCase(), x + pad, y + 28);
      });
      x += widths[i] + 12;
    });
  }
  ctx.restore();
  grain(t, 0.06);
}

// ─── cena 4: extras + marcas ───────────────────────────────────────────────

const ILUSTRAS = ["venturo", "cabeca", "manuzika", "simetria", "flores", "irezumi", "majuju", "auuuuu"];
const EXTRAS = [
  { title: "Colagens e ilustrações digitais", sub: "ESTAMPAS, QUADROS & PÔSTERES" },
  { title: "Estudos de movimento", sub: "ANIMAÇÃO" },
  { title: "Produção musical", sub: "ÁUDIO" },
];
const LOGOS = ["vivo-fibra", "boi-verde", "SUA MARCA", "auvp", "minuto-indie", "hits-perdidos", "defensoria-goias", "mais-saude", "hapvida"];

function extrasLayout() {
  if (V) {
    const w = W - 2 * G;
    const mh = 290;
    const cap = 104;
    const gap = 26;
    return EXTRAS.map((_, i) => ({ x: G, y: 360 + i * (mh + cap + gap), w, mh, cap }));
  }
  const gap = 40;
  const w = (W - 2 * G - 2 * gap) / 3;
  return EXTRAS.map((_, i) => ({ x: G + i * (w + gap), y: 290, w, mh: 420, cap: 118 }));
}

function extrasCursorPath(cards) {
  const s = T.extrasStart;
  const c = (i, dx = 0, dy = 0) => ({ x: cards[i].x + cards[i].w * 0.55 + dx, y: cards[i].y + cards[i].mh * 0.5 + dy });
  return [
    { t: s + 0.9, x: W + 60, y: V ? 700 : H - 120 },
    { t: s + 1.35, ...c(0) },
    { t: s + 2.05, ...c(0, -30, 20) },
    { t: s + 2.4, ...c(1) },
    { t: s + 3.0, ...c(1, 30, -10) },
    { t: s + 3.35, ...c(2) },
    { t: s + 4.4, ...c(2, 20, 30) },
  ];
}

function extrasSource(i, e) {
  if (i === 0) {
    const name = ILUSTRAS[Math.floor(e / 0.42) % ILUSTRAS.length];
    return asset(`photos/ilustra-${name}.webp`);
  }
  if (i === 1) return media("cagumela", e, 0);
  return media("som", e, 60);
}

function sceneExtras(t) {
  const e = t - T.extrasStart;
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  const cards = extrasLayout();
  const path = extrasCursorPath(cards);
  const cur = catmull(path, t);

  ctx.textAlign = "left";
  reveal(ctx, prog(e, 0.15, 1.0), () => {
    font(ctx, V ? 20 : 17, MONO, 500, "normal", "0.16em");
    ctx.fillStyle = INK;
    ctx.fillText("EXTRAS", G, V ? 205 : 158);
  });
  reveal(ctx, prog(e, 0.25, 1.1), () => {
    font(ctx, V ? 30 : 28, SANS, 400);
    ctx.fillStyle = MUTED;
    const lines = wrap(ctx, "Ilustração, animação e produção musical, os experimentos que alimentam o trabalho.", V ? W - 2 * G : 900);
    lines.forEach((l, i) => ctx.fillText(l, G, (V ? 252 : 204) + i * 38));
  });

  let hovering = false;
  cards.forEach((card, i) => {
    const pIn = prog(e, 0.35 + i * 0.12, 1.25 + i * 0.12);
    if (pIn <= 0) return;
    const inside = cur.x > card.x && cur.x < card.x + card.w && cur.y > card.y && cur.y < card.y + card.mh;
    if (inside && t > path[0].t) hovering = true;
    // hover suave: a mesma dissolução do Playground quando o cursor entra
    let hover = 0;
    for (let s = 0; s < 8; s++) {
      const tt = t - s * 0.035;
      const p2 = catmull(path, tt);
      const ins = tt > path[0].t && p2.x > card.x && p2.x < card.x + card.w && p2.y > card.y && p2.y < card.y + card.mh;
      hover += ins ? 1 / 8 : 0;
    }
    reveal(ctx, pIn, () => {
      const src = extrasSource(i, e);
      if (src) {
        const iw = src.naturalWidth;
        const ih = src.naturalHeight;
        const crop = coverCrop(iw, ih, card.w, card.mh);
        ditherPlayground(ctx, src, crop, card.x, card.y, card.w, card.mh, t, 96);
        if (hover > 0) {
          ctx.save();
          ctx.globalAlpha = hover;
          ctx.drawImage(src, ...crop, card.x, card.y, card.w, card.mh);
          ctx.restore();
        }
      }
      ctx.strokeStyle = "#d9d9d9";
      ctx.lineWidth = 1;
      ctx.strokeRect(card.x + 0.5, card.y + 0.5, card.w - 1, card.mh + card.cap - 1);
      font(ctx, V ? 28 : 26, SANS, 500);
      ctx.fillStyle = INK;
      ctx.textAlign = "left";
      ctx.fillText(EXTRAS[i].title, card.x + 24, card.y + card.mh + (V ? 46 : 50));
      font(ctx, V ? 16 : 15, MONO, 400, "normal", "0.12em");
      ctx.fillStyle = MUTED;
      ctx.fillText(EXTRAS[i].sub, card.x + 24, card.y + card.mh + (V ? 80 : 86));
    });
  });

  // letreiro de marcas
  const labelY = V ? 1740 : 900;
  const rowY = V ? 1800 : 968;
  const logoH = V ? 50 : 52;
  reveal(ctx, prog(e, 0.6, 1.5), () => {
    font(ctx, V ? 17 : 15, MONO, 400, "normal", "0.16em");
    ctx.fillStyle = MUTED;
    ctx.textAlign = "left";
    ctx.fillText("ACREDITAM NO MEU TRABALHO", G, labelY);
    ctx.fillStyle = "#d9d9d9";
    ctx.fillRect(0, labelY - 44, W, 1);
  });
  const items = [];
  for (const name of LOGOS) {
    if (name === "SUA MARCA") {
      items.push({ box: true, w: 190 });
    } else {
      const img = asset(`logos/${name}.webp`);
      if (!img) continue;
      items.push({ img, w: (img.naturalWidth / img.naturalHeight) * logoH });
    }
  }
  const spacing = 110;
  const total = items.reduce((s, it) => s + it.w + spacing, 0);
  const speed = 150;
  let x = G - ((e * speed) % total);
  ctx.save();
  ctx.globalAlpha = prog(e, 0.7, 1.4);
  for (let rep = 0; rep < 3; rep++) {
    for (const it of items) {
      if (x > W) break;
      if (x + it.w > -50) {
        if (it.box) {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#b8b8b8";
          ctx.strokeRect(x + 0.5, rowY - logoH / 2 + 8.5, it.w, logoH - 16);
          ctx.setLineDash([]);
          font(ctx, V ? 16 : 15, MONO, 400, "normal", "0.12em");
          ctx.fillStyle = MUTED;
          ctx.textAlign = "center";
          ctx.fillText("SUA MARCA", x + it.w / 2, rowY + 5);
        } else {
          ctx.drawImage(it.img, x, rowY - logoH / 2, it.w, logoH);
        }
      }
      ctx.fillStyle = "#b8b8b8";
      ctx.fillRect(x + it.w + spacing / 2 - 2, rowY - 2, 4, 4);
      x += it.w + spacing;
    }
  }
  ctx.restore();

  grain(t, 0.1);
  cursor(cur.x, cur.y, hovering ? "hover" : "repouso", prog(t, path[0].t, path[0].t + 0.1));
}

// ─── cena 5: contato ───────────────────────────────────────────────────────

const PHRASES = [
  ["Fale", "comigo!"], ["Talk", "to me!"], ["¡Habla", "conmigo!"], ["Parle", "moi !"],
  ["Sprich", "mit mir!"], ["Parla", "con me!"], ["Praat", "met mij!"], ["Prata", "med mig!"],
  ["Pogadaj", "ze mną!"], ["Benimle", "konuş!"], ["Μίλα", "μου!"], ["Поговори", "со мной!"],
  ["Nói chuyện", "với tôi!"], ["Ngobrol", "denganku!"], ["Ongea", "nami!"], ["Mluv", "se mnou!"],
  ["Vorbește", "cu mine!"], ["Beszélj", "velem!"], ["Bercakap", "dengan saya!"], ["Khuluma", "nami!"],
  ["Talaðu", "við mig!"], ["Bá mi", "sọ̀rọ̀!"], ["Поговори", "зі мною!"], ["Fale", "comigo!"],
];

const gridLayer = makeCanvas(W, H);
const gctx = gridLayer.getContext("2d");

function contactLayout() {
  if (V) {
    return {
      grid: { x: 0, y: 0, w: W, h: 900, cols: 6, rows: 4 },
      titleX: G, titleTop: 990, titleSize: 150,
      btn: { x: G, y: H - 210, w: W - 2 * G, h: 96 },
    };
  }
  return {
    grid: { x: W / 2, y: 0, w: W / 2, h: H, cols: 6, rows: 4 },
    titleX: G, titleTop: 250, titleSize: 148,
    btn: { x: G, y: H - 200, w: 420, h: 84 },
  };
}

function contactPointerPath(Lc) {
  const s = T.contactStart;
  const g = Lc.grid;
  const b = Lc.btn;
  const bx = b.x + b.w * (V ? 0.5 : 0.6);
  const by = b.y + b.h * 0.55;
  return [
    { t: s + 0.35, x: g.x + g.w * 0.85, y: g.y + g.h + 40 },
    { t: s + 0.9, x: g.x + g.w * 0.62, y: g.y + g.h * 0.55 },
    { t: s + 1.5, x: g.x + g.w * 0.3, y: g.y + g.h * 0.35 },
    { t: s + 2.05, x: g.x + g.w * 0.5, y: g.y + g.h * 0.7 },
    { t: s + 2.75, x: bx, y: by },
    { t: s + 4.2, x: bx, y: by },
  ];
}

/** Grade do InteractiveGridImage: faixas que crescem perto do ponteiro. */
function gridTracks(Lc, path, t) {
  const g = Lc.grid;
  const colW = new Array(g.cols).fill(1);
  const rowW = new Array(g.rows).fill(1);
  const s = T.contactStart;
  const steps = Math.max(0, Math.round((t - s) * FPS));
  const tracks = (weights, total) => {
    const sum = weights.reduce((a, b) => a + b, 0);
    const sizes = weights.map((w) => (w / sum) * total);
    const pos = [0];
    for (const z of sizes) pos.push(pos[pos.length - 1] + z);
    return { sizes, pos };
  };
  for (let i = 0; i <= steps; i++) {
    const tt = s + i / FPS;
    const p = catmull(path, tt);
    const lx = p.x - g.x;
    const ly = p.y - g.y;
    const active = tt > path[0].t && lx > 0 && lx < g.w && ly > 0 && ly < g.h;
    const cx = tracks(colW, g.w).pos;
    const cy = tracks(rowW, g.h).pos;
    for (let c = 0; c < g.cols; c++) {
      const d = (lx - (cx[c] + cx[c + 1]) / 2) / (0.16 * g.w);
      const target = active ? 1 + 2.6 * Math.exp(-0.5 * d * d) : 1;
      colW[c] += (target - colW[c]) * 0.1;
    }
    for (let r = 0; r < g.rows; r++) {
      const d = (ly - (cy[r] + cy[r + 1]) / 2) / (0.16 * g.h);
      const target = active ? 1 + 2.6 * Math.exp(-0.5 * d * d) : 1;
      rowW[r] += (target - rowW[r]) * 0.1;
    }
  }
  return { cols: tracks(colW, g.w), rows: tracks(rowW, g.h) };
}

function drawGrid(Lc, path, t) {
  const g = Lc.grid;
  const photo = asset("photos/armando-contato.webp");
  gctx.clearRect(0, 0, W, H);
  if (!photo) return;
  const [cx, cy, cw, ch] = coverCrop(photo.naturalWidth, photo.naturalHeight, g.w, g.h, 0.35);
  const { cols, rows } = gridTracks(Lc, path, t);
  const sw = cw / g.cols;
  const sh = ch / g.rows;
  gctx.fillStyle = "#ffffff";
  gctx.fillRect(g.x, g.y, g.w, g.h);
  for (let r = 0; r < g.rows; r++) {
    for (let c = 0; c < g.cols; c++) {
      const dx = g.x + cols.pos[c] + 0.75;
      const dy = g.y + rows.pos[r] + 0.75;
      const dw = Math.max(cols.sizes[c] - 1.5, 0.5);
      const dh = Math.max(rows.sizes[r] - 1.5, 0.5);
      gctx.drawImage(photo, cx + c * sw, cy + r * sh, sw, sh, dx, dy, dw, dh);
      const words = PHRASES[(r * g.cols + c) % PHRASES.length];
      const fs = Math.max(10, Math.min(dw, dh) * 0.11);
      const pad = fs * 0.5;
      font(gctx, fs, SANS, 500);
      const widest = Math.max(...words.map((w) => gctx.measureText(w).width));
      if (widest < dw - pad * 2 && fs * 1.15 * 2 < dh - pad * 2) {
        gctx.fillStyle = "#ffffff";
        gctx.textAlign = "right";
        gctx.textBaseline = "top";
        words.forEach((w, i) => gctx.fillText(w, dx + dw - pad, dy + pad + i * fs * 1.15));
      }
    }
  }
}

const contactLayer = makeCanvas(W, H);
const kctx = contactLayer.getContext("2d");

function drawContact(c, t) {
  const k = t - T.contactStart;
  const Lc = contactLayout();
  const path = contactPointerPath(Lc);
  c.fillStyle = PAPER;
  c.fillRect(0, 0, W, H);

  drawGrid(Lc, path, t);
  const g = Lc.grid;
  const amt = outCubic(prog(k, 0.15, 0.9));
  ditherReveal(c, gridLayer, [g.x, g.y, g.w, g.h], g.x, g.y, g.w, g.h, amt, lerp(22, 1, amt));

  c.fillStyle = INK;
  c.textAlign = "left";
  c.textBaseline = "alphabetic";
  const size = Lc.titleSize;
  font(c, size, INKTRAP, 900, "normal", "-0.01em");
  riseLine(c, "Vamos", Lc.titleX, Lc.titleTop + size * 0.8, size, prog(k, 0.3, 1.2));
  riseLine(c, "conversar?", Lc.titleX, Lc.titleTop + size * 0.8 + size * 0.86, size, prog(k, 0.42, 1.32));

  const afterTitle = Lc.titleTop + size * 0.8 + size * 0.86 + (V ? 90 : 80);
  reveal(c, prog(k, 0.6, 1.5), () => {
    font(c, V ? 34 : 30, SANS, 400);
    c.fillStyle = MUTED;
    c.fillText("Aberto a projetos, colaborações e boas ideias.", Lc.titleX, afterTitle);
  });

  const rows = [
    ["EMAIL", "armandocustodio0@gmail.com"],
    ["SITE", "ganwalk.github.io/portifolio"],
    ["INSTAGRAM", "@ganwalk"],
  ];
  const rowW = V ? W - 2 * G : W / 2 - 2 * G;
  const rowH = V ? 72 : 64;
  const rowsTop = afterTitle + (V ? 50 : 56);
  rows.forEach(([label, value], i) => {
    reveal(c, prog(k, 0.72 + i * 0.08, 1.62 + i * 0.08), () => {
      const y = rowsTop + i * rowH;
      c.fillStyle = "#d4d4d4";
      c.fillRect(Lc.titleX, y, rowW, 1);
      font(c, V ? 17 : 15, MONO, 400, "normal", "0.14em");
      c.fillStyle = MUTED;
      c.textAlign = "left";
      c.fillText(label, Lc.titleX, y + rowH / 2 + 6);
      font(c, V ? 24 : 21, MONO, 400);
      c.fillStyle = INK;
      c.textAlign = "right";
      c.fillText(value, Lc.titleX + rowW, y + rowH / 2 + 7);
      if (i === rows.length - 1) {
        c.fillStyle = "#d4d4d4";
        c.fillRect(Lc.titleX, y + rowH, rowW, 1);
      }
    });
  });

  // botão quadrado, que o cursor aperta
  const b = Lc.btn;
  const cur = catmull(path, t);
  const over = cur.x > b.x && cur.x < b.x + b.w && cur.y > b.y && cur.y < b.y + b.h && t > path[0].t;
  const press = prog(k, 3.05, 3.12) * (1 - prog(k, 3.2, 3.3));
  reveal(c, prog(k, 0.95, 1.85), () => {
    c.save();
    c.translate(b.x + b.w / 2, b.y + b.h / 2);
    c.scale(1 - press * 0.04, 1 - press * 0.04);
    c.translate(-(b.x + b.w / 2), -(b.y + b.h / 2));
    c.fillStyle = over ? PAPER : INK;
    c.fillRect(b.x, b.y, b.w, b.h);
    c.strokeStyle = INK;
    c.lineWidth = 2;
    c.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
    font(c, V ? 24 : 21, MONO, 500, "normal", "0.16em");
    c.fillStyle = over ? INK : LIGHT;
    c.textAlign = "center";
    c.fillText("FALE COMIGO  →", b.x + b.w / 2, b.y + b.h / 2 + 8);
    c.restore();
  });
  return { cur, over, path, btn: b };
}

function sceneContact(t) {
  const k = t - T.contactStart;
  const info = drawContact(kctx, t);
  const b = info.btn;
  const cx = b.x + b.w * (V ? 0.5 : 0.6);
  const cy = b.y + b.h * 0.55;
  const r = Math.hypot(W, H) * 1.3 * inOutCubic(prog(k, 3.15, 4.1));
  lens(contactLayer, cx, cy, r, 1);
  grain(t, 0.1);
  const clicking = k > 3.02 && k < 3.35;
  cursor(info.cur.x, info.cur.y, clicking ? "clique" : info.over ? "hover" : "repouso", prog(t, info.path[0].t, info.path[0].t + 0.1) * (1 - prog(k, 3.5, 3.8)));
}

// ─── cena 6: assinatura ────────────────────────────────────────────────────

function sceneEnd(t) {
  const z = t - T.endStart;
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);

  const pw = V ? 620 : 380;
  const ph = (pw * 9) / 8;
  const top = V ? 300 : 90;
  const px = (W - pw) / 2;
  const pin = prog(z, 0, 0.9);
  ditherPortrait(ctx, t - T.heroClock, px, top, pw, lerp(10, V ? 4 : 3.5, outCubic(pin)), t, 0);

  const nameSize = V ? 124 : 118;
  const nameBase = top + ph + (V ? 170 : 128);
  ctx.textAlign = "center";
  ctx.fillStyle = LIGHT;
  font(ctx, nameSize, INKTRAP, 900, "normal", "0.015em");
  if (V) {
    riseLine(ctx, "ARMANDO", W / 2, nameBase, nameSize, prog(z, 0.2, 1.1));
    riseLine(ctx, "CUSTODIO", W / 2, nameBase + nameSize * 0.86, nameSize, prog(z, 0.3, 1.2));
  } else {
    riseLine(ctx, "ARMANDO CUSTODIO", W / 2, nameBase, nameSize, prog(z, 0.2, 1.1));
  }
  const after = nameBase + (V ? nameSize * 0.86 : 0);
  reveal(ctx, prog(z, 0.45, 1.35), () => {
    font(ctx, V ? 50 : 44, SWITZER, 400, "italic");
    ctx.fillStyle = DIM;
    ctx.textAlign = "center";
    ctx.fillText("Talvez a gente ainda faça algo juntos.", W / 2, after + (V ? 110 : 84));
  });
  reveal(ctx, prog(z, 0.6, 1.5), () => {
    const label = "GANWALK.GITHUB.IO/PORTIFOLIO";
    font(ctx, V ? 26 : 22, MONO, 500, "normal", "0.16em");
    const w = ctx.measureText(label).width + 64;
    const bh = V ? 84 : 70;
    const by = after + (V ? 180 : 138);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(W / 2 - w / 2, by, w, bh);
    ctx.fillStyle = "#0b0b0d";
    ctx.textAlign = "center";
    ctx.fillText(label, W / 2, by + bh / 2 + 8);
    font(ctx, V ? 17 : 15, MONO, 400, "normal", "0.16em");
    ctx.fillStyle = DIM;
    ctx.fillText("DESIGN ENGINEER · BASEADO NO BRASIL · DISPONÍVEL NO MUNDO TODO", W / 2, by + bh + (V ? 70 : 56));
  });
  grain(t, 0.06);
}

// ─── mestre ────────────────────────────────────────────────────────────────

function draw(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (t < T.heroIn) {
    drawLoader(t);
    ctx.drawImage(loaderLayer, 0, 0);
  } else if (t < T.maniStart) {
    sceneHero(t);
    // o carregamento sai pela cortina de réguas, revelando a hero atrás
    const p = prog(t, T.heroIn, T.heroIn + 0.75);
    if (p < 1) {
      drawLoader(t);
      ctx.save();
      stripeClip(ctx, p, true);
      ctx.clip();
      ctx.drawImage(loaderLayer, 0, 0);
      ctx.restore();
    }
  } else if (t < T.projStart) {
    sceneManifesto(t);
  } else if (t < T.extrasStart) {
    sceneProjects(t);
  } else if (t < T.contactStart) {
    sceneExtras(t);
    // entra abrindo réguas pretas; sai fechando réguas de tinta
    stripes(prog(t, T.extrasStart, T.extrasStart + 0.6), "#050505", true);
    stripes(prog(t, T.contactStart - 0.42, T.contactStart), INK, false);
  } else if (t < T.endStart) {
    sceneContact(t);
    stripes(prog(t, T.contactStart + 0.04, T.contactStart + 0.5), INK, true);
  } else {
    sceneEnd(t);
  }
  hud(t);
  ctx.restore();
}

window.renderAt = async (frame) => {
  frameNo = frame;
  const t = frame / FPS;
  for (let attempt = 0; attempt < 6; attempt++) {
    pending = [];
    draw(t);
    if (pending.length === 0) break;
    await Promise.all(pending);
  }
  evict();
  return true;
};

window.meta = { W, H, FPS, DURATION, frames: Math.round(DURATION * FPS) };

window.ready = (async () => {
  const faces = [
    `900 100px "Whyte Inktrap"`,
    `700 100px "Whyte Inktrap"`,
    `italic 400 100px "Switzer"`,
    `400 100px "Switzer"`,
    `400 100px "IBM Plex Mono"`,
    `500 100px "IBM Plex Mono"`,
    `400 100px "Archivo"`,
    `500 100px "Archivo"`,
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, "AÀÚÇçãéíóú")));
  manifest = await (await fetch("/video/.cache/manifest.json")).json();
  const statics = [
    "frames/eu-lg.webp",
    "photos/armando-contato.webp",
    "cursor/repouso.webp",
    "cursor/hover.webp",
    "cursor/clique.webp",
    ...ILUSTRAS.map((n) => `photos/ilustra-${n}.webp`),
    ...LOGOS.filter((n) => n !== "SUA MARCA").map((n) => `logos/${n}.webp`),
  ];
  pending = [];
  statics.forEach(asset);
  await Promise.all(pending);
  for (const entry of cache.values()) entry.volatile = false;
  HL = heroLayout();
  return true;
})();
