// Converte os frames PNG do retrato em duas folhas de sprite WebP com
// transparência: uma para telas largas, outra leve para mobile.
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do site):
//
//   npm install --no-save sharp
//   node scripts/build-frames.mjs
//
// Uma folha só, em vez de um arquivo por frame, resolve três coisas de uma vez:
// uma requisição em lugar de dezesseis, nenhum flicker na troca de quadro, e o
// bitmap decodificado é compartilhado entre a cópia normal e a cópia invertida
// que aparece dentro da lente, porque a URL é a mesma.
//
// Se mudar a largura dos tiles, confira a proporção que o script imprime no
// fim: ela precisa casar com o aspect-ratio de .portrait-frames no globals.css.

import sharp from "sharp";
import { mkdir, writeFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// fileURLToPath, e não url.pathname: a pasta de origem tem espaço no nome, e
// pathname devolveria "frames%20eu", que não existe no disco.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC = here("../frames eu");
const OUT = here("../public/frames");
const COLS = 4;
const ROWS = 4;
// Larguras calibradas na mão para o tamanho de exibição na hero (lg exibe até
// ~620px, sm até a largura do retrato no mobile). O desenho é meio tom, então
// uma leve suavização passa despercebida, mas o padrão de pontos é caro de
// comprimir: quality abaixo foi achado testando cada combinação até o ponto
// onde o arquivo cai sem artefato visível no tamanho real de exibição.
const TILE_WIDTHS = { lg: 640, sm: 340 };

const files = Array.from({ length: 16 }, (_, i) => `${SRC}/${i + 1} copiar.png`);

// Caixa de conteúdo de um frame: primeira e última linha/coluna com alfa real.
async function alphaBox(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let top = height;
  let left = width;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > 8) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return { left, top, right, bottom, width, height };
}

const boxes = await Promise.all(files.map(alphaBox));

// União das caixas: o recorte precisa ser o MESMO em todos os frames, senão o
// personagem pula de posição de um frame para o outro.
const union = boxes.reduce(
  (acc, b) => ({
    left: Math.min(acc.left, b.left),
    top: Math.min(acc.top, b.top),
    right: Math.max(acc.right, b.right),
    bottom: Math.max(acc.bottom, b.bottom),
  }),
  { left: Infinity, top: Infinity, right: -1, bottom: -1 },
);

const crop = {
  left: union.left,
  top: union.top,
  width: union.right - union.left + 1,
  height: union.bottom - union.top + 1,
};

const original = boxes[0];
console.log(
  `original ${original.width}x${original.height}, recorte ${crop.width}x${crop.height} ` +
    `(${Math.round((1 - (crop.width * crop.height) / (original.width * original.height)) * 100)}% de área a menos)`,
);

await mkdir(OUT, { recursive: true });

for (const [label, tileW] of Object.entries(TILE_WIDTHS)) {
  const tileH = Math.round((tileW * crop.height) / crop.width);

  const tiles = await Promise.all(
    files.map((file) =>
      sharp(file)
        .extract(crop)
        .resize(tileW, tileH, { fit: "fill" })
        .png()
        .toBuffer(),
    ),
  );

  const sheet = sharp({
    create: {
      width: tileW * COLS,
      height: tileH * ROWS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  });

  const composite = tiles.map((input, i) => ({
    input,
    left: (i % COLS) * tileW,
    top: Math.floor(i / COLS) * tileH,
  }));

  const webp = await sheet
    .composite(composite)
    .webp({ quality: 28, alphaQuality: 75, effort: 6 })
    .toBuffer();

  const path = `${OUT}/eu-${label}.webp`;
  await writeFile(path, webp);
  const { size } = await stat(path);
  console.log(
    `${label}: tile ${tileW}x${tileH}, folha ${tileW * COLS}x${tileH * ROWS}, ${(size / 1024).toFixed(0)} KB`,
  );
}

console.log(`proporção do tile: ${(crop.width / crop.height).toFixed(4)}`);
