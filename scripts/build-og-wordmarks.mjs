// Gera os contornos vetoriais (SVG path) dos títulos que o cartão social
// (og-card.tsx) desenha em Whyte Inktrap: o nome na home e o título de cada
// case. Mesma técnica do favicon (ver build-favicon.mjs): o glifo entra
// como PATH, não como fonte. A Whyte é licenciada (ABC Dinamo), e contornar
// palavras específicas para virar arte fixa é o uso normal de um logotipo,
// diferente de embarcar a fonte inteira (que nem é instalável nesta forma)
// só para gerar cartões sociais.
//
// Uso (ferramenta de bancada, não entra no package.json, mesmo critério do
// sharp em build-frames.mjs e do opentype.js/wawoff2 em build-favicon.mjs):
//
//   npm install --no-save wawoff2 opentype.js
//   node scripts/build-og-wordmarks.mjs
//
// A lista de títulos é fixa e pequena (a home e os cases atuais, ver
// cases.ts): cada um vira um path por PALAVRA, não por título inteiro, para
// empilhar uma palavra por linha (o mesmo desenho do nome na hero, ver
// Hero.tsx: profile.name.split(" ")). O card usa o path pronto, sem nunca
// abrir a fonte: quem não estiver nesta lista (hoje só a versão em chinês do
// case de Landing Pages, "落地页", sem cobertura nenhuma na Whyte) cai no
// texto normal, na fonte de reserva de sempre.

import { decompress } from "wawoff2";
import opentype from "opentype.js";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const FONT = here("../src/fonts/whyte-inktrap/WhyteInktrap-Black.woff2");
const OUT = here("../src/lib/og/wordmarks.ts");

// Referência arbitrária: o path sai nessa escala, e quem desenha (og-card.tsx)
// recalcula a largura final a partir da altura que quiser, pela mesma
// proporção. O valor em si não aparece em lugar nenhum do card.
const REF_SIZE = 200;

const TITLES = [
  "Armando Custodio",
  "Ganwalk",
  "Dezert Horse",
  "Pink Opala",
  "Design System",
  "Landing Pages",
];

const woff2 = await readFile(FONT);
const ttf = Buffer.from(await decompress(woff2));
const font = opentype.parse(
  ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length),
);

/** @param {string} word */
function wordmark(word) {
  const upper = word.toUpperCase();
  // Uma letra por vez, cada uma no PRÓPRIO x=0 (sem deslocamento nenhum), e
  // a posição final entra depois, como transform no SVG (ver Wordmark em
  // og-card.tsx). Um path só pra palavra inteira (font.getPath(word, ...))
  // parecia mais simples, mas alguns glifos desta fonte (ex.: o "D" de
  // "CUSTODIO", o "Z" de "DEZERT") saem com coordenada NaN quando o
  // opentype.js constrói o contorno JÁ deslocado por um x grande, um bug da
  // biblioteca na conversão de curva, não da fonte: o mesmo glifo, no
  // próprio x=0, sai perfeito. Kerning também fica de fora (mesmo raciocínio
  // de antes): uma palavra curta em display, no peso Black, não perde
  // legibilidade nenhuma sem o ajuste fino entre pares.
  const scaleToRef = REF_SIZE / font.unitsPerEm;
  let cumX = 0;
  const glyphs = [];
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const ch of upper) {
    const glyph = font.charToGlyph(ch);
    const glyphPath = glyph.getPath(0, 0, REF_SIZE);
    const box = glyphPath.getBoundingBox();
    glyphs.push({ d: glyphPath.toPathData(2), x: Number(cumX.toFixed(2)) });
    if (Number.isFinite(box.x1)) {
      x1 = Math.min(x1, cumX + box.x1);
      x2 = Math.max(x2, cumX + box.x2);
      y1 = Math.min(y1, box.y1);
      y2 = Math.max(y2, box.y2);
    }
    cumX += glyph.advanceWidth * scaleToRef;
  }
  return {
    word: upper,
    glyphs,
    // Caixa REAL do desenho (cap height, sem a folga de ascendente/
    // descendente que a fonte reserva e o título não usa, já que é tudo
    // caixa alta), não o em-box inteiro da fonte.
    x: Number(x1.toFixed(2)),
    y: Number(y1.toFixed(2)),
    width: Number((x2 - x1).toFixed(2)),
    height: Number((y2 - y1).toFixed(2)),
  };
}

/** @type {Record<string, ReturnType<typeof wordmark>[]>} */
const wordmarks = {};
for (const title of TITLES) {
  wordmarks[title] = title.split(" ").map(wordmark);
}

const header =
  "// Gerado por scripts/build-og-wordmarks.mjs. Não editar à mão: rode o\n" +
  "// script de novo depois de mudar a lista de títulos em TITLES.\n" +
  "// Contorno de cada palavra dos títulos do cartão social, em Whyte Inktrap\n" +
  "// (ver comentário no topo do script gerador: path, não fonte embarcada).\n\n" +
  "export type OgWordmarkGlyph = { d: string; x: number };\n\n" +
  "export type OgWordmarkWord = { word: string; glyphs: OgWordmarkGlyph[]; x: number; y: number; width: number; height: number };\n\n" +
  "export const OG_WORDMARK_REF_SIZE = " + REF_SIZE + ";\n\n" +
  "export const ogWordmarks: Record<string, OgWordmarkWord[]> = ";

await writeFile(OUT, header + JSON.stringify(wordmarks, null, 2) + " as const;\n");

console.log(`wordmarks.ts gerado: ${TITLES.length} títulos, ${Object.values(wordmarks).flat().length} palavras`);
