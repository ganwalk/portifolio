// Converte o vídeo bruto de Landing Pages (landing-pages-preview/Scene (1).mp4,
// um convite/reel em vídeo, exportado do Jitter, mostrando várias landing
// pages reais do ecossistema em mosaico) pro que o case realmente usa: mudo,
// em loop, leve, e sem a marca d'água "jitter.video" que o exportador cola
// no canto inferior direito.
//
// A marca d'água mora nos últimos ~100px do quadro (checado à mão extraindo
// quadros em vários instantes do vídeo: sempre no mesmo canto, mesmo
// tamanho, do início ao fim). Em vez de tentar mascarar só aquele canto
// (formas/cores variam conforme o que está por baixo dela), o corte remove a
// tira inteira (960×720 → 960×620): mais simples, sem risco de sobrar
// resíduo em nenhum quadro. object-position "top" na exibição (ver
// cases.ts, campo `objectPosition` de `cover`) garante que qualquer corte
// adicional feito pelo `object-cover` do card sempre prefira manter o TOPO
// do quadro (onde está o essencial do mosaico) visível, nunca a base
// recém-cortada.
//
// Uso (sharp e @ffmpeg-installer não ficam no package.json, são ferramenta
// de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-landing-pages-preview.mjs

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../landing-pages-preview/Scene (1).mp4");
const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");

// Corte fixo em pixel (não uma % calculada em runtime): a fonte tem sempre
// 960×720, e o quadro final (960×620) some com a faixa de baixo inteira,
// marca d'água incluída, sem tocar nas laterais nem no topo.
const CROP = "960:620:0:0";

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function toLoopMp4(outFile) {
  // crf 14 e preset veryslow, não um meio-termo: pedido explícito do
  // Armando é priorizar qualidade sobre peso de arquivo, "melhor a página
  // demorar mais pra carregar do que o vídeo sair de baixa qualidade".
  await run(ffmpegPath.path, [
    "-y",
    "-i",
    SRC,
    "-vf",
    `crop=${CROP}`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryslow",
    "-crf",
    "14",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(outFile) {
  const rawPng = `${outFile}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", "0.5", "-i", SRC, "-vf", `crop=${CROP}`, "-frames:v", "1", rawPng]);
  await sharp(rawPng).webp({ quality: 97 }).toFile(outFile);
  await rm(rawPng);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });

  const videoOut = `${VIDEOS_OUT}/landing-pages-preview.mp4`;
  const posterOut = `${PHOTOS_OUT}/landing-pages-preview.webp`;
  await toLoopMp4(videoOut);
  await toPosterWebp(posterOut);
  await logSize(videoOut);
  await logSize(posterOut);
}

main();
