// Captura a capa animada do case "Intranet completa" direto do site publicado
// de verdade (https://ganwalk.github.io/intranet/): abre a home do Design
// System num navegador headless, rola suavemente pela página mostrando os
// componentes documentados e grava a tela, convertendo pro mesmo formato de
// vitrine que o resto do site já usa (vídeo mudo, em loop, curto e leve, mais
// um still de capa). Mesmo raciocínio de scripts/capture-artist-covers.mjs,
// adaptado pra uma página de produto (sem preloader próprio pra esperar).
//
// Uso local: node scripts/capture-intranet-cover.mjs
// (requer playwright, sharp e @ffmpeg-installer/ffmpeg instalados fora do
// package.json: npm install --no-save playwright sharp @ffmpeg-installer/ffmpeg,
// e o Chromium do Playwright: npx playwright install --with-deps chromium)

import { chromium } from "playwright";
import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Só o ambiente de sandbox usado nesta sessão precisa dessas duas
// acomodações (Chromium pré-instalado fora do caminho padrão do Playwright,
// e TLS 1.3 sofrendo reset intermitente no proxy de saída); num runner de CI
// normal ou numa máquina com internet direta, nenhuma das duas se aplica.
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const PROXY = process.env.HTTPS_PROXY ?? process.env.https_proxy;
const launchOptions = existsSync(SANDBOX_CHROMIUM)
  ? {
      executablePath: SANDBOX_CHROMIUM,
      args: [`--proxy-server=${PROXY}`, "--no-sandbox", "--ssl-version-max=tls1.2"],
    }
  : {};

const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");
const TMP_DIR = here("../.tmp-capture-intranet");

const SITE_URL = "https://ganwalk.github.io/intranet/";
const VIEWPORT = { width: 1600, height: 1000 };
const WARMUP_MS = 1500;
const SCROLL_MS = 8000;
// Distância fixa, não proporcional à altura da página: o Design System
// tem uns 68 mil pixels de altura (70 seções documentadas), e rolar 55%
// disso em 7s (a versão antiga) exigia mais de 200px por quadro no pico
// da curva de easing. Playwright grava a 25fps sem nenhum motion blur
// simulado, então cada quadro é um instante estático: deslocamento
// grande vira ghosting/borrão de verdade (texto duplicado, não um efeito
// de câmera), o "pixelado" que a captura antiga mostrava bem no meio do
// vídeo, longe do quadro de pouso usado como still de capa (por isso
// passava despercebido até reparar direto no vídeo rodando). Este valor
// mantém a velocidade de pico abaixo de uns 40px/quadro, suave o
// bastante pra não borrar, ao custo de percorrer uma fatia menor da
// página (ainda passa por várias seções, só não chega tão longe).
const SCROLL_DISTANCE_PX = 4500;

async function captureRawVideo() {
  const browser = await chromium.launch(launchOptions);
  // A gravação começa na criação do contexto, antes da navegação: o trecho
  // até a página ficar pronta (conexão + carregamento) sai em branco no
  // vídeo bruto. Medido aqui (não um valor fixo chutado) pra cortar certo
  // no ffmpeg depois, robusto à variação de latência da rede.
  const recordingStart = Date.now();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: TMP_DIR, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(SITE_URL, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(WARMUP_MS);
  // Date.now() aqui já inclui o warmup acima, não soma de novo.
  const preRollS = (Date.now() - recordingStart) / 1000;

  // Rolagem suave e contínua pela home do Design System, ease-in-out, do
  // topo até uma distância fixa (ver SCROLL_DISTANCE_PX acima), o bastante
  // pra passar por várias seções documentadas sem virar um scroll
  // vertiginoso nem borrar de movimento.
  await page.evaluate(
    ({ durationMs, distance }) => {
      return new Promise((resolve) => {
        const start = performance.now();
        function ease(t) {
          return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        }
        function step(now) {
          const t = Math.min((now - start) / durationMs, 1);
          window.scrollTo(0, distance * ease(t));
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        }
        requestAnimationFrame(step);
      });
    },
    { durationMs: SCROLL_MS, distance: SCROLL_DISTANCE_PX },
  );

  await context.close();
  await browser.close();

  const [file] = await readdir(TMP_DIR);
  return { rawVideo: `${TMP_DIR}/${file}`, preRollS };
}

async function toLoopMp4(rawVideo, preRollS, outFile) {
  await run(ffmpegPath.path, [
    "-y",
    "-ss",
    `${preRollS}`,
    "-i",
    rawVideo,
    "-t",
    `${SCROLL_MS / 1000}`,
    // Sem downscale (1600, o mesmo da viewport): a página é uma interface
    // com bastante texto pequeno, e reduzir a largura só pra depois
    // reescalar de volta no navegador (o card mostra em vários tamanhos,
    // alguns maiores que 1280) empilhava desfoque de reamostragem em cima
    // da compressão. crf 14 e preset veryslow (contra 28/medium da leva
    // original): a primeira leva saiu com blocagem visível em qualquer
    // texto da tela, justamente o tipo de conteúdo (dashboard, não vídeo
    // de ação) mais sensível a esse artefato, e crf 18 (o patamar
    // costumeiro de "visualmente sem perdas" do libx264) ainda deixava
    // banding visível nos blocos de cor sólida (os cartões de paleta,
    // por exemplo). 14 é bem mais perto de lossless de verdade; o custo
    // maior de arquivo vale a pena aqui, é um asset de build, não algo
    // recalculado em runtime.
    "-vf",
    "scale=1600:-2",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryslow",
    "-crf",
    "14",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(rawVideo, preRollS, outFile) {
  const rawPng = `${outFile}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", `${preRollS}`, "-i", rawVideo, "-frames:v", "1", rawPng]);
  await sharp(rawPng).resize({ width: 1600 }).webp({ quality: 97 }).toFile(outFile);
  await rm(rawPng);
}

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  console.log(`Capturando ${SITE_URL}...`);
  const { rawVideo, preRollS } = await captureRawVideo();
  console.log(`Pré-roll (carregamento) medido: ${preRollS.toFixed(2)}s`);

  const videoOut = `${VIDEOS_OUT}/intranet-preview.mp4`;
  const posterOut = `${PHOTOS_OUT}/intranet-preview.webp`;
  await toLoopMp4(rawVideo, preRollS, videoOut);
  await toPosterWebp(rawVideo, preRollS, posterOut);
  await logSize(videoOut);
  await logSize(posterOut);

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("\nPronto.");
}

main();
