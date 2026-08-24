// Converte o fundo bruto (landing-pages-grid/FUNDO.jpg, enviado direto pra
// main em 20/08/2026, o mesmo gradiente cinza granulado que inspirou o
// .grid-fundo-gradient sintético em CSS) pro que a prévia ao vivo da
// Intranet usa de verdade agora: a FOTO em si, não uma aproximação em
// gradiente radial. Tentativas anteriores de recriar esse visual só com CSS
// nunca convenceram; a imagem já tem a nuvem de luz fora de centro e o grão
// pesado que o CSS tentava (e não conseguia) simular.
//
// 1600px de largura (a fonte tem 7759px, um still de câmera bruto): mais que
// o suficiente pra uma tela cheia em qualquer resolução comum, já que o
// visual é desfocado/granulado por natureza, não tem detalhe fino pra
// justificar mais.
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do
// site):
//
//   npm install --no-save sharp
//   node scripts/build-intranet-fundo.mjs

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../landing-pages-grid/FUNDO.jpg");
const OUT_DIR = here("../public/photos/intranet-grid");
const OUT_FILE = `${OUT_DIR}/fundo.webp`;

const WIDTH = 1600;
const QUALITY = 86;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await sharp(SRC).resize({ width: WIDTH }).webp({ quality: QUALITY }).toFile(OUT_FILE);
  const { size } = await stat(OUT_FILE);
  console.log(`fundo.webp: ${(size / 1024).toFixed(0)} KB`);
}

main();
