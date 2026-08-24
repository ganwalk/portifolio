// Gera o poster do experimento "Produção musical" (som-01) a partir do
// próprio vídeo (public/videos/0824.mp4, enviado direto pra main): um
// quadro estático pra MediaView.tsx nunca deixar a área vazia enquanto o
// vídeo carrega ou falha (mesmo raciocínio do poster de cagumela-ceu.mp4).
//
// 1s de entrada, onde a cena já está montada (guitarra, microfone, luz de
// palco), a mesma imagem que dá o contexto pro hoverNote da piada do cabelo
// grande em experiments.ts.
//
// Uso (sharp e o binário de ffmpeg não ficam no package.json, são
// ferramenta de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-som-poster.mjs

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, stat, unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const VIDEO_SRC = here("../public/videos/0824.mp4");
const PHOTOS_OUT = here("../public/photos");
const RAW_FRAME = `${PHOTOS_OUT}/som-01-poster-raw.png`;
const POSTER_OUT = `${PHOTOS_OUT}/som-01-poster.webp`;

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

await mkdir(PHOTOS_OUT, { recursive: true });

await run(ffmpegPath.path, ["-y", "-ss", "1", "-i", VIDEO_SRC, "-frames:v", "1", RAW_FRAME]);
await sharp(RAW_FRAME).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 82 }).toFile(POSTER_OUT);
await logSize(POSTER_OUT);
await unlink(RAW_FRAME);
