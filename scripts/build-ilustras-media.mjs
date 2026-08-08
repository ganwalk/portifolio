// Converte as ilustrações da pasta "ilustras" (algumas PNGs de até 21 MB,
// exportadas direto de programa de design) pro que o card "Colagens e
// ilustrações digitais" do Playground realmente usa: uma galeria de WebP
// leves que troca sozinha, sem precisar de hover (ver ExperimentCard.tsx).
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do site):
//
//   npm install --no-save sharp
//   node scripts/build-ilustras-media.mjs
//
// Cor cheia, sem tratamento de gravura (mesmo critério das outras ilustrações
// coloridas do site): aqui a cor é o assunto. Largura de 1000px é generosa pra
// exibição em card de grade (aspect-square, object-cover), mas o quanto isso
// emagrece um PNG de 21 MB é o que realmente importa.

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../ilustras");
const OUT_DIR = here("../public/photos");
const WIDTH = 1000;
const QUALITY = 82;

// slug de saída -> nome do arquivo fonte (nomes de exportação, alguns com
// espaço e maiúsculas variadas).
const FILES = {
  "ilustra-venturo": "23.png",
  "ilustra-cabeca": "IG MEIO.png",
  "ilustra-manuzika": "Manuzika 2.png",
  "ilustra-simetria": "Sem Título-2.png",
  "ilustra-auuuuu": "auuuuu.png",
  "ilustra-flores": "folores (1).png",
  "ilustra-irezumi": "irezumi.png",
  "ilustra-majuju": "majuju.png",
};

await mkdir(OUT_DIR, { recursive: true });

for (const [slug, file] of Object.entries(FILES)) {
  const outFile = `${OUT_DIR}/${slug}.webp`;
  await sharp(`${SRC_DIR}/${file}`)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY, effort: 6 })
    .toFile(outFile);
  const { size } = await stat(outFile);
  console.log(`${slug}.webp: ${(size / 1024).toFixed(0)} KB`);
}
