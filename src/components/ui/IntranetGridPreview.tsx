"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): grade 3×3 estática
// das nove pranchetas reais do Design System (Progress Bar, Contagem
// Regressiva, Jornada do Herói, Botões, Paleta Sequencial, Tipografia,
// Timeline, Badges & Tags, Dashboard do Aluno), o Dashboard sempre na
// célula central. Cada célula anima a PRÓPRIA escala (ver
// @keyframes intranet-tile-center/intranet-tile-satellite em globals.css),
// não um zoom de câmera sobre o grupo inteiro: o Dashboard cresce um pouco
// sozinho pra ficar em destaque; as outras oito nascem em scale(0) e
// crescem até preencher a própria célula, cada uma com o transform-origin
// no canto/lado que encosta na célula central, então crescer a partir dali
// lê como "se aproximando", guiadas pela própria grade, não aparecendo do
// nada. O Dashboard encolhe de volta no mesmo instante em que as outras
// oito terminam de crescer. Depois de um respiro com a grade inteira
// revelada (onde a mesma pulsação de zoom dos ladrilhos da Landing Pages,
// .marquee-tile-zoom, dá um revezamento sutil de destaque entre as
// pranchetas), as oito encolhem de volta e o Dashboard cresce de novo,
// fechando o loop no mesmo estado do início.
//
// Quarta versão deste componente. A primeira era uma coreografia com quatro
// pranchetas nas pontas; a segunda, fileiras deslizantes sem nenhum "gesto
// de câmera"; a terceira, um zoom de câmera sobre a grade inteira (chegava
// a scale(3.2) no grupo todo) que ficou dramático demais, o Dashboard
// "explodindo" pra fora do quadro em vez de só ficar em destaque. Esta
// versão persegue especificamente o pedido de manter o destaque discreto
// (scale 1.5, não 3.2) e fazer as OUTRAS telas se aproximarem guiadas pela
// grade, não a câmera inteira dar um zoom dramático.
//
// Viewfinder fixo (as linhas da grade) por fora de toda essa animação, com
// a própria opacidade acompanhando a mesma linha do tempo de 14s (ver
// .intranet-grid-lines-guide): acende durante a revelação, apaga durante o
// recolhimento, guiando o olho pro instante certo em vez de ficar um traço
// estático o tempo todo.
//
// Ladrilho na proporção NATIVA de cada prancheta dentro de uma célula de
// proporção fixa (aspect-video): as pranchetas têm proporções bem
// diferentes entre si (de 1.54:1 a 2.46:1, ver
// scripts/build-intranet-grid.mjs, que preserva a proporção original ao
// recortar a margem preta), então object-contain (não object-cover) evita
// cortar qualquer uma, sobrando uma faixa de fundo preto nas que não batem
// exatamente com 16:9 (imperceptível, já é a cor do resto do quadro). Sem
// arredondamento nas bordas, a mesma linguagem "prancheta" das capturas em
// si.
//
// Imagens processadas por scripts/build-intranet-grid.mjs a partir das
// pranchetas brutas em intranet-componentes/ (enviadas direto pra main em
// 20/08/2026).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

const CENTER_INDEX = 4;

// Posição 4 (linha do meio, coluna do meio) de uma grade 3×3 em ordem de
// leitura é sempre o Dashboard do Aluno: é a célula em destaque.
const GRID_TILES = [
  gridPath("ig-01.webp"), // Jornada do Herói
  gridPath("ig-02.webp"), // Botões
  gridPath("ig-03.webp"), // Contagem Regressiva
  gridPath("ig-04.webp"), // Paleta Sequencial
  gridPath("ig-08.webp"), // Dashboard do Aluno — célula central, em destaque
  gridPath("ig-05.webp"), // Tipografia
  gridPath("ig-06.webp"), // Timeline
  gridPath("ig-07.webp"), // Badges & Tags
  gridPath("ig-09.webp"), // Progress Bar
];

// Canto/lado de cada célula satélite que encosta na célula central: é dali
// que ela "cresce" (transform-origin), pra ler como se aproximando ao
// longo da própria grade em vez de inflando a partir do próprio centro.
const TRANSFORM_ORIGIN_BY_POSITION: Record<number, string> = {
  0: "bottom right",
  1: "bottom center",
  2: "bottom left",
  3: "center right",
  5: "center left",
  6: "top right",
  7: "top center",
  8: "top left",
};

// Atraso do revezamento de destaque (.marquee-tile-zoom, a mesma pulsação
// dos ladrilhos da Landing Pages) entre as oito pranchetas satélite:
// espalhado pra não pulsarem todas juntas, cada uma "chama a atenção" na
// sua vez enquanto a grade está revelada.
const ZOOM_DELAY_BY_POSITION: Record<number, number> = {
  0: 0,
  1: 0.8,
  2: 1.6,
  3: 2.4,
  5: 3.2,
  6: 4,
  7: 4.8,
  8: 5.6,
};

export function IntranetGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Mesmo fundo animado da Landing Pages (.grid-fundo-gradient, ver
          globals.css), na variante --intranet: bem mais escura e mais
          lenta, quase preto com só um brilho sutil se movendo, porque as
          pranchetas do Design System já vivem sobre preto sólido (ver os
          próprios cantos `bg-black` abaixo) e aqui o fundo é atmosfera, não
          protagonista. position/inset via style inline, não a utility
          `absolute inset-0`: .texture-noise define position: relative como
          CSS sem layer, que sempre vence a utility (layered) na mesma tag
          (ver o mesmo ajuste em SiteLoader.tsx e LandingPagesGridPreview.tsx). */}
      <div
        className="grid-fundo-gradient grid-fundo-gradient--intranet texture-noise texture-noise-animate"
        style={{ position: "absolute", inset: 0 }}
      />

      {/* No mobile (ver MobileCaseCard em CasesGrid.tsx), este componente
          vive dentro de um cartão bem mais alto que largo (h-svh + folga
          vertical). Um `h-full` na grade esticaria as 3 fileiras por essa
          altura toda, mas cada célula continua com a proporção fixa
          (derivada da LARGURA): o resultado era fileira presa lá em cima,
          outra lá embaixo, um vão enorme de nada no meio. Por isso a grade
          não estica: nasce do próprio conteúdo (altura automática, só a
          largura é w-full) e este wrapper de fora só centraliza esse bloco
          de altura natural dentro do cartão, sobrando fundo granulado
          acima/abaixo em vez de vão vazio.

          aspect-[4/3] até o sm:, aspect-video dali pra cima: mesmo com o
          fundo animado preenchendo a sobra, a grade sozinha ainda ficava
          baixa demais (a maioria do cartão sobrando vazio) numa tela alta e
          estreita. Células mais altas no mobile fazem a grade inteira
          crescer verticalmente (~33% mais alta, ver as contas no commit),
          ocupando bem mais do cartão; um pouco mais de faixa preta dentro
          de cada célula pras pranchetas mais largas (object-contain, sem
          cortar nada) é o preço, aceitável. No desktop, onde o cartão já
          não é tão desproporcional, aspect-video (a proporção nativa da
          maioria das pranchetas) volta a ser a melhor forma. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full">
          <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
            {GRID_TILES.map((src, i) => {
              const isCenter = i === CENTER_INDEX;
              return (
                <div
                  key={i}
                  className={`aspect-[4/3] overflow-hidden border border-white/10 bg-black sm:aspect-video ${
                    isCenter ? "intranet-tile-center" : "intranet-tile-satellite"
                  }`}
                  style={!isCenter ? { transformOrigin: TRANSFORM_ORIGIN_BY_POSITION[i] } : undefined}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    aria-hidden="true"
                    className={`h-full w-full object-contain ${isCenter ? "" : "marquee-tile-zoom"}`}
                    style={
                      !isCenter
                        ? ({
                            "--marquee-zoom-duration": "6s",
                            "--marquee-zoom-delay": `${ZOOM_DELAY_BY_POSITION[i]}s`,
                          } as CSSProperties)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </div>

          {/* Linhas finas da "grade estrutural": acendem durante a
              revelação e apagam durante o recolhimento de volta pro
              destaque (.intranet-grid-lines-guide em globals.css, mesma
              linha do tempo de 14s das células), guiando o olho pro
              instante em que a grade aparece em vez de ficar um traço
              estático o tempo todo. */}
          <div className="intranet-grid-lines-guide pointer-events-none absolute inset-0 z-10">
            <div className="absolute top-0 left-1/3 h-full w-px bg-white/25" />
            <div className="absolute top-0 left-2/3 h-full w-px bg-white/25" />
            <div className="absolute top-1/3 left-0 h-px w-full bg-white/25" />
            <div className="absolute top-2/3 left-0 h-px w-full bg-white/25" />
          </div>
        </div>
      </div>
    </div>
  );
}
