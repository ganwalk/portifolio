// Gera o favicon do site a partir de "A." na Whyte Inktrap.
//
// Uso (as ferramentas não ficam no package.json, são de bancada, não do site,
// mesmo critério do sharp em build-frames.mjs e build-contact-photo.mjs):
//
//   npm install --no-save sharp wawoff2 opentype.js
//   node scripts/build-favicon.mjs
//
// O desenho é o mesmo gesto do cabeçalho e da hero: a assinatura em Whyte
// Inktrap, e a inversão tinta/papel da lente. Um quadrado de tinta com "A."
// vazado em papel, o ponto que fecha a assinatura. Nada além disso: a 16px,
// que é o tamanho que importa numa aba, qualquer segundo elemento (a
// gravura do fundo, o retrato) vira mancha. O que sobra do desenho da fonte
// nesse tamanho são os ink traps do "A", e é justamente o detalhe que dá
// nome à família.
//
// O glifo entra como PATH, não como fonte: a Whyte é licenciada (ABC Dinamo),
// e contornar uma letra para virar marca é o uso normal de um logotipo,
// diferente de redistribuir a fonte inteira num formato instalável. Aqui o
// contorno é extraído na bancada e escrito direto nos arquivos gerados, então
// nem o woff2 nem um ttf convertido precisam ser lidos no build do site.
//
// Saem três arquivos, e cada um responde a um navegador diferente:
//
//   src/app/icon.svg      Chrome e Firefox preferem o SVG. É o único que
//                         inverte sozinho conforme o tema do sistema, por uma
//                         media query DENTRO do arquivo (favicon em SVG honra
//                         prefers-color-scheme nesses dois navegadores).
//   src/app/favicon.ico   Safari e navegador antigo, que não leem SVG. Não
//                         tem como inverter, então fica na versão clara, a
//                         padrão do site. Numa barra de abas escura o quadrado
//                         se funde ao fundo e sobra o "A" branco, que continua
//                         legível: num desenho vazado, um dos dois elementos
//                         sempre contrasta com o que está em volta.
//   src/app/apple-icon.png  Tela de início do iOS, que ignora transparência e
//                         arredonda por conta própria, então precisa de um
//                         PNG chapado, sangrado até a borda.

import sharp from "sharp";
import { decompress } from "wawoff2";
import opentype from "opentype.js";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const FONT = here("../src/fonts/whyte-inktrap/WhyteInktrap-Black.woff2");
const APP = here("../src/app");

// Os mesmos tokens de globals.css. Repetidos aqui porque estes arquivos são
// gerados fora do CSS e não têm como ler variável nenhuma.
const INK_LIGHT = "#0b0b0b";
const PAPER_LIGHT = "#ffffff";
const INK_DARK = "#0a0a0a";
const PAPER_DARK = "#f4f4f4";

const TILE = 64;
// Largura de "A." dentro do quadrado. 0.66 deixa a letra dominante sem
// encostar na borda: com menos ela vira um selo com moldura, com mais os
// vértices do "A" tocam o corte e o desenho perde o ar de letra.
const LETTER_WIDTH = 0.66;

const woff2 = await readFile(FONT);
const ttf = Buffer.from(await decompress(woff2));
const font = opentype.parse(
  ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length),
);
// getPath com string (não charToGlyph): "A." é duas glifos, e é a própria
// fonte quem resolve o avanço entre elas (kerning, se houver, do par "A."
// definido na Whyte). Desenha com a linha de base em y = 0 e a letra subindo
// para y negativo, que é a convenção da fonte, não a do SVG. O translate
// abaixo reposiciona; nada de flip, porque o eixo já sai no sentido certo
// depois que opentype.js converte para coordenadas de tela.
const glyphPath = font.getPath("A.", 0, 0, 1000);
const path = glyphPath.toPathData(2);
const box = glyphPath.getBoundingBox();
const width = box.x2 - box.x1;
const height = box.y2 - box.y1;

const scale = (TILE * LETTER_WIDTH) / width;
const x = (TILE - width * scale) / 2 - box.x1 * scale;
const y = (TILE + height * scale) / 2;
const letter = `<path d="${path}" transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(5)})"`;

/** Versão de cor fixa, para rasterizar. */
const flat = (tile, ink) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}" width="${TILE}" height="${TILE}">` +
  `<rect width="${TILE}" height="${TILE}" fill="${tile}"/>` +
  `${letter} fill="${ink}"/></svg>`;

/** Versão que inverte com o tema do sistema, para o icon.svg. */
const adaptive =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${TILE} ${TILE}">` +
  `<style>.t{fill:${INK_LIGHT}}.a{fill:${PAPER_LIGHT}}` +
  `@media(prefers-color-scheme:dark){.t{fill:${PAPER_DARK}}.a{fill:${INK_DARK}}}</style>` +
  `<rect class="t" width="${TILE}" height="${TILE}"/>` +
  `${letter} class="a"/></svg>`;

await writeFile(`${APP}/icon.svg`, `${adaptive}\n`);

const light = Buffer.from(flat(INK_LIGHT, PAPER_LIGHT));
const png = (size) =>
  sharp(light, { density: 384 }).resize(size, size).png().toBuffer();

await sharp(light, { density: 768 }).resize(180, 180).png().toFile(`${APP}/apple-icon.png`);

// ICO na mão: o formato é um cabeçalho de 6 bytes, um diretório de 16 bytes
// por tamanho e os arquivos enfileirados no fim. Os quadros vão como PNG (o
// próprio formato aceita desde o Vista, e é o que todo navegador atual lê),
// e não como BMP, que exigiria máscara de transparência à parte.
const SIZES = [16, 32, 48];
const frames = await Promise.all(SIZES.map(png));

const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reservado
header.writeUInt16LE(1, 2); // 1 = ícone
header.writeUInt16LE(SIZES.length, 4);

let offset = 6 + SIZES.length * 16;
const directory = SIZES.map((size, index) => {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt8(0, 2); // paleta: nenhuma
  entry.writeUInt8(0, 3); // reservado
  entry.writeUInt16LE(1, 4); // planos
  entry.writeUInt16LE(32, 6); // bits por pixel
  entry.writeUInt32LE(frames[index].length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += frames[index].length;
  return entry;
});

await writeFile(`${APP}/favicon.ico`, Buffer.concat([header, ...directory, ...frames]));

console.log(`icon.svg, favicon.ico (${SIZES.join("/")}) e apple-icon.png (180) gerados`);
