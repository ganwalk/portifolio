// Converte os assets brutos da pasta "cagumela" (arte de um projeto de
// animação: cenário, model sheet, paleta e um clipe de teste) pro que o
// card "Estudos de movimento" do Playground realmente usa: um vídeo leve
// para a vitrine em repouso, e três imagens estáticas para o ciclo que
// aparece no hover (ver ExperimentCard.tsx).
//
// Uso (sharp e o binário de ffmpeg não ficam no package.json, são
// ferramenta de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-cagumela-media.mjs
//
// As ilustrações (cenário e model sheet) ficam em cor cheia, ao contrário do
// tratamento de gravura do retrato da hero e da foto do Contato: aqui a cor
// É o assunto, não ruído de alta frequência pra evitar.

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../cagumela");
const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function toWebp(srcFile, outFile, width, quality = 82) {
  await sharp(srcFile)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outFile);
  await logSize(outFile);
}

await mkdir(PHOTOS_OUT, { recursive: true });
await mkdir(VIDEOS_OUT, { recursive: true });

await toWebp(`${SRC_DIR}/CAGUQUARTO.png`, `${PHOTOS_OUT}/cagumela-quarto.webp`, 1000);
await toWebp(`${SRC_DIR}/modelsheet.png`, `${PHOTOS_OUT}/cagumela-modelsheet.webp`, 800);
await toWebp(
  `${SRC_DIR}/f9d1aa3d151736860113b4f3dc4bc178.png`,
  `${PHOTOS_OUT}/cagumela-paleta.webp`,
  600,
  90,
);

const videoSrc = `${SRC_DIR}/céu 14.mp4`;
const videoOut = `${VIDEOS_OUT}/cagumela-ceu.mp4`;
const posterRaw = `${PHOTOS_OUT}/cagumela-ceu-poster-raw.png`;
const posterOut = `${PHOTOS_OUT}/cagumela-ceu-poster.webp`;

// Vitrine muda e em loop (mesmo contrato de MediaView.tsx): sem áudio, 720px
// de largura (o card mostra em aspect-square, object-cover, nunca a
// resolução original), crf alto porque é textura de fundo, não conteúdo
// principal.
await run(ffmpegPath.path, [
  "-y",
  "-i",
  videoSrc,
  "-an",
  "-vf",
  "scale=720:-2",
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "30",
  "-movflags",
  "+faststart",
  videoOut,
]);
await logSize(videoOut);

// Quadro de capa: 2s de entrada, onde a cena já está montada.
await run(ffmpegPath.path, ["-y", "-ss", "2", "-i", videoSrc, "-frames:v", "1", posterRaw]);
await toWebp(posterRaw, posterOut, 720);
await run("rm", [posterRaw]);
