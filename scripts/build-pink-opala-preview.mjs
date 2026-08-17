// Converte os dois vídeos de preview do Pink Opala (gravação de tela do
// hero de partículas do próprio site, reagindo ao mouse) pro que o case
// realmente usa: mudo, em loop, leve. As fontes em pink-opala-preview/ são
// masters em HEVC 1080p/1920p, ~17MB cada, ~7,5Mbps: sem suporte confiável
// em <video> fora do Safari e pesados demais pra vitrine que carrega sozinha
// (ver AGENTS.md: performance em todo dispositivo é inegociável).
//
// Duas versões porque o case mostra uma ou outra dependendo da tela (ver
// MediaView.tsx, srcMobile/posterMobile): a horizontal (16:9) preenche bem
// o painel widescreen do desktop, a vertical (9:16) evita o corte agressivo
// que a horizontal sofreria numa tela de celular em pé.
//
// Uso (sharp e @ffmpeg-installer não ficam no package.json, são ferramenta
// de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-pink-opala-preview.mjs

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../pink-opala-preview");
const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");

// Mesma área de quadro pras duas orientações (960×540 ≈ 540×960), pra não
// dar peso desproporcional a uma versão só por causa da orientação.
const VARIANTS = [
  { name: "horizontal", src: `${SRC_DIR}/horizontal.mp4`, scale: "960:-2" },
  { name: "vertical", src: `${SRC_DIR}/vertical.mp4`, scale: "-2:960" },
];

// A fonte tem 18s; a textura granulada das partículas comprime pior que
// vídeo comum (muito ruído de alta frequência quadro a quadro), então o
// arquivo cresce rápido com a duração. 10s já mostra um ciclo completo da
// interação com o mouse sem pesar 18s inteiros num vídeo que só toca em
// loop mesmo.
const CLIP_SECONDS = 10;

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function toLoopMp4(src, scale, outFile) {
  // Mesmo tratamento do resto do site: sem áudio, crf 30, faststart.
  await run(ffmpegPath.path, [
    "-y",
    "-i",
    src,
    "-t",
    `${CLIP_SECONDS}`,
    "-vf",
    `scale=${scale}`,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "30",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(src, outFile) {
  const rawPng = `${outFile}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", "0.5", "-i", src, "-frames:v", "1", rawPng]);
  await sharp(rawPng).webp({ quality: 82 }).toFile(outFile);
  await rm(rawPng);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });

  for (const { name, src, scale } of VARIANTS) {
    console.log(`\n== ${name} ==`);
    const videoOut = `${VIDEOS_OUT}/pink-opala-preview-${name}.mp4`;
    const posterOut = `${PHOTOS_OUT}/pink-opala-preview-${name}.webp`;
    await toLoopMp4(src, scale, videoOut);
    await toPosterWebp(src, posterOut);
    await logSize(videoOut);
    await logSize(posterOut);
  }
}

main();
