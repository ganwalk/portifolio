// Converte os stills brutos da grade animada de Landing Pages
// (landing-pages-grid/*.png, enviados direto pra main em 20/08/2026) pro
// que a prévia ao vivo do case realmente usa (ver LandingPagesGridPreview.tsx):
// sete capturas de landing pages reais do ecossistema. O fundo por trás
// delas não vem mais de uma foto (FUNDO.jpg, que ainda mora na pasta bruta
// só como referência histórica, sem ser processada): é puro CSS agora
// (.grid-fundo-gradient--landing + .texture-noise-animate, ver
// globals.css), sem asset nenhum pra gerar aqui.
//
// As capturas são screenshots de página inteira (~1900px de largura
// nativa), pesadas demais pra ladrilhos de uma grade que nunca aparece
// maior que uma fração da tela: redimensionadas pra 700px (2x o tamanho
// de exibição típico de um ladrilho, o suficiente pra tela retina sem
// carregar o pixel a mais que não some na composição).
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do
// site):
//
//   npm install --no-save sharp
//   node scripts/build-landing-pages-grid.mjs

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../landing-pages-grid");
const OUT_DIR = here("../public/photos/landing-pages-grid");

const TILE_WIDTH = 700;
const TILE_QUALITY = 92;

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).filter((f) => f !== "FUNDO.jpg");
  let i = 1;
  for (const file of files.sort()) {
    const outFile = `${OUT_DIR}/lp-${String(i).padStart(2, "0")}.webp`;
    await sharp(`${SRC_DIR}/${file}`).resize({ width: TILE_WIDTH }).webp({ quality: TILE_QUALITY }).toFile(outFile);
    await logSize(outFile);
    i += 1;
  }
}

main();
