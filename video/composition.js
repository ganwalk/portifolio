// Reel do portfólio, montado quadro a quadro num canvas só.
//
// A matéria-prima é o próprio site rodando: capture/shoot.mjs filma a landing
// de verdade com relógio virtual (a entrada, a lente de vidro da hero, as
// prévias ao vivo de cada case, a corrente de habilidades, os cartões do
// Playground, a grade do contato), e cada quadro gravado entra aqui como
// imagem. Nada do que se mexe no site vira foto parada: o que se mexe lá foi
// gravado se mexendo.
//
// Por cima, só o que costura as tomadas, na mesma linguagem da landing:
// · a matriz de Bayer (src/lib/dither.ts) é a porta de entrada e saída das
//   prévias;
// · o retrato em flipbook anda na batida de src/lib/portrait-frames.ts no
//   manifesto e na assinatura;
// · a lente que inverte tinta e papel cresce até engolir a tela nas viradas;
// · a cortina de réguas (StripeCurtain.tsx) troca de dobra.
//
// `renderAt(frame)` é função pura do quadro; render.mjs anda de quadro em
// quadro e entrega cada um pro ffmpeg.
//
// Formato por query string: ?f=landscape (1920×1080) ou ?f=portrait (1080×1920).

"use strict";

const params = new URLSearchParams(location.search);
const V = params.get("f") === "portrait";
const W = V ? 1080 : 1920;
const H = V ? 1920 : 1080;
const FPS = 30;
const FORMAT = V ? "portrait" : "landscape";
let DURATION = 0;
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
// Montado em buildTimeline(), depois de ler quanto durou cada tomada.
let T = {};

// ─── carregamento ──────────────────────────────────────────────────────────

const cache = new Map();
let pending = [];
let frameNo = 0;

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

// Pontos de clique de cada pose, os mesmos de src/app/[locale]/layout.tsx.
const HOTSPOT = { repouso: [2, 3], hover: [5, 0], clique: [4, 9] };

/** Desenha o cursor do site num ponto já em pixels do vídeo. `scale` é o
 *  devicePixelRatio da tomada (o sprite tem 56×63 px CSS). */
function cursor(x, y, state = "repouso", alpha = 1, scale = 1) {
  const img = asset(`cursor/${state}.webp`);
  if (!img || alpha <= 0) return;
  const [hx, hy] = HOTSPOT[state] || HOTSPOT.repouso;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x - hx * scale, y - hy * scale, img.naturalWidth * scale, img.naturalHeight * scale);
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

// ─── tomadas ao vivo ───────────────────────────────────────────────────────

const LIVE = {};
const SHOT_NAMES = ["hero", "skills", "extras", "contact", "project-ganwalk", "project-dezert", "project-pink", "project-intranet", "project-landing"];

function liveIndex(shot, time) {
  const info = LIVE[shot];
  return clamp(Math.floor(time * FPS + 1e-6), 0, info.frames - 1);
}

/** Quadro gravado da tomada no instante `time` (segundos da tomada). */
function live(shot, time) {
  const i = liveIndex(shot, time);
  return image(`/video/.cache/live/${FORMAT}/${shot}/${String(i + 1).padStart(4, "0")}.jpg`);
}

function liveCursor(shot, time, alpha = 1) {
  const info = LIVE[shot];
  const c = info.cursor[liveIndex(shot, time)];
  if (c) cursor(c.x, c.y, c.state || "repouso", alpha, info.scale);
}

function drawLive(c, shot, time) {
  const img = live(shot, time);
  if (img) c.drawImage(img, 0, 0, W, H);
  return img;
}

const liveLayer = makeCanvas(W, H);
const lvctx = liveLayer.getContext("2d");

// ─── HUD (só nas dobras que não são o site: nelas o cabeçalho é o do site) ──

function hud(t, label) {
  const a = 1;
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

// ─── cena 1: o site entrando, e a hero com a lente de vidro ────────────────

function sceneHero(t) {
  const k = t - T.hero;
  const clip = T.heroIn + k;
  drawLive(lvctx, "hero", clip);
  const face = LIVE.hero.meta.face;
  const r = Math.hypot(W, H) * 1.3 * inOutCubic(prog(clip, T.heroLens, T.heroLens + 0.9));
  lens(liveLayer, face.x, face.y, r, 1);
  liveCursor("hero", clip);
}

// ─── cena 2: manifesto ─────────────────────────────────────────────────────

function sceneManifesto(t) {
  const m = t - T.mani;
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);

  // O retrato sai de onde a lente o deixou e vira retículo.
  const face = LIVE.hero.meta.face;
  const startW = V ? 480 : 520;
  const start = { w: startW, x: face.x - startW / 2, y: face.y - startW * 1.125 * 0.38 };
  const endW = V ? 800 : 640;
  const end = V
    ? { w: endW, x: (W - endW) / 2, y: H - endW * 1.125 - 170 }
    : { w: endW, x: start.x + startW / 2 - endW / 2 - 40, y: (H - endW * 1.125) / 2 + 20 };
  const move = expo(prog(m, 0.05, 1.3));
  const pw = lerp(start.w, end.w, move) * lerp(1, 1.06, prog(m, 1.3, 3.4));
  const cx = lerp(start.x + start.w / 2, end.x + end.w / 2, move);
  const cy = lerp(start.y + start.w * 0.5625, end.y + end.w * 0.5625, move);
  const cell = lerp(1.2, 6, expo(prog(m, 0, 0.7))) + 10 * inCubic(prog(m, 2.9, 3.4));
  const fade = inCubic(prog(m, 2.85, 3.35)) * 1.01;
  ditherPortrait(ctx, t, cx - pw / 2, cy - pw * 0.5625, pw, cell, t, fade);

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
  ["DO BANKING", "À MÚSICA,"].forEach((line, i) => {
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
  hud(t, "02 · SOBRE");
}

// ─── cena 3: projetos, cada prévia gravada ao vivo ─────────────────────────

const PROJECTS = [
  {
    shot: "project-ganwalk",
    title: ["GANWALK"],
    area: "MÚSICA",
    headline: "Desenhei a identidade visual interativa do Ganwalk.",
    tags: ["WebGL", "Three.js", "Interatividade"],
  },
  {
    shot: "project-dezert",
    title: ["DEZERT HORSE"],
    titleP: ["DEZERT", "HORSE"],
    area: "MÚSICA",
    headline: "Projetei o universo interativo do Dezert Horse.",
    tags: ["WebGL", "Three.js", "Player embutido"],
  },
  {
    shot: "project-pink",
    title: ["PINK OPALA"],
    titleP: ["PINK", "OPALA"],
    area: "MÚSICA",
    headline: "Desenvolvi o site oficial do Pink Opala, duo indie pop de Goiânia.",
    tags: ["Canvas 2D", "Tailwind CSS", "Interatividade"],
  },
  {
    shot: "project-intranet",
    title: ["DESIGN SYSTEM"],
    titleP: ["DESIGN", "SYSTEM"],
    area: "BANKING",
    headline: "Construí uma intranet robusta para todo o ecossistema.",
    metrics: [
      [70, "", "componentes documentados"],
      [110, "", "componentes React no total"],
      [10, "", "áreas mapeadas no tom de voz"],
    ],
  },
  {
    shot: "project-landing",
    title: ["LANDING PAGES"],
    titleP: ["LANDING", "PAGES"],
    area: "BANKING",
    headline: "Desenho e mantenho o ecossistema de webpages da AUVP Capital.",
    metrics: [
      [20, " mil+", "acessos diários"],
      [90, "+/100", "performance mínima"],
      [8, "%+", "conversão"],
    ],
  },
];

function sceneProjects(t) {
  const list = PROJECTS.filter((p) => LIVE[p.shot]);
  const k = Math.min(list.length - 1, Math.floor((t - T.proj) / T.projDur));
  const p = list[k];
  const u = t - T.proj - k * T.projDur;
  const D = T.projDur;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, W, H);

  // a prévia ao vivo, entrando e saindo pela matriz
  const clip = 0.2 + u;
  const img = live(p.shot, clip);
  const inP = prog(u, 0, 0.7);
  const outP = prog(u, D - 0.5, D);
  const amount = Math.min(outCubic(inP), 1 - inCubic(outP));
  const cell = outP > 0 ? lerp(1, 26, inCubic(outP)) : lerp(26, 1, outCubic(inP));
  const push = lerp(1.05, 1, outCubic(prog(u, 0, D)));
  if (img) {
    const dw = W * push;
    const dh = H * push;
    ditherReveal(ctx, img, [0, 0, img.naturalWidth, img.naturalHeight], (W - dw) / 2, (H - dh) / 2, dw, dh, amount, cell);
  }

  // leitura: escurece a base, como o gradiente dos cards do carrossel
  const g = ctx.createLinearGradient(0, H * (V ? 0.45 : 0.35), 0, H);
  g.addColorStop(0, "rgba(5,5,5,0)");
  g.addColorStop(1, "rgba(5,5,5,0.88)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  if (!V) {
    const g2 = ctx.createLinearGradient(0, 0, W * 0.6, 0);
    g2.addColorStop(0, "rgba(5,5,5,0.5)");
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
  const top = ctx.createLinearGradient(0, 0, 0, V ? 320 : 220);
  top.addColorStop(0, "rgba(5,5,5,0.6)");
  top.addColorStop(1, "rgba(5,5,5,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H);

  // o cursor só aparece onde a prévia reage a ele (Pink Opala)
  liveCursor(p.shot, clip, amount);

  const fade = 1 - prog(u, D - 0.55, D - 0.25);

  ctx.save();
  ctx.globalAlpha = fade;
  reveal(ctx, prog(u, 0.2, 1.0), () => {
    font(ctx, V ? 20 : 17, MONO, 400, "normal", "0.16em");
    ctx.fillStyle = LIGHT;
    ctx.textAlign = "left";
    const y = V ? 240 : 150;
    ctx.fillText(`0${k + 1} / 0${list.length}  ·  ${p.area}`, G, y);
    for (let i = 0; i < list.length; i++) {
      ctx.beginPath();
      ctx.arc(W - G - (list.length - 1 - i) * 22, y - 6, 5, 0, Math.PI * 2);
      ctx.fillStyle = i === k ? LIGHT : "rgba(244,244,244,0.3)";
      ctx.fill();
    }
  });
  ctx.restore();

  const lines = V && p.titleP ? p.titleP : p.title;
  const maxW = V ? W - 2 * G : p.metrics ? W * 0.56 : W * 0.62;
  const size = fitSize(ctx, lines, INKTRAP, 900, maxW, V ? 190 : 210);
  const lastBase = V ? H - 560 : H - 240;
  font(ctx, size, INKTRAP, 900, "normal", "0.01em");
  ctx.fillStyle = LIGHT;
  ctx.textAlign = "left";
  lines.forEach((line, i) => {
    const b = lastBase - (lines.length - 1 - i) * size * 0.88;
    riseLine(ctx, line, G, b, size, prog(u, 0.3 + i * 0.1, 1.2 + i * 0.1), { exit: prog(u, D - 0.6 + i * 0.05, D - 0.1) });
  });

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
    ctx.fillStyle = "#d6d6d6";
    ctx.textAlign = "left";
    if (V) wrap(ctx, p.headline, W - 2 * G).forEach((l, i) => ctx.fillText(l, G, H - 490 + i * 42));
    else wrap(ctx, p.headline, 430).forEach((l, i) => ctx.fillText(l, G + btnW + 32, btnY + 24 + i * 32));
  });

  if (p.metrics) {
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
        ctx.fillStyle = "rgba(5,5,5,0.35)";
        ctx.fillRect(x, y, widths[i], 45);
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
  grain(t, 0.05);
  hud(t, "03 · PROJETOS");
}

// ─── cenas 4, 5 e 6: o resto da página, gravado com o mouse de verdade ─────

function sceneSkills(t) {
  const clip = T.skillsIn + (t - T.skills);
  drawLive(ctx, "skills", clip);
  liveCursor("skills", clip);
  // entra abrindo réguas pretas (a última prévia saiu pro preto)
  stripes(prog(t, T.skills, T.skills + 0.6), "#050505", true);
  // sai fechando réguas de tinta
  stripes(prog(t, T.extras - 0.42, T.extras), INK, false);
}

function sceneExtras(t) {
  const clip = T.extrasIn + (t - T.extras);
  drawLive(ctx, "extras", clip);
  liveCursor("extras", clip);
  stripes(prog(t, T.extras + 0.04, T.extras + 0.5), INK, true);
}

function sceneContact(t) {
  const k = t - T.contact;
  const clip = T.contactIn + k;
  const wipe = prog(k, 0, 0.7);
  lvctx.fillStyle = PAPER;
  lvctx.fillRect(0, 0, W, H);
  if (wipe < 1) {
    // passagem pela matriz: o contato acende sobre o Playground, pixel a pixel
    drawLive(lvctx, "extras", T.extrasIn + (t - T.extras));
    const img = live("contact", clip);
    if (img) ditherReveal(lvctx, img, [0, 0, img.naturalWidth, img.naturalHeight], 0, 0, W, H, outCubic(wipe), lerp(18, 1, outCubic(wipe)));
  } else {
    drawLive(lvctx, "contact", clip);
  }
  const email = LIVE.contact.email;
  const r = Math.hypot(W, H) * 1.3 * inOutCubic(prog(clip, T.contactLens, T.contactLens + 0.9));
  lens(liveLayer, email.x, email.y, r, 1);
  if (wipe >= 1) liveCursor("contact", clip, 1 - prog(clip, T.contactLens + 0.2, T.contactLens + 0.5));
}

// ─── cena 7: assinatura ────────────────────────────────────────────────────

function sceneEnd(t) {
  const z = t - T.end;
  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, W, H);

  const pw = V ? 620 : 380;
  const ph = (pw * 9) / 8;
  const top = V ? 300 : 90;
  const px = (W - pw) / 2;
  ditherPortrait(ctx, t, px, top, pw, lerp(10, V ? 4 : 3.5, outCubic(prog(z, 0, 0.9))), t, 0);

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

function buildTimeline() {
  const entry = LIVE.hero.meta.entry;
  const t = {};
  t.hero = 0;
  t.heroIn = Math.max(0, entry - 1.8);
  t.heroLens = entry + 6.95;
  t.mani = t.heroLens + 0.95 - t.heroIn;
  t.proj = t.mani + 3.4;
  t.projDur = 3.2;
  t.skills = t.proj + t.projDur * PROJECTS.filter((p) => LIVE[p.shot]).length;
  t.skillsIn = 0.8;
  t.extras = t.skills + Math.min(4.8, LIVE.skills.frames / FPS - t.skillsIn);
  t.extrasIn = 0.5;
  t.contact = t.extras + 5.0;
  t.contactIn = 0.2;
  t.contactLens = 4.0;
  t.end = t.contact + (t.contactLens + 0.95 - t.contactIn);
  T = t;
  DURATION = t.end + 2.8;
}

function draw(t) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (t < T.mani) sceneHero(t);
  else if (t < T.proj) sceneManifesto(t);
  else if (t < T.skills) sceneProjects(t);
  else if (t < T.extras) sceneSkills(t);
  else if (t < T.contact) sceneExtras(t);
  else if (t < T.end) sceneContact(t);
  else sceneEnd(t);
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

window.ready = (async () => {
  const faces = [
    `900 100px "Whyte Inktrap"`,
    `700 100px "Whyte Inktrap"`,
    `italic 400 100px "Switzer"`,
    `400 100px "IBM Plex Mono"`,
    `500 100px "IBM Plex Mono"`,
    `400 100px "Archivo"`,
  ];
  await Promise.all(faces.map((f) => document.fonts.load(f, "AÀÚÇçãéíóú")));
  for (const shot of SHOT_NAMES) {
    const res = await fetch(`/video/.cache/live/${FORMAT}/${shot}/cursor.json`);
    if (!res.ok) continue;
    LIVE[shot] = await res.json();
  }
  LIVE.hero.meta = await (await fetch(`/video/.cache/live/${FORMAT}/hero/meta.json`)).json();
  pending = [];
  ["frames/eu-lg.webp", "cursor/repouso.webp", "cursor/hover.webp", "cursor/clique.webp"].forEach(asset);
  await Promise.all(pending);
  for (const entry of cache.values()) entry.volatile = false;
  buildTimeline();
  window.meta = { W, H, FPS, DURATION, frames: Math.round(DURATION * FPS), T };
  return true;
})();
