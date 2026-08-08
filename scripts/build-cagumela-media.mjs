// Converte os assets brutos da pasta "cagumela" (arte de um projeto de
// animação: cenário, model sheet e um clipe de teste) pro que o card
// "Estudos de movimento" do Playground realmente usa: um vídeo leve (só os
// primeiros 4s do clipe fonte, ida e volta em loop) para a vitrine em
// repouso, e duas imagens estáticas para o ciclo que aparece no hover (ver
// ExperimentCard.tsx).
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

const videoSrc = `${SRC_DIR}/céu 14.mp4`;
const videoOut = `${VIDEOS_OUT}/cagumela-ceu.mp4`;
const posterRaw = `${PHOTOS_OUT}/cagumela-ceu-poster-raw.png`;
const posterOut = `${PHOTOS_OUT}/cagumela-ceu-poster.webp`;

// Vitrine muda e em loop (mesmo contrato de MediaView.tsx): só os primeiros
// 4s do clipe fonte, sem áudio, 720px de largura (o card mostra em
// aspect-square, object-cover, nunca a resolução original). O arquivo é os
// 4s de ida seguidos dos mesmos 4s de volta (reverse + concat): como
// <video loop> reencadeia o fim no começo, tocar ida-e-volta em vez de só
// ida evita o corte seco de voltar pro quadro inicial a cada repetição.
await run(ffmpegPath.path, [
  "-y",
  "-i",
  videoSrc,
  "-filter_complex",
  "[0:v]trim=0:4,setpts=PTS-STARTPTS,scale=720:-2[fwd];[fwd]split[a][b];[b]reverse[rev];[a][rev]concat=n=2:v=1:a=0[out]",
  "-map",
  "[out]",
  "-an",
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
