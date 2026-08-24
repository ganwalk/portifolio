// Converte os stills brutos da grade animada de componentes da Intranet
// (intranet-componentes/*.png, enviados direto pra main em 20/08/2026) pro
// que a prévia ao vivo do case usa (ver IntranetGridPreview.tsx): nove
// pranchetas do Design System (Progress Bar, Contagem Regressiva, Timeline,
// Botões, Paleta Sequencial, Tipografia, Badges & Tags, Dashboard do Aluno).
//
// Sem .trim() (versão anterior cortava a margem preta ao redor do conteúdo
// automaticamente): pedido explícito de usar as pranchetas exatamente como
// foram enviadas, moldura preta original incluída, não uma versão recortada
// por heurística. Como resultado direto, as nove saem todas na MESMA
// proporção (as pranchetas originais já têm o mesmo tamanho, 1166×724), o
// que também simplifica a grade: uma célula só (ver ASPECT em
// IntranetGridPreview.tsx) serve pra todas, sem letterbox nenhum.
//
// Só redimensiona pra largura de exibição real (800px, não os ~1150px da
// prancheta original).
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do
// site):
//
//   npm install --no-save sharp
//   node scripts/build-intranet-grid.mjs

import sharp from "sharp";
import { mkdir, readdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../intranet-componentes");
const OUT_DIR = here("../public/photos/intranet-grid");

const TILE_WIDTH = 800;
const TILE_QUALITY = 92;

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = (await readdir(SRC_DIR)).sort();
  let i = 1;
  for (const file of files) {
    const outFile = `${OUT_DIR}/ig-${String(i).padStart(2, "0")}.webp`;
    await sharp(`${SRC_DIR}/${file}`)
      .resize({ width: TILE_WIDTH, withoutEnlargement: true })
      .webp({ quality: TILE_QUALITY })
      .toFile(outFile);
    await logSize(outFile);
    i += 1;
  }
}

main();
