// Captura stills em alta qualidade de componentes específicos do Design
// System da Intranet (mais um do Manual de Tom e Voz e um de Nossas
// Soluções), direto do site publicado de verdade. Ao contrário de
// capture-intranet-cover.mjs (vídeo de rolagem, para a capa do card),
// aqui cada alvo vira um still nítido (sem compressão de vídeo H264 no
// meio do caminho), recortado exatamente na caixa do componente na
// página real (mesmo seletor #id que a navegação por âncora do próprio
// site usa), pra virar a vitrine "componentes em destaque" do corpo do
// case (ver IntranetShowcase.tsx e src/data/intranetHighlights.ts).
//
// Uso local: node scripts/capture-intranet-highlights.mjs
// (requer playwright e sharp instalados fora do package.json:
// npm install --no-save playwright sharp)

import { chromium } from "playwright";
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const PHOTOS_OUT = here("../public/photos/intranet");

const BASE = "https://ganwalk.github.io/intranet";
const VIEWPORT = { width: 1600, height: 1100 };
const DPR = 2; // still, não vídeo: pode se dar ao luxo de retina de verdade.

const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const PROXY = process.env.HTTPS_PROXY ?? process.env.https_proxy;
const launchOptions = existsSync(SANDBOX_CHROMIUM)
  ? {
      executablePath: SANDBOX_CHROMIUM,
      args: [`--proxy-server=${PROXY}`, "--no-sandbox", "--ssl-version-max=tls1.2"],
    }
  : {};

const TARGETS = [
  // "Marca & Logos" é uma seção longa (segue com "Marca B" e "Área de
  // Segurança" depois do que interessa aqui): maxHeight corta na altura
  // certa, logo depois dos cartões da Marca A, em vez de vazar pro resto.
  { id: "marca", url: `${BASE}/design-system`, anchor: "marca", pad: 16, maxHeight: 700 },
  { id: "cores", url: `${BASE}/design-system`, anchor: "colors", pad: 16 },
  { id: "roadmap", url: `${BASE}/design-system`, anchor: "roadmap-timeline", pad: 16 },
  { id: "novidades", url: `${BASE}/design-system`, anchor: "mural-novidades", pad: 16 },
  // "Voz da Liderança" (#fundador) é a seção inteira do manual, com vários
  // cartões (a foto e o texto do fundador, "como NÃO se comunicar",
  // "exemplos de erros"): childRange pega só o título mais o PRIMEIRO
  // cartão (a apresentação com a foto), os dois primeiros filhos diretos
  // da section, em vez da seção toda.
  { id: "lideranca", url: `${BASE}/tom-e-voz`, anchor: "fundador", pad: 16, childRange: [0, 1] },
  { id: "solucoes", url: `${BASE}/solucoes`, anchor: "resumo", pad: 16 },
];

async function captureOne(page, { id, url, anchor, pad, childRange, maxHeight }) {
  await page.goto(`${url}#${anchor}`, { waitUntil: "networkidle", timeout: 60_000 });
  // block: "start", não o scrollIntoViewIfNeeded padrão (alinha pela borda
  // mais PERTO, que pra uma section mais alta que a viewport podia ser a
  // de baixo): garante que o topo do alvo sempre fica perto do topo da
  // tela, então a caixa medida embaixo nunca sai com y negativo (o que
  // cortava o recorte no meio do conteúdo errado).
  await page.locator(`#${anchor}`).evaluate((el) => el.scrollIntoView({ block: "start" }));
  // O scroll-spy e o próprio scrollIntoView do site já levam até a âncora
  // pela URL; a folga extra é só pra qualquer transição de entrada assentar
  // (fade dos gráficos, montagem do RoadmapTimeline) antes da captura.
  await page.waitForTimeout(900);

  const box = childRange
    ? await page.evaluate(
        ({ anchor, from, to }) => {
          const children = [...document.getElementById(anchor).children].slice(from, to + 1);
          const rects = children.map((el) => el.getBoundingClientRect());
          const x = Math.min(...rects.map((r) => r.left));
          const y = Math.min(...rects.map((r) => r.top));
          const right = Math.max(...rects.map((r) => r.right));
          const bottom = Math.max(...rects.map((r) => r.bottom));
          return { x, y, width: right - x, height: bottom - y };
        },
        { anchor, from: childRange[0], to: childRange[1] },
      )
    : await page.locator(`#${anchor}`).boundingBox();
  if (!box) throw new Error(`elemento #${anchor} não encontrado em ${url}`);

  const clip = {
    x: Math.max(0, box.x - pad),
    y: Math.max(0, box.y - pad),
    width: box.width + pad * 2,
    height: Math.min(box.height + pad * 2, maxHeight ?? Infinity),
  };

  const rawPng = `${PHOTOS_OUT}/${id}.raw.png`;
  await page.screenshot({ path: rawPng, clip });

  const outFile = `${PHOTOS_OUT}/${id}.webp`;
  await sharp(rawPng)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 92 })
    .toFile(outFile);
  const { unlink } = await import("node:fs/promises");
  await unlink(rawPng);

  const { stat } = await import("node:fs/promises");
  const { size } = await stat(outFile);
  console.log(`${id}.webp: ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext({ viewport: VIEWPORT, deviceScaleFactor: DPR });
  const page = await context.newPage();

  for (const target of TARGETS) {
    console.log(`\n== ${target.id} (${target.url}#${target.anchor}) ==`);
    await captureOne(page, target);
  }

  await browser.close();
  console.log("\nPronto. Revise public/photos/intranet/ antes de apontar src/data/intranetHighlights.ts pros arquivos novos.");
}

main();
