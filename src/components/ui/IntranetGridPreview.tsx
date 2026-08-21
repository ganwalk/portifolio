"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): mesma "tecnologia"
// da grade de Landing Pages (LandingPagesGridPreview.tsx, puro CSS via
// keyframes, nenhum JS de animação) e agora também o mesmo desenho: fileiras
// das nove pranchetas reais do Design System (Progress Bar, Contagem
// Regressiva, Jornada do Herói, Botões, Paleta Sequencial, Tipografia,
// Timeline, Badges & Tags, Dashboard do Aluno) deslizando em loop infinito.
//
// A primeira versão deste componente era uma coreografia própria (Dashboard
// em destaque, encolhe, revela quatro pranchetas nas pontas, some, repete):
// na prática, mostrava só uma prancheta de cada vez em destaque e as outras
// quatro pequenas demais/pouco tempo em cena pra realmente dar pra ler o
// Design System. A pessoa que tirou essas nove capturas e forneceu queria
// uma vitrine que mostrasse os componentes de verdade, não um efeito por
// cima deles: a grade resolve isso, todas as nove sempre passando, do
// mesmo jeito que a Landing Pages já mostra as sete capturas dela.
//
// Ladrilho na proporção NATIVA de cada prancheta, não aspect-video: as
// pranchetas têm proporções bem diferentes entre si (de 1.54:1 a 2.46:1,
// ver scripts/build-intranet-grid.mjs, que preserva a proporção original ao
// recortar a margem preta), forçar todas num quadro 16:9 cortava pedaço de
// conteúdo em quase todas. Cada bloco só fixa a altura (a mesma da
// fileira); a largura nasce da proporção natural da própria imagem. Sem
// arredondamento nas bordas, a mesma linguagem "prancheta" das capturas em
// si. Fundo preto sólido, não um gradiente granulado: as pranchetas já
// chegam em fundo preto na origem, então o preto do quadro e o preto de
// cada prancheta se emendam sem costura, sem precisar de textura atrás.
//
// items-start, não items-center, no empilhamento das fileiras: ver o
// comentário equivalente em LandingPagesGridPreview.tsx sobre por que
// centralizar uma fileira bem mais larga que o cartão abre um buraco (do
// tamanho de metade do cartão) na borda direita quando a animação chega
// perto do fim do ciclo.
//
// Imagens processadas por scripts/build-intranet-grid.mjs a partir das
// pranchetas brutas em intranet-componentes/ (enviadas direto pra main em
// 20/08/2026).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

const TILE_COUNT = 9;
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => gridPath(`ig-${String(i + 1).padStart(2, "0")}.webp`));

// Embaralhamentos diferentes dos mesmos nove índices em cada fileira, não a
// mesma ordem repetida: evita que as fileiras fiquem "empilhadas" mostrando
// a mesma prancheta na mesma coluna a qualquer instante.
const ROW_ORDERS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8],
  [4, 8, 1, 6, 0, 3, 7, 2, 5],
  [6, 2, 8, 0, 5, 1, 3, 7, 4],
  [2, 5, 0, 7, 3, 8, 1, 4, 6],
  [8, 3, 6, 1, 7, 0, 4, 2, 5],
];
const ROW_DIRECTIONS: ("left" | "right")[] = ["left", "right", "left", "right", "left"];
// Durações diferentes por fileira: sincronizadas, elas emendariam no mesmo
// instante e a "câmera" pareceria travar de tempos em tempos; fora de
// sincronia, o movimento lê como orgânico, não como cópias do mesmo
// relógio.
const ROW_DURATIONS_S = [52, 40, 34, 48, 37];
// Só as três primeiras fileiras existem a partir do sm: (o cartão mobile é
// bem mais alto que o desktop, ver MobileCaseCard em CasesGrid.tsx); as
// duas extras só aparecem no mobile.
const ROW_MOBILE_ONLY = [false, false, false, true, true];
// Índices (dentro de cada fileira, já com a sequência dobrada) que ganham o
// respiro de zoom: um a cada três, começando num deslocamento diferente
// por fileira pra não pulsarem todos juntos.
const ZOOM_OFFSETS = [1, 0, 2, 1, 0];
const ZOOM_STEP = 3;

function Row({
  order,
  direction,
  durationS,
  zoomOffset,
  mobileOnly,
}: {
  order: number[];
  direction: "left" | "right";
  durationS: number;
  zoomOffset: number;
  mobileOnly: boolean;
}) {
  const sequence = [...order, ...order];
  return (
    <div
      className={`${mobileOnly ? "flex sm:hidden" : "flex"} w-max shrink-0 gap-3 will-change-transform sm:gap-4 ${
        direction === "left" ? "marquee-row-left" : "marquee-row-right"
      }`}
      style={{ "--marquee-row-duration": `${durationS}s` } as CSSProperties}
    >
      {sequence.map((idx, i) => {
        const zooms = i % ZOOM_STEP === zoomOffset;
        return (
          <div key={i} className="h-24 shrink-0 overflow-hidden border border-white/10 shadow-xl shadow-black/60 sm:h-32 lg:h-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TILES[idx]}
              alt=""
              aria-hidden="true"
              className={`block h-full w-auto ${zooms ? "marquee-tile-zoom" : ""}`}
              style={zooms ? ({ "--marquee-zoom-delay": `${(i * 0.7) % 5}s` } as CSSProperties) : undefined}
            />
          </div>
        );
      })}
    </div>
  );
}

export function IntranetGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-3 sm:gap-4 lg:gap-5">
        {ROW_ORDERS.map((order, i) => (
          <Row
            key={i}
            order={order}
            direction={ROW_DIRECTIONS[i]}
            durationS={ROW_DURATIONS_S[i]}
            zoomOffset={ZOOM_OFFSETS[i]}
            mobileOnly={ROW_MOBILE_ONLY[i]}
          />
        ))}
      </div>
    </div>
  );
}
