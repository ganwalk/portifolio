// Captura a capa animada do case "Guia da música" direto do site publicado
// de verdade (https://guiadelancamentos.com.br/): abre a home, rola
// suavemente pelo dashboard (timeline de lançamentos, mapa por estado,
// grid filtrável) e grava a tela, convertendo pro mesmo formato de vitrine
// que o resto do site já usa (vídeo mudo, em loop, curto e leve, mais um
// still de capa). Mesmo raciocínio de scripts/capture-intranet-cover.mjs.
//
// Uso local: node scripts/capture-guia-cover.mjs
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
const TMP_DIR = here("../.tmp-capture-guia");

const SITE_URL = "https://guiadelancamentos.com.br/";
// Viewport mobile, não desktop: este case agora sempre divide a fatia do
// carrossel da home com a Intranet completa (duas colunas lado a lado, ver
// `group: "web"` em cases.ts), e essa coluna é alta e estreita, muito mais
// perto da proporção de um celular do que de um desktop widescreen. Mesmo
// raciocínio de capture-intranet-cover.mjs, ver os comentários lá.
const VIEWPORT = { width: 430, height: 932 };
const WARMUP_MS = 3500;
const SCROLL_MS = 7000;
const SCROLL_DISTANCE_PX = 3200;

async function captureRawVideo() {
  const browser = await chromium.launch(launchOptions);
  const recordingStart = Date.now();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: TMP_DIR, size: VIEWPORT },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  // "load", não "networkidle": o site mantém um listener em tempo real do
  // Firestore aberto (ver docs/ARQUITETURA.md do repositório), que nunca
  // deixa a rede ficar de fato ociosa, e "networkidle" nunca resolveria.
  await page.goto(SITE_URL, { waitUntil: "load", timeout: 60_000 });
  await page.waitForTimeout(WARMUP_MS);
  const preRollS = (Date.now() - recordingStart) / 1000;

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
    "-vf",
    "scale=860:-2",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "veryslow",
    "-crf",
    "16",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(rawVideo, preRollS, outFile) {
  const rawPng = `${outFile}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", `${preRollS}`, "-i", rawVideo, "-frames:v", "1", rawPng]);
  await sharp(rawPng).resize({ width: 860 }).webp({ quality: 95 }).toFile(outFile);
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

  const videoOut = `${VIDEOS_OUT}/guia-musica-preview.mp4`;
  const posterOut = `${PHOTOS_OUT}/guia-musica-preview.webp`;
  await toLoopMp4(rawVideo, preRollS, videoOut);
  await toPosterWebp(rawVideo, preRollS, posterOut);
  await logSize(videoOut);
  await logSize(posterOut);

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("\nPronto.");
}

main();
