// Converte o vídeo de preview do Ganwalk (textura abstrata: a palavra
// "ganwalk" repetida formando um retrato em silhueta, âmbar sobre preto,
// no mesmo clima "code editor" do site de verdade) pro que o case usa como
// capa: mudo, em loop, leve. A fonte em ganwalk-preview/ é o master em
// VP9/WebM, 1701×956, ~4,8MB: pesado demais pra vitrine que carrega
// sozinha (ver AGENTS.md: performance em todo dispositivo é inegociável).
//
// Uma versão só, ao contrário do Pink Opala (ver
// build-pink-opala-preview.mjs): o conteúdo é abstrato o bastante pra
// funcionar recortado em qualquer proporção (object-cover já resolve),
// então a mesma capa serve tanto o cartão widescreen do desktop quanto a
// tela vertical do celular, sem precisar de uma segunda captura.
//
// Uso (sharp e @ffmpeg-installer não ficam no package.json, são ferramenta
// de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-ganwalk-preview.mjs

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../ganwalk-preview/ganwalk.webm");
const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");
const VIDEO_OUT = `${VIDEOS_OUT}/ganwalk-preview.mp4`;
const POSTER_OUT = `${PHOTOS_OUT}/ganwalk-preview.webp`;

// A fonte tem 30,5s; a textura granulada do efeito (ruído de alta
// frequência quadro a quadro, como o particulado do Pink Opala) comprime
// pior que vídeo comum, então o arquivo cresce rápido com a duração. 10s
// já mostra um ciclo cheio do efeito sem pesar os 30s inteiros num vídeo
// que só toca em loop mesmo.
const CLIP_SECONDS = 8;

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function toLoopMp4() {
  // Mesmo tratamento do resto do site: sem áudio, crf 30, faststart.
  await run(ffmpegPath.path, [
    "-y",
    "-i",
    SRC,
    "-t",
    `${CLIP_SECONDS}`,
    "-vf",
    "scale=720:-2",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "34",
    "-movflags",
    "+faststart",
    VIDEO_OUT,
  ]);
}

async function toPosterWebp() {
  const rawPng = `${POSTER_OUT}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", "0.5", "-i", SRC, "-frames:v", "1", rawPng]);
  await sharp(rawPng).resize({ width: 960 }).webp({ quality: 82 }).toFile(POSTER_OUT);
  await rm(rawPng);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });

  await toLoopMp4();
  await toPosterWebp();
  await logSize(VIDEO_OUT);
  await logSize(POSTER_OUT);
}

main();
