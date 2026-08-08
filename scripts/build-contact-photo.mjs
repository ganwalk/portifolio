// Converte a foto do Contato em WebP no tamanho que o site usa.
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do site):
//
//   npm install --no-save sharp
//   node scripts/build-contact-photo.mjs
//
// Foto de tom contínuo, em cor cheia (diferente do tratamento de gravura em
// preto e branco do retrato da hero): sem trama de meio tom pra proteger do
// compressor, então qualidade fica na faixa normal de foto (webp 82), não no
// 28 que só faz sentido pra imagem já quase binária.
//
// A resolução acompanha a que o layout já usava: a foto ocupa metade da tela
// no desktop, então 1050px de largura cobre a exibição com folga.

import sharp from "sharp";
import { mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// fileURLToPath, e não url.pathname: a pasta de origem tem espaço no nome, e
// pathname devolveria "frames%20eu", que não existe no disco.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../frames eu/WhatsApp Image 2026-08-08 at 12.33.01.jpeg");
const OUT_DIR = here("../public/photos");
const OUT = `${OUT_DIR}/armando-contato.webp`;
const WIDTH = 1050;
const HEIGHT = 1400;
const QUALITY = 82;

await mkdir(OUT_DIR, { recursive: true });

await sharp(SRC)
  .resize(WIDTH, HEIGHT, { fit: "cover", kernel: "lanczos3" })
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(OUT);

const { size } = await stat(OUT);
console.log(`${OUT.split("/").pop()}: ${WIDTH}x${HEIGHT}, ${(size / 1024).toFixed(0)} KB`);
