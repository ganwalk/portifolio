// Extrai sequências de quadros (JPEG, 30fps) dos vídeos dos projetos pra
// composição desenhar quadro a quadro. Sequência de imagens em vez de
// <video>: cada quadro do render pede exatamente o quadro certo, sem depender
// de seek de vídeo nem de codec no Chromium headless.
//
// Fontes: sempre o master de maior qualidade que existe no repositório
// (pastas *-preview/ na raiz), caindo pra versão de public/videos quando não
// há master.
//
// Uso: node video-demo/scripts/prepare-media.mjs

import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const MEDIA = join(ROOT, "video-demo/.cache/media");

// [nome, fonte, duração em s, filtro extra]
const CLIPS = [
  // Clipe que alimenta a arte ASCII da Experiência II do Ganwalk (o mesmo
  // do GanwalkAsciiVideo.tsx do site).
  ["ganwalk2", "public/videos/ganwalk-exp2-loop.mp4", 8],
  ["intranet", "intranet-preview/download (1).mp4", 9],
  ["pinkh", "pink-opala-preview/horizontal.mp4", 10],
  ["pinkv", "pink-opala-preview/vertical.mp4", 10],
  ["som", "public/videos/0824.mp4", 8, "scale=900:900"],
  ["cagumela", "public/videos/cagumela-ceu.mp4", 8],
];

for (const [name, src, seconds, filter] of CLIPS) {
  const out = join(MEDIA, name);
  mkdirSync(out, { recursive: true });
  execFileSync(ffmpegPath.path, [
    "-v", "error",
    "-y",
    "-t", String(seconds),
    "-i", join(ROOT, src),
    "-vf", `fps=30${filter ? `,${filter}` : ""}`,
    "-q:v", "3",
    join(out, "%04d.jpg"),
  ]);
  console.log(name, readdirSync(out).length, "quadros");
}
