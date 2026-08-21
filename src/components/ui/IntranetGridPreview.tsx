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

// Sem aspect-video nem object-cover: as pranchetas do Design System têm
// proporções bem diferentes entre si (de 1.54:1 a 2.46:1, ver
// scripts/build-intranet-grid.mjs, que preserva a proporção original de
// cada uma ao recortar a margem preta), forçar todas num quadro 16:9
// cortava pedaço de conteúdo em quase todas. Cada bloco só fixa a LARGURA
// (w-[X%]); a altura nasce da proporção natural da própria imagem
// (`h-auto`), sem corte nenhum. Bordas retas (sem rounded), a mesma
// linguagem "prancheta" das capturas em si, que já chegam com cantos retos.
//
// No mobile (ver MobileCaseCard em CasesGrid.tsx), este componente vive
// dentro de um cartão mais alto que a tela (`scale-125` sobre uma caixa
// `118svh`, sticky, só o topo `100svh` realmente visível) E por baixo do
// título do case, ancorado embaixo com gradiente escurecendo o rodapé (ver
// `pb-10 pt-24 justify-end` em CasesGrid.tsx). As pontas de baixo (`bottom:
// 44%`, bem mais que os 16% do topo) não são escolha estética: é a margem
// medida na prática (Playwright, getBoundingClientRect), já considerando a
// prancheta mais alta entre as duas de baixo (Badges & Tags, 1.62:1), pra
// ficarem acima do título "INTRANET COMPLETA" e não coladas nele, além de
// não colidirem com o Dashboard em destaque no centro quando ele encolhe.
// Mexeu no tamanho do herói, das pontas ou trocou qual prancheta vai em
// qual canto? Meça de novo no mobile antes de mexer só nos percentuais
// aqui: a prancheta mais "quadrada" (proporção mais baixa) do canto de
// baixo é quem dita a margem mínima segura.
const CORNER_STYLE: Record<(typeof SATELLITES)[number]["corner"], CSSProperties> = {
  "top-left": { top: "14%", left: "10%", transformOrigin: "top left" },
  "top-right": { top: "14%", right: "10%", transformOrigin: "top right" },
  "bottom-left": { bottom: "44%", left: "10%", transformOrigin: "bottom left" },
  "bottom-right": { bottom: "44%", right: "10%", transformOrigin: "bottom right" },
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
          className="intranet-satellite absolute w-[22%] overflow-hidden border border-white/10 shadow-xl shadow-black/60"
          style={{ ...CORNER_STYLE[corner], "--intranet-satellite-delay": `${delayS}s` } as CSSProperties}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" aria-hidden="true" className="block h-auto w-full" />
        </div>
      ))}

      <div className="intranet-hero-scale absolute top-1/2 left-1/2 w-[38%] overflow-hidden border border-white/10 shadow-2xl shadow-black/70">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={HERO} alt="" aria-hidden="true" className="block h-auto w-full" />
      </div>
    </div>
  );
}
