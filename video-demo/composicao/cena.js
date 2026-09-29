// Composição do vídeo de demonstração do portfólio.
//
// Tudo é desenhado num canvas só, e cada quadro é função pura do tempo:
// window.renderFrame(t) desenha o instante t (segundos) e devolve o PNG.
// Nada depende de relógio real, então render.mjs pode exportar quadro a
// quadro sem engasgo, nas duas proporções (?f=h para 16:9, ?f=v para 9:16).
//
// A linguagem visual é a do site: preto e branco, cor só na mídia dos
// projetos, retrato em flipbook, lente que inverte tinta e papel, retículo
// de Bayer (o dither dos cartões de Extras), cortina de réguas, a mão como
// cursor e a grade que se deforma no contato.

const params = new URLSearchParams(location.search);
const VERTICAL = params.get("f") === "v";
const W = VERTICAL ? 1080 : 1920;
const H = VERTICAL ? 1920 : 1080;
const FPS = 30;
const u = W / (VERTICAL ? 1080 : 1920); // unidade de desenho, 1 nos dois formatos
const G = VERTICAL ? 64 : 96; // gutter

const canvas = document.getElementById("c");
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext("2d");

const PUB = "../../public/";
const CACHE = "../.cache/";

// Tokens de cor do site (globals.css).
const PAPER = "#ffffff";
const INK = "#0b0b0b";
const MUTED = "#6d6d6d";
const NIGHT = "#0a0a0a";
const CHALK = "#f4f4f4";
const MUTED_DARK = "#9b9b9b";

/* ------------------------------------------------------------ utilidades */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, p) => a + (b - a) * p;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const outQuint = (p) => 1 - Math.pow(1 - p, 5);
const outCubic = (p) => 1 - Math.pow(1 - p, 3);
const inCubic = (p) => p * p * p;
const inOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const outBack = (p) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeCanvas(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

/* --------------------------------------------------------------- imagens */

// Carregamento sob demanda: a cena pede a imagem, se ainda não chegou o
// quadro é redesenhado depois que todas as pendentes carregarem.
const images = new Map();
const pending = new Set();
const order = [];

function img(url) {
  let entry = images.get(url);
  if (!entry) {
    const el = new Image();
    entry = { el, ok: false };
    const p = new Promise((resolve) => {
      el.onload = () => {
        entry.ok = true;
        resolve();
      };
      el.onerror = () => {
        console.error("falhou", url);
        entry.ok = true;
        entry.broken = true;
        resolve();
      };
    });
    entry.p = p;
    el.src = url;
    images.set(url, entry);
    if (url.includes(".cache/")) {
      order.push(url);
      if (order.length > 160) images.delete(order.shift());
    }
  }
  if (!entry.ok) {
    pending.add(entry.p);
    return null;
  }
  return entry.broken ? null : entry.el;
}

// Sequências de quadros extraídas por preparar-midia.sh e capture-dezert.mjs.
const SEQ = {
  ganwalkH: { dir: "ganwalk-h", n: 240, first: 0 },
  ganwalkV: { dir: "ganwalk-v", n: 240, first: 0 },
  dezertH: { dir: "dezert-h", n: 360, first: 0 },
  dezertV: { dir: "dezert-v", n: 360, first: 0 },
  pinkH: { dir: "pinkh", n: 240, first: 1 },
  pinkV: { dir: "pinkv", n: 240, first: 1 },
  intranet: { dir: "intranet", n: 270, first: 1 },
  cagumela: { dir: "cagumela", n: 240, first: 1 },
  musica: { dir: "musica", n: 240, first: 1 },
};

function seqFrame(name, localT, offset = 0) {
  const s = SEQ[name];
  const i = (Math.floor(localT * FPS) + offset) % s.n;
  return img(`${CACHE}${s.dir}/${String(i + s.first).padStart(4, "0")}.jpg`);
}

function drawCover(c, source, x, y, w, h, { zoom = 1, ax = 0.5, ay = 0.5 } = {}) {
  if (!source) return;
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = Math.max(w / sw, h / sh) * zoom;
  const dw = sw * scale;
  const dh = sh * scale;
  c.drawImage(source, x + (w - dw) * ax, y + (h - dh) * ay, dw, dh);
}

function drawContain(c, source, x, y, w, h) {
  if (!source) return;
  const sw = source.naturalWidth || source.width;
  const sh = source.naturalHeight || source.height;
  const scale = Math.min(w / sw, h / sh);
  c.drawImage(source, x + (w - sw * scale) / 2, y + (h - sh * scale) / 2, sw * scale, sh * scale);
}

/* ---------------------------------------------------------------- dither */

// Mesmo motor de src/lib/dither.ts: matriz de Bayer, luminância Rec. 601,
// cor original acima do limiar e tinta abaixo dele.
function buildBayer(size) {
  let m = [0];
  let s = 1;
  while (s < size) {
    const next = s * 2;
    const grown = new Array(next * next);
    for (let y = 0; y < s; y++) {
      for (let x = 0; x < s; x++) {
        const v = m[y * s + x];
        grown[y * next + x] = 4 * v;
        grown[y * next + (x + s)] = 4 * v + 2;
        grown[(y + s) * next + x] = 4 * v + 3;
        grown[(y + s) * next + (x + s)] = 4 * v + 1;
      }
    }
    m = grown;
    s = next;
  }
  return Uint16Array.from(m);
}
const BAYER4 = buildBayer(4);
const BAYER8 = buildBayer(8);

const small = makeCanvas(8, 8);
const sctx = small.getContext("2d", { willReadFrequently: true });

/**
 * Desenha `source` em (x, y, w, h) como retículo de Bayer com células de
 * `cell` px. `fit`: função que desenha a fonte num contexto de tamanho dado
 * (permite cover, contain, fundo branco para o retrato transparente...).
 */
function ditherBlit(dst, fit, x, y, w, h, cell, { phase = 0, bias = 0, dark = [0, 0, 0], matrix = 4, keepWhite = false } = {}) {
  cell = Math.max(1, Math.round(cell));
  const sw = Math.ceil(w / cell);
  const sh = Math.ceil(h / cell);
  if (small.width !== sw || small.height !== sh) {
    small.width = sw;
    small.height = sh;
  }
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  sctx.clearRect(0, 0, sw, sh);
  fit(sctx, sw, sh);
  const image = sctx.getImageData(0, 0, sw, sh);
  const d = image.data;
  const m = matrix === 8 ? BAYER8 : BAYER4;
  const mask = matrix - 1;
  const scale = 255 / (matrix * matrix);
  const px = phase % matrix;
  const py = Math.floor(phase / matrix) % matrix;
  for (let yy = 0; yy < sh; yy++) {
    const row = ((yy + py) & mask) * matrix;
    for (let xx = 0; xx < sw; xx++) {
      const i = (yy * sw + xx) * 4;
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const threshold = m[row + ((xx + px) & mask)] * scale + bias;
      if (lum < threshold && !(keepWhite && lum > 246)) {
        d[i] = dark[0];
        d[i + 1] = dark[1];
        d[i + 2] = dark[2];
      }
      d[i + 3] = 255;
    }
  }
  sctx.putImageData(image, 0, 0);
  dst.save();
  dst.beginPath();
  dst.rect(x, y, w, h);
  dst.clip();
  dst.imageSmoothingEnabled = false;
  dst.drawImage(small, 0, 0, sw, sh, x, y, sw * cell, sh * cell);
  dst.restore();
}

/** Revelação pelo retículo: células grossas afinando em degraus até a
 *  imagem limpa, o gesto do hover dos cartões de Extras esticado no tempo. */
function ditherReveal(dst, fit, x, y, w, h, p, { maxCell = 40, bias = 10, dark, keepWhite = false } = {}) {
  if (p >= 1) {
    dst.save();
    dst.beginPath();
    dst.rect(x, y, w, h);
    dst.clip();
    dst.translate(x, y);
    fit(dst, w, h);
    dst.restore();
    return;
  }
  const steps = [maxCell, maxCell * 0.6, maxCell * 0.36, maxCell * 0.2, maxCell * 0.11, 3, 2];
  const k = Math.min(steps.length - 1, Math.floor(outCubic(p) * steps.length));
  ditherBlit(dst, fit, x, y, w, h, steps[k] * u, { bias: bias * (1 - p), dark, phase: k * 5, keepWhite });
  // Últimos instantes: a imagem limpa entra por cima, dissolvendo o retículo.
  const clean = prog(p, 0.78, 1);
  if (clean > 0) {
    dst.save();
    dst.globalAlpha = clean;
    dst.beginPath();
    dst.rect(x, y, w, h);
    dst.clip();
    dst.translate(x, y);
    fit(dst, w, h);
    dst.restore();
  }
}

/* ------------------------------------------------------------------ grão */

const GRAIN = [0, 1, 2, 3].map((k) => {
  const c = makeCanvas(256, 256);
  const g = c.getContext("2d");
  const id = g.createImageData(256, 256);
  const rnd = mulberry32(1000 + k);
  for (let i = 0; i < id.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
    id.data[i + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
});

function grain(t, alpha) {
  // Salta de posição em degraus, não desliza: estática de filme, como a
  // .texture-noise-animate da hero.
  const step = Math.floor(t * 12);
  const rnd = mulberry32(step * 7 + 3);
  const tile = GRAIN[step % GRAIN.length];
  const ox = -Math.floor(rnd() * 256);
  const oy = -Math.floor(rnd() * 256);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = "overlay";
  for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) ctx.drawImage(tile, x, y);
  ctx.restore();
}

/* ------------------------------------------------------------------ texto */

function font(family, size, weight = 400, style = "normal") {
  const fam = {
    whyte: '"Whyte Inktrap"',
    bric: '"Bricolage"',
    archivo: '"Archivo"',
    mono: '"Plex Mono"',
    switzer: '"Switzer"',
  }[family];
  return `${style} ${weight} ${size}px ${fam}, sans-serif`;
}

function setFont(c, f, spacing = 0) {
  c.font = f;
  c.letterSpacing = `${spacing}px`;
}

function measure(text, f, spacing = 0) {
  setFont(ctx, f, spacing);
  return ctx.measureText(text).width;
}

/** Maior tamanho (até `max`) em que todas as linhas cabem em `width`. */
function fitSize(lines, make, width, max, spacingEm = 0) {
  let size = max;
  for (const line of lines) {
    const w = measure(line, make(100), 100 * spacingEm);
    size = Math.min(size, (width / w) * 100);
  }
  return Math.floor(size);
}

function wrap(text, f, maxW) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (measure(test, f) > maxW && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** Linha que sobe de trás de uma máscara (a entrada do nome na hero). `out`
 *  faz a mesma linha sair por cima. */
function revealLine(text, x, baseline, f, color, p, lineH, { out = 0, align = "left", spacing = 0 } = {}) {
  if (p <= 0 || out >= 1) return;
  const e = outQuint(p);
  const o = inCubic(out);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, baseline - lineH * 0.98, W, lineH * 1.28);
  ctx.clip();
  setFont(ctx, f, spacing);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(text, x, baseline + (1 - e) * lineH * 1.1 - o * lineH * 1.1);
  ctx.restore();
}

function fadeText(text, x, y, f, color, p, { align = "left", spacing = 0, rise = 14, baseline = "alphabetic" } = {}) {
  if (p <= 0) return;
  const e = outCubic(p);
  ctx.save();
  ctx.globalAlpha *= e;
  setFont(ctx, f, spacing);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y + (1 - e) * rise * u);
  ctx.restore();
}

function monoLabel(text, x, y, color, p = 1, align = "left", size = 17) {
  fadeText(text.toUpperCase(), x, y, font("mono", size * u, 500), color, p, { align, spacing: size * u * 0.08, rise: 8 });
}

/* ----------------------------------------------------------------- cursor */

const CURSOR = {
  repouso: `${PUB}cursor/repouso.webp`,
  hover: `${PUB}cursor/hover.webp`,
  clique: `${PUB}cursor/clique.webp`,
};

/** Trajeto por pontos-chave: pausa em cada ponto, curva Catmull-Rom entre
 *  eles, como alguém mirando e parando em cima de cada coisa. */
function path(keys, t) {
  if (t <= keys[0].t) return { x: keys[0].x, y: keys[0].y };
  const last = keys[keys.length - 1];
  if (t >= last.t) return { x: last.x, y: last.y };
  let i = 0;
  while (keys[i + 1].t < t) i++;
  const p0 = keys[Math.max(0, i - 1)];
  const p1 = keys[i];
  const p2 = keys[i + 1];
  const p3 = keys[Math.min(keys.length - 1, i + 2)];
  const s = inOutCubic((t - p1.t) / (p2.t - p1.t));
  const cr = (a, b, c, d) =>
    0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s * s + (-a + 3 * b - 3 * c + d) * s * s * s);
  return { x: cr(p0.x, p1.x, p2.x, p3.x), y: cr(p0.y, p1.y, p2.y, p3.y) };
}

let cursorState = null;
function drawCursor() {
  if (!cursorState) return;
  const { x, y, pose = "repouso", alpha = 1 } = cursorState;
  const im = img(CURSOR[pose]);
  if (!im) return;
  const s = 1.7 * u;
  ctx.save();
  ctx.globalAlpha = alpha;
  // Ponta do dedo como ponto quente, igual ao CSS do site.
  ctx.drawImage(im, x - 4 * s, y - 4 * s, 56 * s, 63 * s);
  ctx.restore();
}

/* ------------------------------------------------------ cortina de réguas */

// StripeCurtain.tsx: réguas verticais alternando a dobradiça entre topo e
// base, fechando em leque da esquerda para a direita, segurando um instante
// e abrindo no mesmo padrão.
function curtain(t, start, dur = 1.1, color = INK) {
  const p = (t - start) / dur;
  if (p <= 0 || p >= 1) return;
  const n = VERTICAL ? 7 : 12;
  const sw = W / n;
  ctx.save();
  ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const delay = (i / n) * 0.18;
    let s;
    if (p < 0.5) s = outCubic(clamp((p - delay) / 0.3));
    else s = 1 - inOutCubic(clamp((p - 0.55 - delay) / 0.27));
    if (s <= 0) continue;
    const h = H * s;
    const fromTop = i % 2 === 0;
    ctx.fillRect(Math.floor(i * sw), fromTop ? 0 : H - h, Math.ceil(sw) + 1, h);
  }
  ctx.restore();
}

/* ------------------------------------------------------------ moldura fixa */

function chrome(dark, right, p = 1) {
  const c = dark ? MUTED_DARK : MUTED;
  monoLabel("Armando Custodio · Design Engineer", G, 62 * u, c, p);
  monoLabel(right, W - G, 62 * u, c, p, "right");
}

/* ============================================================== ROTEIRO */

const T = {
  hero: [0, 6.3],
  curtain1: 5.78,
  manifesto: [6.3, 10.0],
  solutions: 10.0,
  solutionDur: 5.6,
  curtain2: 37.55,
  extras: [38.0, 43.6],
  brands: [43.2, 47.0],
  curtain3: 46.5,
  contact: [47.0, 55.0],
  total: 55.0,
};

/* ------------------------------------------------------------------ hero */

// Retrato: mesma sequência de src/lib/portrait-frames.ts (quadros 1 a 12 a
// 85 ms, cada volta terminando numa das quatro expressões, que seguram 700 ms).
const PORTRAIT_STEPS = [13, 14, 15, 16].flatMap((end) => [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((f) => ({ f, hold: 0.085 })),
  { f: end, hold: 0.7 },
]);
const PORTRAIT_CYCLE = PORTRAIT_STEPS.reduce((a, s) => a + s.hold, 0);

function portraitAt(t) {
  let local = ((t % PORTRAIT_CYCLE) + PORTRAIT_CYCLE) % PORTRAIT_CYCLE;
  let endings = Math.floor(t / PORTRAIT_CYCLE) * 4;
  for (const s of PORTRAIT_STEPS) {
    if (s.f >= 13) {
      if (local < s.hold) return { frame: s.f, endings: endings + 1, sinceEnding: local };
      endings++;
    }
    if (local < s.hold) return { frame: s.f, endings, sinceEnding: null };
    local -= s.hold;
  }
  return { frame: 1, endings, sinceEnding: null };
}

function portraitFit(frame, bg = PAPER) {
  const sheet = img(`${PUB}frames/eu-lg.webp`);
  return (c, w, h) => {
    if (bg) {
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
    }
    if (!sheet) return;
    const fw = sheet.naturalWidth / 4;
    const fh = sheet.naturalHeight / 4;
    const i = frame - 1;
    const sx = (i % 4) * fw;
    const sy = Math.floor(i / 4) * fh;
    const scale = Math.min(w / fw, h / fh);
    c.drawImage(sheet, sx, sy, fw, fh, (w - fw * scale) / 2, h - fh * scale, fw * scale, fh * scale);
  };
}

const WORDS = ["produtos", "experiências", "aplicativos", "interfaces", "sistemas", "músicas", "sonhos", "embalagens", "sites"];

function heroLayout() {
  const nameLines = ["ARMANDO", "CUSTODIO"];
  if (!VERTICAL) {
    const ph = H * 0.7;
    const pw = (ph * 640) / 719;
    const px = W - G - pw + 10 * u;
    const py = H - ph - 120 * u;
    const fs = fitSize(nameLines, (s) => font("whyte", s, 900), px - G - 40 * u, 230 * u, 0.015);
    const b1 = 330 * u + fs * 0.72;
    return { nameLines, fs, nx: G, b1, b2: b1 + fs * 0.9, sub: b1 + fs * 0.9 + 88 * u, subSize: 50 * u, px, py, pw, ph, cta: { x: G, y: H - 212 * u, w: 330 * u, h: 72 * u }, avail: H - 72 * u };
  }
  const fs = fitSize(nameLines, (s) => font("whyte", s, 900), W - 2 * G, 260 * u, 0.015);
  const b1 = 170 * u + fs * 0.72;
  const b2 = b1 + fs * 0.9;
  const sub = b2 + 84 * u;
  const top = sub + 40 * u;
  const bottom = H - 290 * u;
  const ph = bottom - top;
  const pw = (ph * 640) / 719;
  return { nameLines, fs, nx: G, b1, b2, sub, subSize: 52 * u, px: (W - pw) / 2, py: top, pw, ph, cta: { x: G, y: H - 240 * u, w: 330 * u, h: 72 * u }, avail: H - 90 * u };
}

function sceneHero(t) {
  const L = heroLayout();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  // Retrato girando, nascendo do retículo.
  const pt = Math.max(0, t - 0.15);
  const { frame, endings, sinceEnding } = portraitAt(pt);
  const reveal = prog(t, 0.15, 2.3);
  ditherReveal(ctx, portraitFit(frame), L.px, L.py, L.pw, L.ph, reveal, { maxCell: 34, bias: 30, dark: [11, 11, 11], keepWhite: true });

  // Nome, uma palavra por linha.
  const nf = font("whyte", L.fs, 900);
  revealLine(L.nameLines[0], L.nx, L.b1, nf, INK, prog(t, 0.45, 1.35), L.fs * 0.92, { spacing: L.fs * 0.015 });
  revealLine(L.nameLines[1], L.nx, L.b2, nf, INK, prog(t, 0.6, 1.5), L.fs * 0.92, { spacing: L.fs * 0.015 });

  // "Designer de [roleta]": a palavra troca junto com a expressão do rosto.
  const subP = prog(t, 1.0, 1.7);
  if (subP > 0) {
    const prefix = "Designer de ";
    const pf = font("switzer", L.subSize, 400);
    const wf = font("switzer", L.subSize, 400, "italic");
    fadeText(prefix, L.nx, L.sub, pf, INK, subP);
    const px = L.nx + measure(prefix, pf);
    const idx = endings % WORDS.length;
    const k = sinceEnding === null ? 1 : clamp(sinceEnding / 0.32);
    ctx.save();
    ctx.beginPath();
    ctx.rect(px - 4, L.sub - L.subSize * 0.95, W, L.subSize * 1.25);
    ctx.clip();
    const e = outQuint(k);
    if (k < 1) fadeText(WORDS[(idx + WORDS.length - 1) % WORDS.length], px, L.sub - e * L.subSize * 1.5, wf, INK, subP, { rise: 0 });
    fadeText(WORDS[idx], px, L.sub + (1 - e) * L.subSize * 1.5, wf, INK, subP, { rise: 0 });
    ctx.restore();
  }

  // Botão quadrado "Veja meu trabalho" e a linha de disponibilidade.
  const ctaP = outCubic(prog(t, 1.35, 1.95));
  const clickAt = 5.45;
  const hover = prog(t, 5.05, 5.2);
  if (ctaP > 0) {
    const { x, y, w, h } = L.cta;
    ctx.save();
    ctx.globalAlpha = ctaP;
    const pressed = t > clickAt && t < clickAt + 0.18;
    const yy = y + (1 - ctaP) * 16 * u + (pressed ? 3 * u : 0);
    ctx.fillStyle = INK;
    ctx.fillRect(x, yy, w, h);
    ctx.fillStyle = PAPER;
    ctx.globalAlpha = ctaP * (1 - hover);
    setFont(ctx, font("mono", 18 * u, 500), 18 * u * 0.08);
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText("VEJA MEU TRABALHO", x + 28 * u, yy + h / 2 + 1);
    ctx.fillText("↓", x + w - 44 * u, yy + h / 2 + 1);
    // Hover: o papel invade o botão da esquerda para a direita.
    if (hover > 0) {
      ctx.globalAlpha = ctaP;
      ctx.fillStyle = PAPER;
      ctx.fillRect(x + 2 * u, yy + 2 * u, (w - 4 * u) * outCubic(hover), h - 4 * u);
      ctx.fillStyle = INK;
      ctx.fillText("VEJA MEU TRABALHO", x + 28 * u, yy + h / 2 + 1);
      ctx.fillText("↓", x + w - 44 * u, yy + h / 2 + 1);
    }
    ctx.restore();
  }
  fadeText("Baseado no Brasil · Disponível para projetos no mundo todo 🌍", G, L.avail, font("archivo", 24 * u, 400), MUTED, prog(t, 1.6, 2.2));
  chrome(false, "Portfólio 2026", prog(t, 0.3, 0.9));

  // Cursor entra, passeia pelo nome com a lente e aperta o botão.
  const nameMid = L.b1 - L.fs * 0.35;
  const keys = VERTICAL
    ? [
        { t: 2.1, x: W + 60 * u, y: H * 0.55 },
        { t: 2.8, x: W * 0.72, y: nameMid },
        { t: 3.6, x: W * 0.36, y: L.b2 - L.fs * 0.3 },
        { t: 4.3, x: W * 0.55, y: L.py + L.ph * 0.3 },
        { t: 5.05, x: L.cta.x + L.cta.w * 0.62, y: L.cta.y + L.cta.h * 0.55 },
      ]
    : [
        { t: 2.1, x: W * 0.62, y: H + 60 * u },
        { t: 2.85, x: L.nx + measure("ARMANDO", font("whyte", L.fs, 900)) * 0.78, y: nameMid },
        { t: 3.7, x: L.nx + measure("CUST", font("whyte", L.fs, 900)), y: L.b2 - L.fs * 0.32 },
        { t: 4.35, x: L.px + L.pw * 0.45, y: L.py + L.ph * 0.35 },
        { t: 5.05, x: L.cta.x + L.cta.w * 0.62, y: L.cta.y + L.cta.h * 0.55 },
      ];
  const c = path(keys, t);
  // Lente: inverte tinta e papel com borda difusa, encolhe perto do botão.
  const nearCta = prog(t, 4.5, 5.0);
  const r = 190 * u * outBack(prog(t, 2.45, 3.0)) * (1 - 0.8 * nearCta) * (1 - prog(t, 5.3, 5.6));
  if (r > 1) {
    const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.72, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.save();
    ctx.globalCompositeOperation = "difference";
    ctx.fillStyle = g;
    ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
    ctx.restore();
  }
  if (t > 2.1) {
    const pose = t > clickAt && t < clickAt + 0.2 ? "clique" : hover > 0 ? "hover" : "repouso";
    cursorState = { ...c, pose };
  }
}

/* ------------------------------------------------------------- manifesto */

// Campo de pontos de Bayer respirando no fundo escuro: o retículo como
// textura, sem imagem nenhuma por trás.
const FIELD_CELL = 6;
const field = makeCanvas(1, 1);
const fctx = field.getContext("2d");
function ditherField(t, alpha = 1, tone = [34, 34, 34], bg = [10, 10, 10]) {
  const fw = Math.ceil(W / (FIELD_CELL * u));
  const fh = Math.ceil(H / (FIELD_CELL * u));
  if (field.width !== fw || field.height !== fh) {
    field.width = fw;
    field.height = fh;
  }
  const id = fctx.createImageData(fw, fh);
  const d = id.data;
  const blobs = [
    { x: 0.75 + 0.12 * Math.sin(t * 0.5), y: 0.3 + 0.1 * Math.cos(t * 0.4), r: 0.55 },
    { x: 0.2 + 0.1 * Math.cos(t * 0.35), y: 0.85 + 0.08 * Math.sin(t * 0.6), r: 0.45 },
  ];
  const aspect = W / H;
  const phase = Math.floor(t * 10) % 4;
  for (let y = 0; y < fh; y++) {
    const ny = y / fh;
    for (let x = 0; x < fw; x++) {
      const nx = x / fw;
      let v = 0;
      for (const b of blobs) {
        const dx = (nx - b.x) * aspect;
        const dy = ny - b.y;
        v += Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) / b.r);
      }
      v = clamp(v * 0.8) * alpha;
      const th = (BAYER8[((y + phase) & 7) * 8 + ((x + phase * 3) & 7)] + 0.5) / 64;
      const i = (y * fw + x) * 4;
      const on = v > th;
      d[i] = on ? tone[0] : bg[0];
      d[i + 1] = on ? tone[1] : bg[1];
      d[i + 2] = on ? tone[2] : bg[2];
      d[i + 3] = 255;
    }
  }
  fctx.putImageData(id, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(field, 0, 0, fw * FIELD_CELL * u, fh * FIELD_CELL * u);
  ctx.restore();
}

function sceneManifesto(t) {
  const lt = t - T.manifesto[0];
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, W, H);
  ditherField(t, clamp(lt / 1.2));

  const lines = ["Design e código", "na mesma pessoa."];
  const maxW = VERTICAL ? W - 2 * G : 1400 * u;
  const fs = fitSize(lines, (s) => font("bric", s, 800), maxW, 150 * u);
  const lh = fs * 1.0;
  const out = prog(t, T.manifesto[1] - 0.5, T.manifesto[1] - 0.05);
  const blockTop = VERTICAL ? H * 0.4 : H * 0.36;
  monoLabel("O que eu faço", G, blockTop - 40 * u, MUTED_DARK, prog(lt, 0.3, 0.8) * (1 - out));
  lines.forEach((line, i) => {
    revealLine(line, G, blockTop + lh * (i + 0.85), font("bric", fs, 800), CHALK, prog(lt, 0.35 + i * 0.14, 1.2 + i * 0.14), lh, { out: clamp(out * 1.4 - i * 0.2) });
  });
  const pf = font("archivo", (VERTICAL ? 40 : 38) * u, 400);
  const para = wrap("Desenho a tela e depois escrevo o código que coloca ela no ar. Olha o que posso construir pro seu projeto.", pf, VERTICAL ? W - 2 * G : 980 * u);
  para.forEach((line, i) => {
    const y = blockTop + lh * 2 + 70 * u + i * 54 * u;
    ctx.save();
    ctx.globalAlpha = 1 - out;
    fadeText(line, G, y, pf, MUTED_DARK, prog(lt, 1.1 + i * 0.1, 1.8 + i * 0.1));
    ctx.restore();
  });
  chrome(true, "Portfólio 2026");
}

/* -------------------------------------------------------------- soluções */

const LANDINGS = ["agro", "cambio", "capital", "credito", "escola", "etfs", "giro-itinerante", "private-day", "seguros", "sempre", "wealth"];

const SOLUTIONS = [
  {
    area: "Música · Identidade",
    tags: ["WebGL", "Three.js", "Partículas"],
    title: "Identidade visual interativa",
    detail: "Transformo marca em algo que se toca: logotipo de partículas em WebGL que reage ao cursor e painel de mixagem ao vivo, direto no navegador.",
    // Canvas 3D gravado quadro a quadro (o visualizador que reage à música e
    // ao arrasto), com o logotipo luminoso do site, capturado à parte como
    // camada, por cima. Enquadramento próprio: a cena fica à direita (ou no
    // alto, no 9:16), longe do bloco de texto.
    fit: (c, w, h, lt) => {
      c.fillStyle = "#120c07";
      c.fillRect(0, 0, w, h);
      const frame = seqFrame("ganwalkH", lt);
      const layer = img(`${CACHE}${VERTICAL ? "ganwalk-v" : "ganwalk-h"}/camada.png`);
      const k = w / W;
      if (!frame) return;
      const drift = 1 + 0.05 * (lt / T.solutionDur);
      if (!VERTICAL) {
        const fw = W * 0.62 * drift * k;
        const fh = (fw * 900) / 1600;
        const fx = w * 0.7 - fw / 2;
        const fy = h * 0.47 - fh / 2;
        c.drawImage(frame, fx, fy, fw, fh);
        if (layer) c.drawImage(layer, 0, 900 * 0.38, 1600, 900 * 0.24, fx, fy + fh * 0.38, fw, fh * 0.24);
      } else {
        const fw = W * 1.35 * drift * k;
        const fh = (fw * 900) / 1600;
        const fx = (w - fw) / 2;
        const fy = h * 0.12;
        c.drawImage(frame, fx, fy, fw, fh);
        if (layer) {
          const bw = w * 0.96;
          const bh = (bw * 1280 * 0.16) / 720;
          c.drawImage(layer, 0, 1280 * 0.42, 720, 1280 * 0.16, (w - bw) / 2, fy + fh * 0.62, bw, bh);
        }
      }
    },
    textW: 760,
  },
  {
    area: "Música · Experiência 3D",
    tags: ["Three.js", "WebGL", "Player embutido"],
    title: "Universos 3D no navegador",
    detail: "Construo cenários em Three.js com player embutido: quem visita entra no mundo do álbum e ouve tudo, faixa a faixa, sem sair do site.",
    media: (lt) => ({ source: seqFrame(VERTICAL ? "dezertV" : "dezertH", lt), ay: VERTICAL ? 0.5 : 0.5 }),
  },
  {
    area: "Música · Site oficial",
    tags: ["Canvas 2D", "Página única", "Interatividade"],
    title: "Sites oficiais para artistas",
    detail: "Nome da banda em partículas com física de mola, discografia, galeria e contato numa página só. Leve, rápida e sem framework.",
    media: (lt) => ({ source: seqFrame(VERTICAL ? "pinkV" : "pinkH", lt + 1.2), zoom: 1.14, ay: 0.3 }),
  },
  {
    area: "Produto · Banking",
    tags: ["Design System", "Intranet", "Tom e voz"],
    title: "Design Systems e intranets",
    detail: "Organizo produto e equipe num sistema só: componentes documentados e manual de tom e voz, pra todo mundo falar a mesma língua.",
    metrics: [
      ["70", "componentes documentados"],
      ["110", "componentes React"],
      ["10", "áreas no tom de voz"],
    ],
    media: (lt) => ({ source: seqFrame("intranet", lt * 0.9), ay: 0.5 }),
  },
  {
    area: "Web · Banking",
    tags: ["SEO", "Conversão", "Clarity & GA"],
    title: "Landing pages que convertem",
    detail: "Desenho e mantenho páginas com performance de 90/100 pra cima, bem ranqueadas na busca e em IA, com cada clique medido.",
    metrics: [
      ["20 mil+", "acessos diários"],
      ["90+/100", "performance mínima"],
      ["8%+", "conversão"],
    ],
    mosaic: true,
  },
];

// Mosaico das landing pages: colunas de páginas inteiras rolando em
// sentidos alternados, levemente inclinadas.
function drawMosaic(c, w, h, lt) {
  c.fillStyle = "#111";
  c.fillRect(0, 0, w, h);
  const cols = VERTICAL ? 3 : 5;
  c.save();
  c.translate(w / 2, h / 2);
  c.rotate(-0.1);
  c.scale(1.28, 1.28);
  c.translate(-w / 2, -h / 2);
  const gap = 14 * u;
  const cw = (w - gap * (cols - 1)) / cols;
  const ch = cw * (2000 / 640);
  for (let i = 0; i < cols; i++) {
    const dir = i % 2 === 0 ? -1 : 1;
    const speed = (70 + (i % 3) * 18) * u;
    const offset = (((dir * speed * lt + i * ch * 0.37) % (ch + gap)) + (ch + gap)) % (ch + gap);
    const x = i * (cw + gap);
    for (let k = -1; k < Math.ceil(h / (ch + gap)) + 2; k++) {
      const im = img(`${PUB}photos/landing-pages/${LANDINGS[(i * 3 + k + 22) % LANDINGS.length]}.webp`);
      if (im) c.drawImage(im, x, k * (ch + gap) - offset, cw, ch);
    }
  }
  c.restore();
}

function countUp(value, p) {
  const m = /^(\d+)(.*)$/.exec(value);
  if (!m) return value;
  return `${Math.round(Number(m[1]) * outCubic(p))}${m[2]}`;
}

function sceneSolution(t, i) {
  const s = SOLUTIONS[i];
  const start = T.solutions + i * T.solutionDur;
  const lt = t - start;
  const end = T.solutionDur;
  const zoom = 1.02 + 0.06 * (lt / end);

  // Mídia real do projeto, nascendo do retículo por cima da cena anterior.
  let fit;
  if (s.mosaic) fit = (c, w, h) => drawMosaic(c, w, h, lt);
  else if (s.fit) fit = (c, w, h) => s.fit(c, w, h, lt);
  else {
    const m = s.media(lt);
    fit = (c, w, h) => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, w, h);
      drawCover(c, m.source, 0, 0, w, h, { zoom: zoom * (m.zoom ?? 1), ay: m.ay ?? 0.5 });
      if (m.overlay) drawCover(c, m.overlay, 0, 0, w, h, { zoom: zoom * (m.zoom ?? 1), ay: m.ay ?? 0.5 });
    };
  }
  ditherReveal(ctx, fit, 0, 0, W, H, prog(lt, 0, 0.95), { maxCell: 44, bias: 20 });

  // Véu para o texto ler bem sobre qualquer mídia.
  const veil = prog(lt, 0.3, 1.0);
  ctx.save();
  ctx.globalAlpha = veil;
  if (!VERTICAL) {
    let g = ctx.createLinearGradient(0, 0, W * 0.72, 0);
    g.addColorStop(0, "rgba(0,0,0,0.78)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    g = ctx.createLinearGradient(0, H, 0, H * 0.35);
    g.addColorStop(0, "rgba(0,0,0,0.7)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  } else {
    const g = ctx.createLinearGradient(0, H, 0, H * 0.3);
    g.addColorStop(0, "rgba(0,0,0,0.92)");
    g.addColorStop(0.55, "rgba(0,0,0,0.6)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 180 * u);
  top.addColorStop(0, "rgba(0,0,0,0.55)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, 180 * u);
  ctx.restore();

  // Bloco de texto, montado de baixo para cima.
  const out = prog(lt, end - 0.42, end - 0.05);
  const textW = VERTICAL ? W - 2 * G : (s.textW ?? 1000) * u;
  const tf = (sz) => font("bric", sz, 700);
  const titleLines = wrap(s.title, tf(VERTICAL ? 104 * u : 112 * u), textW);
  const tsz = fitSize(titleLines, tf, textW, VERTICAL ? 104 * u : 112 * u);
  const df = font("archivo", (VERTICAL ? 34 : 32) * u, 400);
  const detail = wrap(s.detail, df, VERTICAL ? W - 2 * G : Math.min(860, s.textW ?? 860) * u);
  const dLH = (VERTICAL ? 48 : 45) * u;

  const bottom = H - (VERTICAL ? 170 : 110) * u;
  const numSize = (VERTICAL ? 64 : 72) * u;
  const numBase = bottom - 44 * u;
  const detailLast = s.metrics ? numBase - numSize * 0.75 - 58 * u : bottom;
  const detailTop = detailLast - (detail.length - 1) * dLH;
  const titleLast = detailTop - dLH * 0.75 - 52 * u;
  const titleBase = titleLast - (titleLines.length - 1) * tsz;
  const tagsY = titleBase - tsz * 0.95 - 14 * u;
  const metricsY = numBase;

  ctx.save();
  ctx.globalAlpha = 1 - outCubic(out);
  const shift = -outCubic(out) * 30 * u;
  ctx.translate(0, shift);
  monoLabel(s.tags.join(" · "), G, tagsY, "rgba(244,244,244,0.75)", prog(lt, 0.45, 0.95));
  titleLines.forEach((line, k) => {
    revealLine(line, G, titleBase + k * tsz * 1.0, tf(tsz), CHALK, prog(lt, 0.55 + k * 0.12, 1.4 + k * 0.12), tsz * 1.02);
  });
  detail.forEach((line, k) => {
    fadeText(line, G, detailTop + k * dLH, df, "rgba(244,244,244,0.82)", prog(lt, 0.95 + k * 0.08, 1.6 + k * 0.08));
  });
  if (s.metrics) {
    const nf = font("bric", numSize, 700);
    const colW = VERTICAL ? (W - 2 * G) / 3 : Math.max(300 * u, ...s.metrics.map(([v]) => measure(v, nf) + 70 * u));
    s.metrics.forEach(([value, label], k) => {
      const mp = prog(lt, 1.3 + k * 0.15, 2.6 + k * 0.15);
      const x = G + k * colW;
      fadeText(countUp(value, mp), x, metricsY, nf, CHALK, prog(lt, 1.3 + k * 0.15, 1.8 + k * 0.15));
      const lf = font("mono", 15 * u, 500);
      wrap(label.toUpperCase(), lf, colW - 30 * u).forEach((l, j) =>
        fadeText(l, x, metricsY + 36 * u + j * 22 * u, lf, "rgba(244,244,244,0.65)", prog(lt, 1.45 + k * 0.15, 1.95 + k * 0.15), { spacing: 15 * u * 0.08 }),
      );
    });
  }
  ctx.restore();

  chrome(true, `O que eu faço  ${String(i + 1).padStart(2, "0")} / 05`);
  monoLabel(s.area, W - G, VERTICAL ? 100 * u : 96 * u, "rgba(244,244,244,0.55)", prog(lt, 0.4, 0.9) * (1 - out), "right", 15);

  // Barra de progresso da cena, fina, no rodapé.
  ctx.save();
  ctx.fillStyle = "rgba(244,244,244,0.18)";
  const barY = H - 40 * u;
  const barW = W - 2 * G;
  ctx.fillRect(G, barY, barW, 2 * u);
  ctx.fillStyle = CHALK;
  const seg = barW / 5;
  ctx.fillRect(G, barY, seg * i + seg * clamp(lt / end), 2 * u);
  ctx.restore();

  // A mão aparece nos projetos que se usam com as mãos.
  if (i === 0 || i === 2) {
    const keys = [
      { t: 1.2, x: W * 0.95, y: H * 0.75 },
      { t: 2.2, x: W * (VERTICAL ? 0.6 : 0.64), y: H * (VERTICAL ? 0.36 : 0.42) },
      { t: 3.3, x: W * (VERTICAL ? 0.38 : 0.72), y: H * (VERTICAL ? 0.28 : 0.35) },
      { t: 4.4, x: W * (VERTICAL ? 0.62 : 0.58), y: H * (VERTICAL ? 0.4 : 0.5) },
      { t: 5.3, x: W * 1.05, y: H * 0.5 },
    ];
    if (lt > 1.2 && lt < 5.3) cursorState = { ...path(keys, lt), pose: "repouso" };
  }
}

/* ---------------------------------------------------------------- extras */

const ILUSTRAS = ["venturo", "cabeca", "manuzika", "simetria", "irezumi", "flores", "auuuuu", "majuju"];

function extrasLayout() {
  if (!VERTICAL) {
    const gap = 40 * u;
    const size = (W - 2 * G - 2 * gap) / 3;
    return [0, 1, 2].map((k) => ({ x: G + k * (size + gap), y: 440 * u, w: size, h: 440 * u }));
  }
  const w = W - 2 * G;
  const h = 340 * u;
  return [0, 1, 2].map((k) => ({ x: G, y: 580 * u + k * (h + 100 * u), w, h }));
}

const EXTRAS = [
  { label: "Ilustração & colagem", source: (lt) => img(`${PUB}photos/ilustra-${ILUSTRAS[Math.floor(lt / 0.55) % ILUSTRAS.length]}.webp`) },
  { label: "Animação", source: (lt) => seqFrame("cagumela", lt) },
  { label: "Produção musical", source: (lt) => seqFrame("musica", lt + 1) },
];

function sceneExtras(t) {
  const lt = t - T.extras[0];
  const out = prog(t, T.brands[0], T.brands[0] + 0.5);
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(0, -outCubic(out) * 60 * u);
  ctx.globalAlpha = 1 - out;
  const lines = VERTICAL ? ["Do institucional", "ao lúdico, e tudo", "entre as duas coisas."] : ["Do institucional ao lúdico,", "e tudo entre as duas coisas."];
  const fs = fitSize(lines, (s) => font("bric", s, 800), W - 2 * G, VERTICAL ? 92 * u : 84 * u);
  const top = VERTICAL ? 200 * u : 215 * u;
  monoLabel("Extras", G, top - 50 * u, MUTED, prog(lt, 0.2, 0.6));
  lines.forEach((l, k) => revealLine(l, G, top + fs * (k + 0.8), font("bric", fs, 800), k === lines.length - 1 && !VERTICAL ? MUTED : INK, prog(lt, 0.3 + k * 0.12, 1.1 + k * 0.12), fs));

  const cards = extrasLayout();
  const hoverAt = [1.6, 2.6, 3.6];
  cards.forEach((r, k) => {
    const e = EXTRAS[k];
    const appear = prog(lt, 0.6 + k * 0.15, 1.3 + k * 0.15);
    if (appear <= 0) return;
    const src = e.source(lt);
    const fit = (c, w, h) => {
      c.fillStyle = "#000";
      c.fillRect(0, 0, w, h);
      drawCover(c, src, 0, 0, w, h);
    };
    const y = r.y + (1 - outCubic(appear)) * 40 * u;
    ctx.save();
    ctx.globalAlpha *= outCubic(appear);
    // Retículo vivo: a matriz troca de fase a cada dois quadros.
    ditherBlit(ctx, fit, r.x, y, r.w, r.h, 3 * u, { phase: Math.floor(t * 15) % 16, bias: 70 });
    const hv = prog(lt, hoverAt[k], hoverAt[k] + 0.3) * (1 - prog(lt, hoverAt[k] + 0.95, hoverAt[k] + 1.2));
    if (hv > 0) {
      ctx.globalAlpha *= outCubic(hv);
      ctx.save();
      ctx.beginPath();
      ctx.rect(r.x, y, r.w, r.h);
      ctx.clip();
      drawCover(ctx, src, r.x, y, r.w, r.h, { zoom: 1 + 0.04 * hv });
      ctx.restore();
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha *= outCubic(appear);
    monoLabel(`${String(k + 1).padStart(2, "0")}  ${e.label}`, r.x, y + r.h + 42 * u, INK, 1);
    ctx.restore();
  });
  ctx.restore();
  chrome(false, "Portfólio 2026");

  const c = cards;
  const keys = [
    { t: 0.9, x: W * 0.5, y: H + 80 * u },
    ...hoverAt.map((h, k) => ({ t: h + 0.05, x: c[k].x + c[k].w * 0.55, y: c[k].y + c[k].h * 0.5 })),
    { t: 4.9, x: c[2].x + c[2].w * 0.7, y: c[2].y + c[2].h * 0.6 },
  ];
  if (lt > 0.9 && out < 1) cursorState = { ...path(keys, lt), pose: "hover" };
}

/* ---------------------------------------------------------------- marcas */

const BRANDS = ["auvp", "minuto-indie", "hits-perdidos", "defensoria-goias", "mais-saude", "hapvida", "vivo-fibra", "boi-verde"];

function brandsLayout() {
  const cols = 3;
  const cw = VERTICAL ? (W - 2 * G) / 3 : 330 * u;
  const ch = VERTICAL ? 300 * u : 230 * u;
  const x0 = VERTICAL ? G : W - G - cw * cols;
  const y0 = VERTICAL ? 680 * u : (H - ch * 3) / 2 + 30 * u;
  return Array.from({ length: 9 }, (_, k) => ({ x: x0 + (k % cols) * cw, y: y0 + Math.floor(k / cols) * ch, w: cw, h: ch }));
}

function sceneBrands(t) {
  const lt = t - T.brands[0];
  if (t >= T.extras[1]) {
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, W, H);
  }
  const cells = brandsLayout();
  const lines = ["Falta a sua", "marca aqui."];
  const fs = fitSize(lines, (s) => font("bric", s, 800), VERTICAL ? W - 2 * G : cells[0].x - G - 60 * u, VERTICAL ? 130 * u : 120 * u);
  const titleY = VERTICAL ? 330 * u : H / 2 - fs * 0.2;
  monoLabel("Acreditam no meu trabalho", G, titleY - fs * 0.85 - 30 * u, MUTED, prog(lt, 0.35, 0.8));
  lines.forEach((l, k) => revealLine(l, G, titleY + fs * k, font("bric", fs, 800), INK, prog(lt, 0.45 + k * 0.1, 1.2 + k * 0.1), fs));

  // Grade fina entre as marcas.
  const gp = prog(lt, 0.5, 1.3);
  ctx.save();
  ctx.strokeStyle = "rgba(11,11,11,0.14)";
  ctx.lineWidth = 1;
  const gx = cells[0].x;
  const gy = cells[0].y;
  const gw = cells[0].w * 3;
  const gh = cells[0].h * 3;
  for (let k = 0; k <= 3; k++) {
    ctx.beginPath();
    ctx.moveTo(gx, gy + k * cells[0].h);
    ctx.lineTo(gx + gw * outCubic(gp), gy + k * cells[0].h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(gx + k * cells[0].w, gy);
    ctx.lineTo(gx + k * cells[0].w, gy + gh * outCubic(gp));
    ctx.stroke();
  }
  ctx.restore();

  const clickAt = 3.05;
  cells.forEach((r, k) => {
    const a = prog(lt, 0.7 + k * 0.07, 1.2 + k * 0.07);
    if (a <= 0) return;
    ctx.save();
    ctx.globalAlpha = outCubic(a);
    const dy = (1 - outCubic(a)) * 20 * u;
    if (k < 8) {
      const im = img(`${PUB}logos/${BRANDS[k]}.webp`);
      ctx.filter = "grayscale(1)";
      drawContain(ctx, im, r.x + r.w * 0.15, r.y + r.h * 0.22 + dy, r.w * 0.7, r.h * 0.56);
    } else {
      // "Sua marca": o espaço vazio que a mão vem apertar.
      const hv = prog(lt, 2.6, 2.8);
      const bw = r.w * 0.62;
      const bh = 64 * u;
      const bx = r.x + (r.w - bw) / 2;
      const by = r.y + (r.h - bh) / 2 + dy + (lt > clickAt && lt < clickAt + 0.18 ? 3 * u : 0);
      ctx.fillStyle = INK;
      ctx.globalAlpha *= hv;
      ctx.fillRect(bx, by, bw, bh);
      ctx.globalAlpha = outCubic(a);
      ctx.setLineDash([6 * u, 6 * u]);
      ctx.strokeStyle = hv > 0.5 ? INK : MUTED;
      ctx.lineWidth = 1.5 * u;
      ctx.strokeRect(bx, by, bw, bh);
      setFont(ctx, font("mono", 18 * u, 500), 18 * u * 0.08);
      ctx.fillStyle = hv > 0.5 ? PAPER : MUTED;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SUA MARCA", bx + bw / 2, by + bh / 2 + 1);
    }
    ctx.restore();
  });
  chrome(false, "Marcas");

  const target = cells[8];
  const keys = [
    { t: 0.0, x: W * 0.72, y: H * 0.9 },
    { t: 1.4, x: cells[4].x + cells[4].w * 0.5, y: cells[4].y + cells[4].h * 0.7 },
    { t: 2.65, x: target.x + target.w * 0.6, y: target.y + target.h * 0.55 },
  ];
  if (lt >= 0 && lt < 3.4) cursorState = { ...path(keys, lt), pose: lt > clickAt && lt < clickAt + 0.2 ? "clique" : lt > 2.6 ? "hover" : "repouso" };
}

/* --------------------------------------------------------------- contato */

// Grade interativa do Contato (InteractiveGridImage.tsx): 6 x 6 fatias da
// foto, a coluna e a linha sob a mão crescem, a frase "Fale comigo!" nos
// idiomas do site escrita em cada quadro.
const GRID = { cols: 6, rows: 6, boost: 2.6, sigma: 0.16, ease: 0.1 };
const PHRASES = [
  ["Fale", "comigo!"],
  ["Talk", "to me!"],
  ["¡Habla", "conmigo!"],
];

function gridTracks(weights, total) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const sizes = weights.map((w) => (w / sum) * total);
  const pos = [0];
  for (const s of sizes) pos.push(pos[pos.length - 1] + s);
  return { sizes, pos };
}

/** Estado da grade no instante lt, simulando quadro a quadro desde o início
 *  da cena: o mesmo amortecimento do site, só que determinístico. */
function gridState(lt, rect, pointerAt) {
  const colW = new Array(GRID.cols).fill(1);
  const rowW = new Array(GRID.rows).fill(1);
  const n = Math.max(0, Math.floor(lt * 60));
  for (let f = 0; f <= n; f++) {
    const p = pointerAt(f / 60);
    const colT = new Array(GRID.cols).fill(1);
    const rowT = new Array(GRID.rows).fill(1);
    if (p) {
      const px = p.x - rect.x;
      const py = p.y - rect.y;
      if (px >= 0 && px <= rect.w && py >= 0 && py <= rect.h) {
        const cx = gridTracks(colW, rect.w).pos;
        const cy = gridTracks(rowW, rect.h).pos;
        for (let c = 0; c < GRID.cols; c++) {
          const d = (px - (cx[c] + cx[c + 1]) / 2) / (GRID.sigma * rect.w);
          colT[c] = 1 + GRID.boost * Math.exp(-0.5 * d * d);
        }
        for (let r = 0; r < GRID.rows; r++) {
          const d = (py - (cy[r] + cy[r + 1]) / 2) / (GRID.sigma * rect.h);
          rowT[r] = 1 + GRID.boost * Math.exp(-0.5 * d * d);
        }
      }
    }
    for (let c = 0; c < GRID.cols; c++) colW[c] += (colT[c] - colW[c]) * GRID.ease;
    for (let r = 0; r < GRID.rows; r++) rowW[r] += (rowT[r] - rowW[r]) * GRID.ease;
  }
  return { colW, rowW };
}

function drawGrid(rect, state, photo, appear) {
  if (!photo) return;
  const { sizes: cw, pos: cx } = gridTracks(state.colW, rect.w);
  const { sizes: rh, pos: cy } = gridTracks(state.rowW, rect.h);
  const aspect = rect.w / rect.h;
  const iw = photo.naturalWidth;
  const ih = photo.naturalHeight;
  let cropW = iw;
  let cropH = ih;
  let cropX = 0;
  let cropY = 0;
  if (iw / ih > aspect) {
    cropW = ih * aspect;
    cropX = (iw - cropW) / 2;
  } else {
    cropH = iw / aspect;
    cropY = (ih - cropH) / 2;
  }
  const srcW = cropW / GRID.cols;
  const srcH = cropH / GRID.rows;
  const gap = 1.5 * u;
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      // Os quadros entram em onda diagonal.
      const a = clamp(appear * 2.2 - (r + c) * 0.1);
      if (a <= 0) continue;
      const dx = rect.x + cx[c] + gap / 2;
      const dy = rect.y + cy[r] + gap / 2;
      const dw = Math.max(cw[c] - gap, 0.5);
      const dh = Math.max(rh[r] - gap, 0.5);
      ctx.save();
      ctx.globalAlpha = outCubic(a);
      ctx.drawImage(photo, cropX + c * srcW, cropY + r * srcH, srcW, srcH, dx, dy, dw, dh);
      const words = PHRASES[(r * GRID.cols + c) % PHRASES.length];
      const fs = Math.max(7, Math.min(dw, dh) * 0.1);
      const pad = fs * 0.4;
      setFont(ctx, font("archivo", fs, 500));
      const widest = Math.max(...words.map((w) => ctx.measureText(w).width));
      if (widest < dw - pad * 2 && fs * 1.15 * words.length < dh - pad * 2) {
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        words.forEach((w, i) => ctx.fillText(w, dx + dw - pad, dy + pad + i * fs * 1.15));
      }
      ctx.restore();
    }
  }
}

const CONTACTS = [
  ["Email", "armandocustodio0@gmail.com"],
  ["WhatsApp", "+55 62 99217 4047"],
  ["Instagram", "@ganwalk"],
  ["LinkedIn", "linkedin.com/in/armando-custodio-00080320a"],
  ["GitHub", "github.com/ganwalk"],
];

function contactLayout() {
  if (!VERTICAL) {
    const gh = 800 * u;
    const gw = gh * 0.78;
    return { grid: { x: W - G - gw, y: (H - gh) / 2 + 20 * u, w: gw, h: gh }, titleTop: 250 * u, textW: W - 2 * G - gw - 90 * u };
  }
  const gw = W - 2 * G;
  const gh = 700 * u;
  return { grid: { x: G, y: 560 * u, w: gw, h: gh }, titleTop: 175 * u, textW: W - 2 * G };
}

function sceneContact(t) {
  const lt = t - T.contact[0];
  const L = contactLayout();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);

  const title = ["VAMOS", "CONVERSAR?"];
  const fs = fitSize(title, (s) => font("whyte", s, 900), L.textW, VERTICAL ? 150 * u : 150 * u, 0.015);
  monoLabel("Contato", G, L.titleTop - 60 * u, MUTED, prog(lt, 0.3, 0.8));
  title.forEach((l, k) => revealLine(l, G, L.titleTop + fs * (0.78 + k * 0.9), font("whyte", fs, 900), INK, prog(lt, 0.35 + k * 0.12, 1.25 + k * 0.12), fs * 0.92, { spacing: fs * 0.015 }));
  const subY = L.titleTop + fs * 1.68 + 64 * u;
  fadeText("Aberto a projetos, colaborações e boas ideias.", G, subY, font("archivo", (VERTICAL ? 36 : 34) * u, 400), MUTED, prog(lt, 0.9, 1.5));

  // Contatos, um por linha, rótulo em mono e valor em texto corrido.
  const listTop = VERTICAL ? L.grid.y + L.grid.h + 100 * u : subY + 90 * u;
  const rowH = (VERTICAL ? 88 : 82) * u;
  CONTACTS.forEach(([label, value], k) => {
    const y = listTop + k * rowH;
    const p = prog(lt, 1.1 + k * 0.12, 1.7 + k * 0.12);
    ctx.save();
    ctx.globalAlpha = outCubic(p);
    ctx.fillStyle = "rgba(11,11,11,0.14)";
    ctx.fillRect(G, y - rowH * 0.62, (L.textW) * outCubic(p), 1);
    ctx.restore();
    monoLabel(label, G, y, MUTED, p, "left", 15);
    const vf = font("archivo", (VERTICAL ? 32 : 30) * u, 500);
    const vx = G + (VERTICAL ? 230 : 210) * u;
    fadeText(value, vx, y + 2 * u, vf, INK, p);
  });
  if (!VERTICAL) {
    ctx.save();
    ctx.fillStyle = "rgba(11,11,11,0.14)";
    ctx.globalAlpha = prog(lt, 1.8, 2.3);
    ctx.fillRect(G, listTop + (CONTACTS.length - 1) * rowH + rowH * 0.38, L.textW, 1);
    ctx.restore();
  }

  fadeText("Baseado no Brasil · Disponível para projetos no mundo todo 🌍", G, H - (VERTICAL ? 90 : 60) * u, font("archivo", 24 * u, 400), MUTED, prog(lt, 1.9, 2.5));

  // A grade da foto, deformando sob a mão.
  const g = L.grid;
  const keys = [
    { t: 1.6, x: W * 0.5, y: H + 80 * u },
    { t: 2.5, x: g.x + g.w * 0.3, y: g.y + g.h * 0.35 },
    { t: 3.5, x: g.x + g.w * 0.72, y: g.y + g.h * 0.28 },
    { t: 4.6, x: g.x + g.w * 0.55, y: g.y + g.h * 0.7 },
    { t: 5.6, x: g.x + g.w * 0.25, y: g.y + g.h * 0.62 },
    { t: 6.5, x: VERTICAL ? W + 90 * u : g.x - 160 * u, y: VERTICAL ? g.y + g.h * 0.4 : H + 90 * u },
  ];
  const pointerAt = (s) => (s > 1.6 && s < 6.5 ? path(keys, s) : null);
  const photo = img(`${PUB}photos/armando-contato.webp`);
  drawGrid(g, gridState(lt, g, pointerAt), photo, prog(lt, 0.5, 1.8));
  if (lt > 1.6 && lt < 6.5) cursorState = { ...path(keys, lt), pose: "repouso" };

  chrome(false, "Feito à mão, com ajuda de máquinas", prog(lt, 0.2, 0.8));
}

/* ============================================================ QUADRO */

function drawAt(t) {
  cursorState = null;
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  if (t < T.hero[1]) sceneHero(t);
  if (t >= T.manifesto[0] && t < T.manifesto[1]) sceneManifesto(t);
  // A primeira solução nasce do retículo por cima do fundo do manifesto.
  if (t >= T.manifesto[1] && t < T.solutions + 1.0) sceneManifesto(T.manifesto[1] - 0.001);
  for (let i = 0; i < SOLUTIONS.length; i++) {
    const s = T.solutions + i * T.solutionDur;
    const e = s + T.solutionDur + (i < SOLUTIONS.length - 1 ? 0 : 0.5);
    if (t >= s && t < e) {
      // Na virada, a cena anterior continua por baixo enquanto a nova nasce
      // do retículo.
      if (i > 0 && t < s + 1.0) sceneSolution(t, i - 1);
      sceneSolution(t, i);
    }
  }
  if (t >= T.extras[0] && t < T.extras[1]) sceneExtras(t);
  if (t >= T.brands[0] && t < T.contact[0]) sceneBrands(t);
  if (t >= T.contact[0]) sceneContact(t);

  curtain(t, T.curtain1);
  curtain(t, T.curtain2);
  curtain(t, T.curtain3);

  const dark = t >= T.manifesto[0] && t < T.extras[0];
  grain(t, dark ? 0.1 : 0.07);
  drawCursor();

  // Abre no papel branco. Não fecha em fade: o último quadro segura os
  // contatos, e é ele que fica na tela quando o vídeo termina.
  const f = 1 - prog(t, 0, 0.35);
  if (f > 0) {
    ctx.fillStyle = `rgba(255,255,255,${f})`;
    ctx.fillRect(0, 0, W, H);
  }
}

async function renderFrame(t, type = "image/png") {
  for (let attempt = 0; attempt < 6; attempt++) {
    pending.clear();
    drawAt(t);
    if (pending.size === 0) break;
    await Promise.all([...pending]);
  }
  return canvas.toDataURL(type, 0.95);
}

window.renderFrame = renderFrame;
window.TOTAL = T.total;
window.ready = document.fonts.ready.then(async () => {
  await Promise.all(["whyte", "bric", "archivo", "mono", "switzer"].map((f) => document.fonts.load(font(f, 40, f === "whyte" ? 900 : 400))));
  await document.fonts.load(font("switzer", 40, 400, "italic"));
  await document.fonts.load(font("bric", 40, 800));
  await document.fonts.load(font("mono", 40, 500));
  return true;
});
