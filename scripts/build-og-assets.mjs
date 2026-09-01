// Prepara o que as imagens sociais precisam ler no build: a fonte das
// legendas num formato que o gerador entende e um quadro solto do retrato.
// O título (nome/case) não usa fonte nenhuma aqui: é contorno vetorial, ver
// scripts/build-og-wordmarks.mjs.
//
// Uso (ferramenta de bancada, não entra no package.json, mesmo critério do
// sharp em build-frames.mjs):
//
//   npm install --no-save sharp @fontsource/ibm-plex-mono
//   node scripts/build-og-assets.mjs
//
// FONTE. O gerador de imagem do Next (satori, por baixo do ImageResponse)
// não decodifica woff2: falta o brotli, e o pacote nem embarca o decodificador.
// Todo pacote de fonte do site é woff2, então o card social cairia na fonte
// padrão do próprio gerador, que não tem nada a ver com o site. A saída é
// levar woff, que o satori lê, e que o pacote do Fontsource já publica ao
// lado do woff2.
//
// IBM Plex Mono (a --font-mono) é a fonte das legendas (rótulo e rodapé), e
// é OFL: copiar o arquivo para dentro do repositório é uso previsto pela
// licença. O arquivo é lido no build e nunca chega ao navegador: o site
// continua servindo o woff2 do pacote original.
//
// RETRATO. O card da home mostra o retrato, e o que existe pronto é a folha
// de sprite da hero, feita para background-position, não para aparecer
// inteira. Este script recorta o primeiro quadro (o de repouso, o mesmo que a
// hero mostra parada) e salva solto. PNG, e não WebP: o recorte precisa da
// transparência para pousar no papel do card, e PNG é o formato com alfa que
// o rasterizador do gerador lê com certeza.

import sharp from "sharp";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const FONTS_OUT = here("../src/fonts/og");
const OG_OUT = here("../src/lib/og");

const FONTS = [
  [
    here(
      "../node_modules/@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff",
    ),
    `${FONTS_OUT}/ibm-plex-mono-400.woff`,
  ],
];

// A folha é uma grade 4x4 (ver scripts/build-frames.mjs). O quadro de repouso
// é o primeiro, no canto superior esquerdo.
const SHEET = here("../public/frames/eu-lg.webp");
const PORTRAIT = `${OG_OUT}/retrato.png`;
const COLUMNS = 4;
const ROWS = 4;
// Largura de exibição no card é 430; 860 dá margem para o rasterizador
// reamostrar a trama da gravura sem criar moiré, e ainda assim é menos da
// metade do quadro original.
const WIDTH = 860;

await mkdir(FONTS_OUT, { recursive: true });
await mkdir(OG_OUT, { recursive: true });

for (const [from, to] of FONTS) {
  await copyFile(from, to);
  const { size } = await stat(to);
  console.log(`${to.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

const sheet = sharp(SHEET);
const { width: sheetWidth, height: sheetHeight } = await sheet.metadata();
const tileWidth = Math.floor(sheetWidth / COLUMNS);
const tileHeight = Math.floor(sheetHeight / ROWS);

await sharp(SHEET)
  .extract({ left: 0, top: 0, width: tileWidth, height: tileHeight })
  // lanczos3 pelo mesmo motivo de build-contact-photo.mjs: a trama é o
  // assunto da imagem, e um filtro mais mole a borra até virar cinza chapado.
  .resize(WIDTH, null, { kernel: "lanczos3" })
  // A trama é quase binária (preto, branco e o cinza da camiseta), então uma
  // paleta de 32 cores não tira nada do desenho e o arquivo cai pela metade.
  .png({ palette: true, colors: 32, effort: 10 })
  .toFile(PORTRAIT);

const { size } = await stat(PORTRAIT);
console.log(`retrato.png: ${WIDTH}px de largura, ${(size / 1024).toFixed(0)} KB`);
