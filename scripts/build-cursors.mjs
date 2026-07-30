// Converte as três imagens-fonte do cursor (mão apontando, uma pose por
// estado: repouso, hover, clique) em WebP pequenos o bastante pra CSS
// cursor: url() de verdade usar a imagem em vez de cair no fallback (a
// maioria dos navegadores ignora cursores maiores que ~128px e volta pro
// ponteiro do sistema).
//
// Uso (sharp não fica no package.json, é ferramenta de bancada, não do site):
//
//   npm install --no-save sharp
//   node scripts/build-cursors.mjs
//
// As três fontes têm a mão em poses ligeiramente diferentes (o dedo muda de
// posição a cada estado), então um recorte "por imagem" deixaria a mão
// pulando de tamanho/posição na troca de estado. Em vez disso, as três são
// recortadas pela MESMA caixa (a união das caixas de alfa de cada uma), que
// preserva o enquadramento entre os estados; só a pose muda dentro dele.
//
// O ponto de clique do cursor (hotspot) é a ponta do dedo indicador: o
// pixel mais alto com alfa de verdade em cada imagem, medido antes do
// recorte e depois convertido pra escala do arquivo final.

import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const SRC_DIR = here("../cursor");
const OUT_DIR = here("../public/cursor");
const STATES = ["repouso", "hover", "clique"];
const TARGET_WIDTH = 56; // bem abaixo do limite prático de ~128px dos navegadores
const ALPHA_THRESHOLD = 8;

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
      if (data[(y * width + x) * channels + 3] > ALPHA_THRESHOLD) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  return { left, top, right, bottom, width, height };
}

// Ponto mais alto com alfa de verdade: a ponta do dedo indicador em todas
// as três poses. Dentro da primeira linha com alfa, usa o pixel do meio
// (a ponta do dedo tem uns poucos pixels de largura ali).
async function fingertip(file) {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  for (let y = 0; y < height; y++) {
    const xs = [];
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * channels + 3] > ALPHA_THRESHOLD) xs.push(x);
    }
    if (xs.length > 0) {
      const x = xs[Math.floor(xs.length / 2)];
      return { x, y };
    }
  }
  throw new Error(`${file}: nenhum pixel com alfa encontrado`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const files = Object.fromEntries(
    STATES.map((s) => [s, `${SRC_DIR}/${s}.png`]),
  );

  const boxes = {};
  const tips = {};
  for (const s of STATES) {
    boxes[s] = await alphaBox(files[s]);
    tips[s] = await fingertip(files[s]);
  }

  // União das caixas: mesmo enquadramento nos três estados.
  const cropLeft = Math.min(...STATES.map((s) => boxes[s].left));
  const cropTop = Math.min(...STATES.map((s) => boxes[s].top));
  const cropRight = Math.max(...STATES.map((s) => boxes[s].right));
  const cropBottom = Math.max(...STATES.map((s) => boxes[s].bottom));
  const cropWidth = cropRight - cropLeft + 1;
  const cropHeight = cropBottom - cropTop + 1;

  const targetHeight = Math.round((cropHeight / cropWidth) * TARGET_WIDTH);
  const scale = TARGET_WIDTH / cropWidth;

  console.log("Caixa unificada:", {
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
  });
  console.log("Tamanho final:", `${TARGET_WIDTH}x${targetHeight}`);

  const hotspots = {};

  for (const s of STATES) {
    const outPath = `${OUT_DIR}/${s}.webp`;
    await sharp(files[s])
      .extract({
        left: cropLeft,
        top: cropTop,
        width: cropWidth,
        height: cropHeight,
      })
      .resize(TARGET_WIDTH, targetHeight)
      .webp({ quality: 85 })
      .toFile(outPath);

    const hotspotX = Math.round((tips[s].x - cropLeft) * scale);
    const hotspotY = Math.round((tips[s].y - cropTop) * scale);
    hotspots[s] = { x: hotspotX, y: hotspotY };

    const { size } = await import("node:fs/promises").then((fs) =>
      fs.stat(outPath),
    );
    console.log(`${s}: ${outPath} (${size} bytes), hotspot ${hotspotX} ${hotspotY}`);
  }

  console.log("\nCSS:");
  for (const s of STATES) {
    console.log(
      `${s}: url('/cursor/${s}.webp') ${hotspots[s].x} ${hotspots[s].y}`,
    );
  }
}

main();
