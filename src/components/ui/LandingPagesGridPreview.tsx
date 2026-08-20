"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case de Landing Pages (ver CasesGrid.tsx): três
// fileiras de capturas reais (claras e escuras, dashboard financeiro,
// página de evento) deslizando em loop infinito sobre o fundo gradiente
// granulado, como uma câmera passando por cima de uma vitrine grande.
// Imagens processadas por scripts/build-landing-pages-grid.mjs a partir
// dos stills brutos em landing-pages-grid/ (enviados direto pra main em
// 20/08/2026).
//
// Puro CSS (ver .lp-row-left/.lp-row-right em globals.css), nenhum JS de
// animação: cada fileira é o MESMO conjunto de sete imagens desenhado duas
// vezes seguidas, e animar de translateX(0) até translateX(-50%) cai
// exatamente sobre a cópia seguinte, sem salto nenhum no loop. O
// compositor da GPU cuida disso sozinho (só `transform`, nunca
// `left`/`width`), sem custo de repintura a cada quadro nem de um laço de
// requestAnimationFrame rodando pra sempre no fio principal.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/landing-pages-grid/${file}`;

const TILE_COUNT = 7;
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => gridPath(`lp-${String(i + 1).padStart(2, "0")}.webp`));
const FUNDO = gridPath("fundo.webp");

// Três embaralhamentos diferentes dos mesmos sete índices, não a mesma
// ordem repetida: evita que as três fileiras fiquem "empilhadas" mostrando
// a mesma imagem na mesma coluna a qualquer instante.
const ROW_ORDERS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6],
  [3, 6, 1, 4, 0, 5, 2],
  [5, 2, 6, 0, 3, 1, 4],
];
const ROW_DIRECTIONS: ("left" | "right")[] = ["left", "right", "left"];
// Durações diferentes por fileira: sincronizadas, as três emendariam no
// mesmo instante e a "câmera" pareceria travar de tempos em tempos; fora
// de sincronia, o movimento lê como orgânico, não como três cópias do
// mesmo relógio.
const ROW_DURATIONS_S = [46, 36, 30];

function Row({ order, direction, durationS }: { order: number[]; direction: "left" | "right"; durationS: number }) {
  const sequence = [...order, ...order];
  return (
    <div
      className={`flex w-max shrink-0 gap-3 will-change-transform sm:gap-4 ${
        direction === "left" ? "lp-row-left" : "lp-row-right"
      }`}
      style={{ "--lp-row-duration": `${durationS}s` } as CSSProperties}
    >
      {sequence.map((idx, i) => (
        <div
          key={i}
          className="h-24 w-40 shrink-0 overflow-hidden rounded-lg shadow-xl shadow-black/40 sm:h-32 sm:w-52 lg:h-40 lg:w-64"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={TILES[idx]} alt="" aria-hidden="true" loading="lazy" className="h-full w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

export function LandingPagesGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={FUNDO} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 sm:gap-4 lg:gap-5">
        {ROW_ORDERS.map((order, i) => (
          <Row key={i} order={order} direction={ROW_DIRECTIONS[i]} durationS={ROW_DURATIONS_S[i]} />
        ))}
      </div>
    </div>
  );
}
