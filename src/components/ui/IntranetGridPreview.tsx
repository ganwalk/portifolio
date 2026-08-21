"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): câmera que
// respira sobre uma grade 3×3 estática das nove pranchetas reais do Design
// System (Progress Bar, Contagem Regressiva, Jornada do Herói, Botões,
// Paleta Sequencial, Tipografia, Timeline, Badges & Tags, Dashboard do
// Aluno), o Dashboard sempre na célula central. O ciclo: nasce com zoom
// aproximado, só o Dashboard preenchendo o quadro; zoom out rápido revela
// a grade inteira por baixo; segura um instante (tempo de sobra pra ler as
// nove pranchetas); zoom in rápido de volta pro Dashboard; segura; repete.
// Puro CSS (@keyframes intranet-camera-zoom em globals.css, `scale` num
// wrapper só, `transform-origin: center` de propósito: a célula central da
// grade coincide com o centro do quadro, então aumentar a escala a partir
// dali "amplia" exatamente a célula do Dashboard, sem precisar de nenhum
// translate extra pra recentralizar).
//
// Terceira versão deste componente. A primeira era uma coreografia própria
// (Dashboard em destaque, encolhe, revela quatro pranchetas nas pontas,
// some, repete): mostrava só uma prancheta grande por vez, as outras quatro
// pequenas e pouco tempo em cena. A segunda trocou pra fileiras deslizantes
// (a mesma técnica da Landing Pages): todas as nove sempre visíveis, mas
// sem nenhum "gesto de câmera", lida como genérica demais pro Design
// System de um produto de verdade. Esta versão persegue especificamente um
// vídeo de referência de motion design (zoom out rápido de um painel único
// revelando uma grade, segura, zoom in de volta), com fundo escuro
// granulado e linhas finas de grade por cima, ambos parte da referência.
//
// Duas camadas que NÃO se movem juntas, de propósito: o zoom (scale numa
// pequena sobra elástica além do alvo, não parando seco nele, ver
// @keyframes intranet-camera-zoom) fica só no wrapper que envolve a grade
// de pranchetas; as linhas de grade vivem FORA desse wrapper, num
// viewfinder de tamanho fixo por cima da cena (a mesma caixa de referência,
// sem o transform), cuja opacidade acende e apaga acompanhando a mesma
// linha do tempo de 12s (ver @keyframes intranet-grid-lines-guide). O
// efeito: a câmera zoom de verdade sobre o conteúdo, enquanto a grade guia
// o olho pro instante certo da revelação, sem virar um traço estático que
// só existe pra decorar.
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

// Posição 4 (linha do meio, coluna do meio) de uma grade 3×3 em ordem de
// leitura é sempre o Dashboard do Aluno: é a célula que o zoom aproxima.
const GRID_TILES = [
  gridPath("ig-01.webp"), // Jornada do Herói
  gridPath("ig-02.webp"), // Botões
  gridPath("ig-03.webp"), // Contagem Regressiva
  gridPath("ig-04.webp"), // Paleta Sequencial
  gridPath("ig-08.webp"), // Dashboard do Aluno — célula central
  gridPath("ig-05.webp"), // Tipografia
  gridPath("ig-06.webp"), // Timeline
  gridPath("ig-07.webp"), // Badges & Tags
  gridPath("ig-09.webp"), // Progress Bar
];

export function IntranetGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Grão de filme evidente, parte do fundo da referência: opacidade
          mais alta que o padrão de 0.05 (ver .texture-noise em
          globals.css), mas sem a variação animada da hero, pra não competir
          com o próprio movimento de câmera. */}
      <div className="texture-noise absolute inset-0" style={{ "--noise-opacity": "0.09" } as CSSProperties} />

      {/* No mobile (ver MobileCaseCard em CasesGrid.tsx), este componente
          vive dentro de um cartão bem mais alto que largo (h-svh + folga
          vertical). Um `h-full` na grade esticaria as 3 fileiras por essa
          altura toda, mas cada célula continua com a proporção fixa
          (aspect-video, derivada da LARGURA): o resultado era fileira presa
          lá em cima, outra lá embaixo, um vão enorme de nada no meio. Por
          isso a grade não estica: nasce do próprio conteúdo (altura
          automática, só a largura é w-full) e este wrapper de fora só
          centraliza esse bloco de altura natural dentro do cartão, sobrando
          fundo granulado acima/abaixo em vez de vão vazio. No desktop, onde
          o cartão já é bem mais próximo da proporção da própria grade
          (~16:9), o efeito prático é quase idêntico a preencher tudo. */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Caixa de referência só: o tamanho de verdade (largura do cartão,
            altura automática vinda da grade) mora aqui, sem transform
            nenhum. As linhas de grade (abaixo) são absolute inset-0 DESTA
            caixa, então herdam essas mesmas medidas sem escalar quando a
            câmera zoom (que só afeta o wrapper irmão .intranet-camera-zoom)
            aumenta ou diminui: um viewfinder de tamanho fixo por cima da
            cena, não um traço que cresce e encolhe junto com o conteúdo. */}
        <div className="relative w-full">
          <div className="intranet-camera-zoom w-full">
            <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
              {GRID_TILES.map((src, i) => (
                <div key={i} className="aspect-video overflow-hidden border border-white/10 bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          </div>

          {/* Linhas finas da "grade estrutural": acendem durante a
              revelação e apagam durante o soco de volta pro Dashboard
              (.intranet-grid-lines-guide em globals.css, mesma linha do
              tempo dos 12s da câmera), guiando o olho pro instante em que a
              grade aparece em vez de ficar um traço estático o tempo todo. */}
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
