"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case de Landing Pages (ver CasesGrid.tsx): fileiras de
// capturas reais (claras e escuras, dashboard financeiro, página de evento)
// deslizando em loop infinito sobre um fundo gradiente cinza granulado,
// como uma câmera passando por cima de uma vitrine grande. Imagens
// processadas por scripts/build-landing-pages-grid.mjs a partir dos stills
// brutos em landing-pages-grid/ (enviados direto pra main em 20/08/2026).
//
// O fundo é puro CSS (.grid-fundo-gradient--landing + .texture-noise-
// animate, ver globals.css), não mais uma foto do repositório (fundo.webp,
// removida): gradiente radial cinza que deriva devagar de posição, com o
// mesmo grão de filme animado da hero por cima. Zero peso de imagem e nunca
// repete o mesmo enquadramento exato de um carregamento pro outro, ao
// contrário de uma foto fixa recortada num tamanho.
//
// Puro CSS (ver .marquee-row-left/.marquee-row-right em globals.css,
// reaproveitadas por IntranetGridPreview.tsx com a mesma técnica), nenhum
// JS de animação: cada fileira é o MESMO conjunto de sete imagens desenhado
// duas vezes seguidas, e animar de translateX(0) até translateX(-50%) cai
// exatamente sobre a cópia seguinte, sem salto nenhum no loop. O
// compositor da GPU cuida disso sozinho (só `transform`, nunca
// `left`/`width`), sem custo de repintura a cada quadro nem de um laço de
// requestAnimationFrame rodando pra sempre no fio principal.
//
// Ladrilho na proporção NATIVA de cada captura, não quadrado: altura fixa
// (a mesma da fileira) e largura livre, cada `<img>` com `w-auto`, sem
// object-cover cortando nada. As capturas de landing page são bem mais
// largas que altas (1.58 a 2.02:1, ver build-landing-pages-grid.mjs, que já
// preserva a proporção original ao redimensionar), então forçar todo mundo
// num quadrado cortava um baita pedaço de cada tela; sem arredondamento nas
// bordas mesmo assim, essa parte continua igual.
//
// Sem `loading="lazy"` nos ladrilhos: a primeira leva usava lazy, e depois
// de alguns ciclos uma fileira inteira sumia. O motivo é a própria natureza
// do loop, não um bug de rede: um ladrilho nasce fora da faixa visível
// inicial (a fileira é bem mais larga que o card), o navegador nunca
// disparava o carregamento porque a posição dele só muda por `transform`
// (thread do compositor), sem gerar o reflow/scroll que o
// IntersectionObserver do lazy loading escuta pra reavaliar. Sete imagens
// de poucos KB cada não pesam o bastante pra justificar lazy aqui mesmo.
//
// Sete fileiras no total. As cinco primeiras aparecem em qualquer tela: no
// mobile (ver MobileCaseCard em CasesGrid.tsx) este componente vive dentro
// de um cartão bem mais alto que a tela (h-svh + folga, ver
// MOBILE_CARD_REST_VH), então cinco fileiras preenchem o que três deixavam
// vazio. No desktop este card é a fatia (SlidePanel) inteira, não uma
// coluna de trio (ecossistema-auvp e intranet-auvp nunca entram no grupo de
// três artistas, ver `multi` em CasesGrid.tsx), sobra altura de sobra pra
// mais movimento: as duas últimas fileiras (índice 5 e 6) só existem a
// partir do sm:, `hidden` até lá.
//
// O respiro de zoom (.marquee-tile-zoom) não é mais sorteado por posição na
// fileira: é fixo em três capturas específicas (câmbio, plataforma de
// investimento, guia de lançamentos), as que têm mais detalhe de interface
// pra valer a pausa (ver ZOOM_TILE_INDICES). A mesma imagem pulsa sempre
// que aparece, em qualquer fileira ou embaralhamento, então o olho aprende
// a associar aquele respiro a ela e não a uma posição aleatória na tela.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/landing-pages-grid/${file}`;

const TILE_COUNT = 7;
const TILES = Array.from({ length: TILE_COUNT }, (_, i) => gridPath(`lp-${String(i + 1).padStart(2, "0")}.webp`));

// Embaralhamentos diferentes dos mesmos sete índices em cada fileira, não a
// mesma ordem repetida: evita que as fileiras fiquem "empilhadas" mostrando
// a mesma imagem na mesma coluna a qualquer instante.
const ROW_ORDERS: number[][] = [
  [0, 1, 2, 3, 4, 5, 6],
  [3, 6, 1, 4, 0, 5, 2],
  [5, 2, 6, 0, 3, 1, 4],
  [1, 4, 0, 6, 2, 3, 5],
  [6, 3, 5, 1, 4, 2, 0],
  [2, 5, 3, 6, 1, 0, 4],
  [4, 0, 6, 2, 5, 3, 1],
];
const ROW_DIRECTIONS: ("left" | "right")[] = ["left", "right", "left", "right", "left", "right", "left"];
// Durações diferentes por fileira: sincronizadas, elas emendariam no mesmo
// instante e a "câmera" pareceria travar de tempos em tempos; fora de
// sincronia, o movimento lê como orgânico, não como cópias do mesmo
// relógio.
const ROW_DURATIONS_S = [46, 36, 30, 42, 33, 39, 28];
// As duas últimas fileiras só existem a partir do sm: (ver comentário no
// topo do arquivo); as cinco primeiras aparecem em qualquer tamanho de tela.
const ROW_DESKTOP_ONLY = [false, false, false, false, false, true, true];
// Capturas específicas (não posições sorteadas na fileira) que ganham o
// respiro de zoom sempre que aparecem: câmbio (lp-03), plataforma de
// investimento (lp-04) e o dashboard do guia de lançamentos (lp-06), as
// telas com mais interface pra render valer o destaque.
const ZOOM_TILE_INDICES = new Set([2, 3, 5]);

function Row({
  order,
  direction,
  durationS,
  desktopOnly,
}: {
  order: number[];
  direction: "left" | "right";
  durationS: number;
  desktopOnly: boolean;
}) {
  const sequence = [...order, ...order];
  return (
    <div
      className={`${desktopOnly ? "hidden sm:flex" : "flex"} w-max shrink-0 gap-3 will-change-transform sm:gap-4 ${
        direction === "left" ? "marquee-row-left" : "marquee-row-right"
      }`}
      style={{ "--marquee-row-duration": `${durationS}s` } as CSSProperties}
    >
      {sequence.map((idx, i) => {
        const zooms = ZOOM_TILE_INDICES.has(idx);
        return (
          <div key={i} className="h-24 shrink-0 overflow-hidden shadow-xl shadow-black/40 sm:h-32 lg:h-40">
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

export function LandingPagesGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* position/inset via style inline, não a utility `absolute inset-0`:
          .texture-noise define position: relative como CSS sem layer, que
          sempre vence a utility (layered) na mesma tag (ver o mesmo ajuste
          em SiteLoader.tsx). Sem o inline style, este div colapsaria pra
          0×0 (relative não estica sozinho) e o grão nunca apareceria. */}
      <div
        className="grid-fundo-gradient grid-fundo-gradient--landing texture-noise texture-noise-animate"
        style={{ position: "absolute", inset: 0 }}
      />
      {/* items-start, não items-center: cada fileira é bem mais larga que o
          cartão (w-max, o dobro da sequência de sete ladrilhos), e o loop
          "desenha duas vezes, anima 0 até -50%" só fecha sem buraco se a
          fileira nascer encostada na borda esquerda. Centralizada, a
          fileira já nasce deslocada pra dentro (metade da sobra de cada
          lado); somado ao -50% da animação (metade da LARGURA DA PRÓPRIA
          fileira, bem maior que a sobra), o deslocamento total passa da
          conta e descola a borda direita da fileira da borda direita do
          cartão por exatamente metade da largura do cartão, expondo o fundo
          por baixo ali (o "buraco" onde devia aparecer outro ladrilho). Com
          items-start a fileira nasce com a borda esquerda já encostada em
          0, e o mesmo -50% fecha o ciclo perfeito: a segunda cópia da
          sequência cai exatamente onde a primeira começou. */}
      <div className="absolute inset-0 flex flex-col items-start justify-center gap-3 sm:gap-4 lg:gap-5">
        {ROW_ORDERS.map((order, i) => (
          <Row
            key={i}
            order={order}
            direction={ROW_DIRECTIONS[i]}
            durationS={ROW_DURATIONS_S[i]}
            desktopOnly={ROW_DESKTOP_ONLY[i]}
          />
        ))}
      </div>
    </div>
  );
}
