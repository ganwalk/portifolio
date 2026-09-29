// Trilha sonora do vídeo demonstração, sintetizada do zero (nenhuma amostra
// de terceiros): pad em lá menor, baixo, arpejo dedilhado, bumbo e chimbal a
// 120 BPM, mais os efeitos que acompanham a imagem (teclas digitando,
// clique do cursor, cortina, dither, contadores). Tudo lê os tempos de
// composition/timeline.js, então som e imagem cortam juntos.
//
// Uso: node video-demo/scripts/soundtrack.mjs  (gera .cache/soundtrack.wav)

import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BEAT, DURATION, TRANSITIONS, HITS, CURTAIN_COVER } from "../composition/timeline.js";

const SR = 48000;
const N = Math.ceil(DURATION * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);

let seed = 7;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const hz = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const between = (t, a, b) => t >= a && t < b;

function add(t0, buf, gain = 1, pan = 0) {
  const s = Math.floor(t0 * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < buf.length; i++) {
    const k = s + i;
    if (k < 0 || k >= N) continue;
    L[k] += buf[i] * gl;
    R[k] += buf[i] * gr;
  }
}

// ------------------------------------------------------------ instrumentos

function kick(vel = 1) {
  const len = Math.floor(0.45 * SR);
  const b = new Float32Array(len);
  let ph = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 44 + 90 * Math.exp(-t * 28);
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph) * Math.exp(-t * 7.5) * vel + noise() * Math.exp(-t * 300) * 0.15 * vel;
  }
  return b;
}

function hat(vel = 1, decay = 60) {
  const len = Math.floor(0.08 * SR);
  const b = new Float32Array(len);
  let prev = 0;
  for (let i = 0; i < len; i++) {
    const n = noise();
    const hp = n - prev;
    prev = n;
    b[i] = hp * Math.exp((-i / SR) * decay) * vel;
  }
  return b;
}

function pluck(freq, dur = 0.5, vel = 1, bright = 1) {
  const len = Math.floor(dur * SR);
  const b = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.004) * Math.exp(-t * 7);
    const w = 2 * Math.PI * freq * t;
    b[i] = (Math.sin(w) + 0.35 * bright * Math.sin(2 * w) * Math.exp(-t * 14) + 0.12 * bright * Math.sin(3 * w) * Math.exp(-t * 20)) * env * vel;
  }
  return b;
}

function bass(freq, dur, vel = 1) {
  const len = Math.floor(dur * SR);
  const b = new Float32Array(len);
  let lp = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.01) * Math.min(1, (dur - t) / 0.03) * Math.exp(-t * 2.5);
    const saw = 2 * ((freq * t) % 1) - 1;
    const x = 0.6 * Math.sin(2 * Math.PI * freq * t) + 0.4 * saw;
    lp += (x - lp) * 0.08;
    b[i] = lp * env * vel;
  }
  return b;
}

// Pad: três osciladores dente de serra desafinados por nota, passando por
// um passa baixas de um polo com a abertura seguindo `cutoff(t)`.
function pad(notes, t0, dur, vel, cutoffAt) {
  const len = Math.floor(dur * SR);
  const bl = new Float32Array(len);
  const br = new Float32Array(len);
  const phases = notes.flatMap(() => [rand(), rand(), rand()]);
  let lpl = 0;
  let lpr = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.6) * Math.min(1, (dur - t) / 0.6);
    let sl = 0;
    let sr = 0;
    notes.forEach((m, n) => {
      const f = hz(m);
      [-0.11, 0, 0.12].forEach((d, j) => {
        const ph = phases[n * 3 + j];
        const v = 2 * ((f * (1 + d / 100 * 6) * t + ph) % 1) - 1;
        if (j === 0) sl += v;
        else if (j === 2) sr += v;
        else {
          sl += v * 0.5;
          sr += v * 0.5;
        }
      });
    });
    const c = cutoffAt(t0 + t);
    lpl += (sl - lpl) * c;
    lpr += (sr - lpr) * c;
    bl[i] = lpl * env * vel;
    br[i] = lpr * env * vel;
  }
  const s = Math.floor(t0 * SR);
  for (let i = 0; i < len; i++) {
    const k = s + i;
    if (k >= N) break;
    L[k] += bl[i];
    R[k] += br[i];
  }
}

function whoosh(center, dur = 0.9, vel = 1) {
  const len = Math.floor(dur * SR);
  const b = new Float32Array(len);
  let bp1 = 0;
  let bp2 = 0;
  for (let i = 0; i < len; i++) {
    const x = i / len;
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, x * 1.15)), 2);
    const f = 0.02 + 0.2 * Math.sin(Math.PI * x);
    bp1 += (noise() - bp1) * f;
    bp2 += (bp1 - bp2) * f;
    b[i] = (bp1 - bp2) * env * vel * 2.2;
  }
  add(center - dur * 0.55, b, 1, -0.2);
  add(center - dur * 0.55 + 0.012, b, 1, 0.2);
}

// Dither: ruído amostrado e segurado (sample and hold), o som de um
// retículo acendendo em blocos.
function glitch(t0, dur = 0.35, vel = 1) {
  const len = Math.floor(dur * SR);
  const b = new Float32Array(len);
  let hold = 0;
  let step = 0;
  for (let i = 0; i < len; i++) {
    if (step-- <= 0) {
      hold = noise() > 0 ? 1 : -1;
      step = Math.floor(SR / (400 + 3000 * rand()));
    }
    const x = i / len;
    b[i] = hold * 0.25 * vel * Math.sin(Math.PI * x) * (0.4 + 0.6 * (Math.floor(x * 16) % 2));
  }
  add(t0, b, 0.6, (rand() - 0.5) * 0.6);
}

function tick(t0, freq = 3200, vel = 1, len = 0.012) {
  const n = Math.floor(len * SR);
  const b = new Float32Array(n);
  for (let i = 0; i < n; i++) b[i] = (Math.sin((2 * Math.PI * freq * i) / SR) * 0.6 + noise() * 0.4) * Math.exp((-i / SR) * 380) * vel;
  add(t0, b, 1, (rand() - 0.5) * 0.4);
}

// ----------------------------------------------------------------- arranjo

// Lá menor: Am9, Fmaj7, Cmaj7, G6, um acorde por compasso (2s).
const CHORDS = [
  { root: 45, pad: [57, 60, 64, 67, 71], arp: [69, 72, 76, 79, 83, 79, 76, 72] },
  { root: 41, pad: [53, 57, 60, 64], arp: [65, 69, 72, 76, 81, 76, 72, 69] },
  { root: 48, pad: [52, 55, 59, 60], arp: [72, 76, 79, 83, 84, 83, 79, 76] },
  { root: 43, pad: [55, 59, 62, 64], arp: [67, 71, 74, 76, 79, 76, 74, 71] },
];
const BAR = BEAT * 4;
const chordAt = (t) => CHORDS[Math.floor(t / BAR) % CHORDS.length];

// Onde cada camada toca (a peça respira: abertura quase silenciosa, a batida
// entra com as soluções, some na despedida).
const groove = (t) => between(t, 12.5, 41) || between(t, 47, 50);
const heroPulse = (t) => between(t, 3.5, 10);

const padCutoff = (t) => {
  if (t < 3.5) return 0.004 + 0.01 * (t / 3.5);
  if (t < 12.5) return 0.02;
  if (t < 50) return 0.035;
  return 0.03 - 0.02 * Math.min(1, (t - 50) / 10);
};

for (let bar = 0; bar * BAR < DURATION; bar++) {
  const t0 = bar * BAR;
  const ch = CHORDS[bar % CHORDS.length];
  const vel = t0 < 3.5 ? 0.05 : t0 >= 50 ? 0.075 : 0.06;
  pad(ch.pad, t0, Math.min(BAR + 0.6, DURATION - t0), vel, padCutoff);
}

// Arpejo em colcheias, com um eco em 3/8 de batida jogado pro outro lado.
for (let i = 0; i * BEAT * 0.5 < DURATION; i++) {
  const t = i * BEAT * 0.5;
  if (t < 3.5) continue;
  const ch = chordAt(t);
  const note = ch.arp[i % ch.arp.length];
  let vel = 0.09;
  if (heroPulse(t)) vel = 0.07;
  if (between(t, 10, 12.5)) vel = 0.05 + 0.04 * ((t - 10) / 2.5);
  if (t >= 50) vel = 0.08 * Math.max(0, 1 - (t - 50) / 9) * (i % 2 ? 0.6 : 1);
  if (vel <= 0) continue;
  const bright = groove(t) ? 1 : 0.6;
  const p = pluck(hz(note), 0.6, vel, bright);
  const pan = (i % 4) / 3 - 0.5;
  add(t, p, 1, pan * 0.6);
  add(t + BEAT * 0.75, p, 0.35, -pan * 0.8);
  add(t + BEAT * 1.5, p, 0.14, pan * 0.8);
}

// Bumbo, chimbal e baixo.
for (let i = 0; i * BEAT < DURATION; i++) {
  const t = i * BEAT;
  if (groove(t)) {
    add(t, kick(0.9), 0.9);
    add(t + BEAT / 2, hat(0.22), 1, 0.25);
    if (i % 4 === 3) add(t + BEAT * 0.75, hat(0.12, 90), 1, -0.3);
    const ch = chordAt(t);
    add(t, bass(hz(ch.root), BEAT * 0.45, 0.32));
    add(t + BEAT / 2, bass(hz(ch.root + (i % 2 ? 12 : 0)), BEAT * 0.4, 0.22));
  } else if (heroPulse(t) && i % 2 === 0) {
    add(t, kick(0.5), 0.7);
  }
}

// Efeitos amarrados à imagem.
for (const tr of TRANSITIONS) {
  if (tr.kind === "curtain") whoosh(tr.at, CURTAIN_COVER * 2 + 0.2, 0.55);
  else glitch(tr.from + (tr.to - tr.from) * 0.3, Math.min(0.45, tr.to - tr.from), 0.9);
}
for (const r of HITS.typing) for (let t = r.from; t < r.to; t += 0.045 + rand() * 0.02) tick(t, 2400 + rand() * 1600, 0.35, 0.01);
for (const c of HITS.click) {
  tick(c, 1800, 0.8, 0.02);
  tick(c + 0.09, 1400, 0.5, 0.02);
}
for (const r of HITS.counters) for (let t = r.from; t < r.to; t += 0.05 + (t - r.from) * 0.03) tick(t, 4200, 0.25, 0.006);

// Acorde final segurando até o fim.
pad([45, 57, 64, 67, 71, 76], 57.5, DURATION - 57.5, 0.07, () => 0.02);

// ---------------------------------------------------------- master e wav

let peak = 0;
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fadeIn = Math.min(1, t / 0.4);
  const fadeOut = Math.min(1, (DURATION - t) / 1.6);
  L[i] = Math.tanh(L[i] * 1.4) * fadeIn * fadeOut;
  R[i] = Math.tanh(R[i] * 1.4) * fadeIn * fadeOut;
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const norm = 0.89 / peak;

const data = Buffer.alloc(N * 4);
for (let i = 0; i < N; i++) {
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), i * 4);
  data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), i * 4 + 2);
}
const header = Buffer.alloc(44);
header.write("RIFF", 0);
header.writeUInt32LE(36 + data.length, 4);
header.write("WAVE", 8);
header.write("fmt ", 12);
header.writeUInt32LE(16, 16);
header.writeUInt16LE(1, 20);
header.writeUInt16LE(2, 22);
header.writeUInt32LE(SR, 24);
header.writeUInt32LE(SR * 4, 28);
header.writeUInt16LE(4, 32);
header.writeUInt16LE(16, 34);
header.write("data", 36);
header.writeUInt32LE(data.length, 40);

const dir = fileURLToPath(new URL("../.cache/", import.meta.url));
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}soundtrack.wav`, Buffer.concat([header, data]));
console.log(`${dir}soundtrack.wav`);
