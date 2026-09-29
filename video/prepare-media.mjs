// Extrai as prévias em vídeo do site pra sequências de JPEG a 30 fps, em
// video/.cache/. A composição desenha cada quadro a partir dessas imagens em
// vez de tocar o <video> direto: o Chromium sem codecs proprietários não abre
// H.264, e buscar quadro exato num <video> nunca é determinístico. Com a
// sequência pronta, o quadro N do filme é sempre o mesmo pixel.

import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cache = join(root, "video", ".cache");

const SOURCES = {
  ganwalk: { src: "public/videos/ganwalk-exp2-loop.mp4", width: 480 },
  "pink-h": { src: "public/videos/pink-opala-preview-horizontal.mp4", width: 1280 },
  "pink-v": { src: "public/videos/pink-opala-preview-vertical.mp4", width: 720 },
  intranet: { src: "public/videos/intranet-preview.mp4", width: 1440 },
  landing: { src: "public/videos/landing-pages-preview.mp4", width: 960 },
  cagumela: { src: "public/videos/cagumela-ceu.mp4", width: 720 },
  som: { src: "public/videos/0824.mp4", width: 720 },
};

const manifest = {};
for (const [name, { src, width }] of Object.entries(SOURCES)) {
  const out = join(cache, name);
  if (!existsSync(out) || readdirSync(out).length === 0) {
    mkdirSync(out, { recursive: true });
    execFileSync("ffmpeg", [
      "-v", "error", "-y", "-i", join(root, src),
      "-vf", `fps=30,scale='min(${width},iw)':-2:flags=lanczos`,
      "-q:v", "2", join(out, "%04d.jpg"),
    ]);
  }
  manifest[name] = { count: readdirSync(out).filter((f) => f.endsWith(".jpg")).length };
  console.log(name, manifest[name].count, "quadros");
}
writeFileSync(join(cache, "manifest.json"), JSON.stringify(manifest, null, 2));
