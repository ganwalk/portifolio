// Converte o vídeo bruto da nova capa da Intranet (intranet-preview/download
// (1).mp4, uma peça de motion design pronta, com zoom saindo de um mosaico
// de telas do Design System até o Dashboard do Aluno) pro que o case
// realmente usa: mudo, em loop, leve. Substitui a captura ao vivo que
// scripts/capture-intranet-cover.mjs fazia (aquele script continua
// funcionando, só não é mais a fonte da capa atual: útil se um dia for
// preciso recapturar o site publicado direto).
//
// Sem corte de quadro aqui (ao contrário de build-landing-pages-preview.mjs):
// a fonte já não tem marca d'água nem faixa sobrando, o grão granulado e a
// moldura escura são o próprio desenho da peça, não algo a remover.
//
// Uso (sharp e @ffmpeg-installer não ficam no package.json, são ferramenta
// de bancada, não do site):
//
//   npm install --no-save sharp @ffmpeg-installer/ffmpeg
//   node scripts/build-intranet-preview.mjs

import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../intranet-preview/download (1).mp4");
const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function toLoopMp4(outFile) {
  await run(ffmpegPath.path, [
    "-y",
    "-i",
    SRC,
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    "22",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(outFile) {
  const rawPng = `${outFile}.raw.png`;
  // ss 8 (perto do fim dos 9s da fonte): o quadro de pouso mostra o
  // Dashboard do Aluno já centralizado e parado, não o mosaico ainda em
  // movimento do início.
  await run(ffmpegPath.path, ["-y", "-ss", "8", "-i", SRC, "-frames:v", "1", rawPng]);
  await sharp(rawPng).webp({ quality: 90 }).toFile(outFile);
  await rm(rawPng);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });

  const videoOut = `${VIDEOS_OUT}/intranet-preview.mp4`;
  const posterOut = `${PHOTOS_OUT}/intranet-preview.webp`;
  await toLoopMp4(videoOut);
  await toPosterWebp(posterOut);
  await logSize(videoOut);
  await logSize(posterOut);
}

main();
