"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): mesma "tecnologia"
// da grade de Landing Pages (LandingPagesGridPreview.tsx, puro CSS via
// keyframes, nenhum JS de animação), mas com coreografia própria, herdada do
// vídeo de motion design que ocupava esse lugar antes: o Dashboard do Aluno
// em destaque, cheio de tela, encolhe pro centro, revela quatro telas do
// Design System nas quatro pontas (separadas por uma cruz de grade), somem,
// e o Dashboard volta a crescer. Loop perpétuo (ver .intranet-hero-scale,
// .intranet-satellite e .intranet-grid-lines em globals.css). Imagens
// processadas por scripts/build-intranet-grid.mjs a partir das pranchetas
// brutas em intranet-componentes/ (enviadas direto pra main em 20/08/2026).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

const HERO = gridPath("ig-08.webp"); // Dashboard do Aluno

const SATELLITES: {
  src: string;
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  delayS: number;
}[] = [
  { src: gridPath("ig-02.webp"), corner: "top-left", delayS: 0 }, // Botões
  { src: gridPath("ig-04.webp"), corner: "top-right", delayS: 0.4 }, // Paleta Sequencial
  { src: gridPath("ig-06.webp"), corner: "bottom-left", delayS: 0.8 }, // Timeline
  { src: gridPath("ig-07.webp"), corner: "bottom-right", delayS: 1.2 }, // Badges & Tags
];

// No mobile (ver MobileCaseCard em CasesGrid.tsx), este componente vive
// dentro de um cartão mais alto que a tela (`scale-125` sobre uma caixa
// `118svh`, sticky, só o topo `100svh` realmente visível) E por baixo do
// título do case, ancorado embaixo com gradiente escurecendo o rodapé (ver
// `pb-10 pt-24 justify-end` em CasesGrid.tsx). As duas pontas de baixo
// (`bottom: 38%`, bem mais que os 16% do topo) não são escolha estética: é a
// margem medida na prática (Playwright, getBoundingClientRect) pra essas
// telas ficarem acima do título "INTRANET COMPLETA" e não coladas nele,
// além de não colidirem com o Dashboard em destaque no centro quando ele
// encolhe. Mexeu no tamanho do herói ou das pontas (w-[38%]/w-[22%] abaixo)?
// meça de novo no mobile antes de mexer só nos percentuais aqui.
const CORNER_STYLE: Record<(typeof SATELLITES)[number]["corner"], CSSProperties> = {
  "top-left": { top: "16%", left: "12%", transformOrigin: "top left" },
  "top-right": { top: "16%", right: "12%", transformOrigin: "top right" },
  "bottom-left": { bottom: "38%", left: "12%", transformOrigin: "bottom left" },
  "bottom-right": { bottom: "38%", right: "12%", transformOrigin: "bottom right" },
};

export function IntranetGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Cruz de grade que separa as quatro pontas, só visível durante a fase
          revelada (mesma janela de opacidade das telas satélite). */}
      <div className="intranet-grid-lines pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-white/10" />
        <div className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-white/10" />
      </div>

      {SATELLITES.map(({ src, corner, delayS }) => (
        <div
          key={corner}
          className="intranet-satellite absolute aspect-video w-[22%] overflow-hidden rounded-lg border border-white/10 shadow-xl shadow-black/60"
          style={{ ...CORNER_STYLE[corner], "--intranet-satellite-delay": `${delayS}s` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" aria-hidden="true" className="h-full w-full object-cover" />
        </div>
      ))}

      <div className="intranet-hero-scale absolute top-1/2 left-1/2 aspect-video w-[38%] overflow-hidden rounded-lg border border-white/10 shadow-2xl shadow-black/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="" aria-hidden="true" className="h-full w-full object-cover" />
      </div>
    </div>
  );
}
