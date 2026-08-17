// Captura a capa animada dos três projetos de artista (Ganwalk, Dezert
// Horse, Pink Opala) direto dos sites publicados de verdade: abre cada
// `demoUrl` num navegador headless, grava alguns segundos da tela em
// repouso (sem clicar em nada) e converte pro mesmo formato que o resto do
// site já usa como vitrine (vídeo mudo, em loop, curto e leve, mais um
// still de capa).
//
// Só roda em CI (ver .github/workflows/capture-artist-covers.yml): o
// ambiente de desenvolvimento deste repositório não tem acesso de rede
// direto o bastante pro Chromium completar uma conexão HTTPS de verdade, e
// gravar tela exige um navegador real renderizando a página, não só um
// fetch. Um runner do GitHub Actions tem internet normal, sem proxy no meio,
// e resolve isso de graça.
//
// Uso local (fora de CI, numa máquina com internet direta; sharp, playwright
// e @ffmpeg-installer não ficam no package.json, são ferramenta de bancada,
// não do site):
//
//   npm install --no-save playwright sharp @ffmpeg-installer/ffmpeg
//   npx playwright install --with-deps chromium
//   node scripts/capture-artist-covers.mjs
//
// @ffmpeg-installer, não o binário do PATH: o runner padrão do GitHub
// Actions não vem com ffmpeg instalado (só um ffmpeg PRÓPRIO do Playwright,
// de uso interno, não exposto no PATH), e essa dependência já é como
// build-cagumela-media.mjs resolve o mesmo problema.

import { chromium } from "playwright";
import sharp from "sharp";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readdir, rm, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

const PHOTOS_OUT = here("../public/photos");
const VIDEOS_OUT = here("../public/videos");
const TMP_DIR = here("../.tmp-capture");

// Tempo parado na página antes de começar a gravar: dá chance de
// preloaders, fontes e a primeira onda de animação (partículas, glitch)
// assentarem, pra não gravar o instante de carregamento em vez do repouso
// de verdade que o card mostra sempre.
const WARMUP_MS = 4000;
// Duração da gravação: curta o bastante pra virar um arquivo leve depois do
// ffmpeg, longa o bastante pra capturar um ciclo completo de qualquer
// animação em loop.
const RECORD_MS = 6000;
const VIEWPORT = { width: 1600, height: 1000 };

// Ganwalk e Dezert Horse têm preloader PRÓPRIO por cima do "networkidle" do
// Playwright: uma tela de carregamento que só sai do caminho quando o JS do
// site termina de montar a cena (e, no caso do cavalo, termina de baixar um
// modelo 3D externo), texto que muda pra um convite de clique quando fica
// pronta. Sem esperar por isso, a captura vazou a tela de "carregando..." em
// vez do repouso de verdade (foi o que aconteceu na primeira captura real:
// ver public/photos/{ganwalk,dezert-horse}-live-poster.webp daquela
// rodada). `waitFor`, quando existe, espera esse sinal (best effort: se o
// site mudar de marcação e o seletor sumir, a captura não trava pra
// sempre, só cai direto pro warmup padrão).
//
// `cleanup`, quando existe, clica no elemento que dispensa a tela de
// carregamento (o `waitFor` só espera ficar pronto, não clica sozinho) e
// esconde a UI do próprio site (nav, controles, tooltips), deixando só o
// elemento gráfico reativo na captura: mesmos seletores de
// src/lib/artist-preview-cleanup.ts, que faz a mesma limpeza na prévia ao
// vivo do card (lá dentro de um iframe em produção; aqui, a página
// carregada direto, sem essa complicação). Duplicado de propósito: um é
// Node/Playwright, o outro é DOM de navegador dentro de um iframe
// mesma-origem, os dois runtimes não compartilham módulo. Mudou um lado,
// mude o outro.
const SITES = [
  {
    slug: "ganwalk",
    url: "https://ganwalk.github.io/2026/",
    waitFor: (page) =>
      page.waitForSelector("#click-to-start-text.ready", { timeout: 20_000 }),
    cleanup: (page) =>
      page.evaluate(() => {
        document.querySelector("#click-to-start-text")?.click();
        const style = document.createElement("style");
        style.textContent = `
          #top-nav, #top-marquee, #mobile-exp-bar, #mobile-menu-overlay,
          #p1-interaction-tooltip, #p1-controls-bar, #p1-toggle-button
          { display: none !important; }
        `;
        document.head.appendChild(style);
      }),
  },
  {
    slug: "dezert-horse",
    url: "https://ganwalk.github.io/cavalo/",
    waitFor: (page) =>
      page.waitForFunction(
        () => document.getElementById("loading-text")?.innerText === "SISTEMA PRONTO",
        { timeout: 20_000 },
      ),
    cleanup: (page) =>
      page.evaluate(() => {
        document.querySelector("#start-btn")?.click();
        const style = document.createElement("style");
        style.textContent = `
          #main-nav, #hud, #hud-toggle-btn, #cam-tooltip, #presave-popup
          { display: none !important; }
        `;
        document.head.appendChild(style);
      }),
  },
  { slug: "pink-opala", url: "https://ganwalk.github.io/pinkopala/" },
];

async function logSize(path) {
  const { size } = await stat(path);
  console.log(`${path.split("/").pop()}: ${(size / 1024).toFixed(0)} KB`);
}

async function captureRawVideo(url, outDir, waitFor, cleanup) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    recordVideo: { dir: outDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  if (waitFor) {
    await waitFor(page).catch((error) =>
      console.warn(`  aviso: waitFor não resolveu (${error.message.split("\n")[0]}), seguindo com o warmup padrão`),
    );
  }
  if (cleanup) {
    await cleanup(page).catch((error) =>
      console.warn(`  aviso: cleanup falhou (${error.message.split("\n")[0]})`),
    );
  }
  // O warmup, aqui, também cobre a transição de saída da tela de
  // carregamento (fade de ~1 a 1,5s em ambos os sites): sem essa folga a
  // gravação começaria no meio do fade em vez do repouso já assentado.
  await page.waitForTimeout(WARMUP_MS);
  await page.waitForTimeout(RECORD_MS);
  await context.close();
  await browser.close();

  const [file] = await readdir(outDir);
  return `${outDir}/${file}`;
}

async function toLoopMp4(rawVideo, outFile) {
  // Mesmo tratamento de build-cagumela-media.mjs: sem áudio, largura
  // reduzida (a vitrine mostra em aspect-square, object-cover, nunca a
  // resolução original), faststart pro navegador começar a tocar antes do
  // download terminar.
  await run(ffmpegPath.path, [
    "-y",
    "-i",
    rawVideo,
    "-t",
    `${RECORD_MS / 1000}`,
    "-vf",
    "scale=720:-2",
    "-an",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "30",
    "-movflags",
    "+faststart",
    outFile,
  ]);
}

async function toPosterWebp(rawVideo, outFile) {
  const rawPng = `${outFile}.raw.png`;
  await run(ffmpegPath.path, ["-y", "-ss", "1", "-i", rawVideo, "-frames:v", "1", rawPng]);
  await sharp(rawPng).resize({ width: 720 }).webp({ quality: 82 }).toFile(outFile);
  await rm(rawPng);
}

async function main() {
  await mkdir(PHOTOS_OUT, { recursive: true });
  await mkdir(VIDEOS_OUT, { recursive: true });
  await mkdir(TMP_DIR, { recursive: true });

  for (const { slug, url, waitFor, cleanup } of SITES) {
    console.log(`\n== ${slug} (${url}) ==`);
    const siteTmp = `${TMP_DIR}/${slug}`;
    await mkdir(siteTmp, { recursive: true });

    const rawVideo = await captureRawVideo(url, siteTmp, waitFor, cleanup);

    const videoOut = `${VIDEOS_OUT}/${slug}-live.mp4`;
    const posterOut = `${PHOTOS_OUT}/${slug}-live-poster.webp`;
    await toLoopMp4(rawVideo, videoOut);
    await toPosterWebp(rawVideo, posterOut);
    await logSize(videoOut);
    await logSize(posterOut);
  }

  await rm(TMP_DIR, { recursive: true, force: true });
  console.log("\nPronto. Revise os arquivos em public/videos/ e public/photos/ antes de" +
    " apontar o campo `cover` de cada case (src/data/cases.ts) pra eles.");
}

main();
