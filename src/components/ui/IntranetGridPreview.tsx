"use client";

import type { CSSProperties } from "react";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): grade 3×3 das
// nove pranchetas do Design System, o Dashboard do Aluno sempre na célula
// central. Quarta versão desta animação (fileiras deslizantes, zoom de
// câmera sobre o grupo inteiro replicando um vídeo antigo, e esta): o
// Dashboard tem um zoom SUTIL (scale 1 a 1.28, bem menos que as versões
// anteriores), e as outras oito pranchetas ENTRAM deslizando em direção a
// ele, parando exatamente onde encostam nas próprias bordas do Dashboard
// (a posição natural delas na grade), em vez de tudo escalar junto como um
// bloco de câmera só.
//
// Cada uma das oito tem sua PRÓPRIA direção de entrada: o canto/lado que
// encosta na célula central (--slide-x/--slide-y, ver
// SLIDE_OFFSET_BY_POSITION abaixo, setadas como custom properties inline),
// então crescer/deslizar a partir dali lê como "se aproximando" ao longo da
// própria grade, não aparecendo de um lugar aleatório. Dashboard e as oito
// pranchetas vivem no MESMO relógio de 9s (.intranet-tile-center-pulse e
// .intranet-tile-slide, ver globals.css), com os mesmos quatro pontos de
// fase: dois relógios fora de sincronia foi exatamente o que fez uma
// versão bem mais antiga deste componente ler como aleatória.
//
// Ordem das nove pranchetas: a mesma de um quadro real do vídeo antigo que
// ocupava esse lugar (Tipografia/Timeline/Badges&Tags em cima, Progress
// Bar/Dashboard/Jornada do Herói no meio, Botões/Contagem Regressiva/
// Paleta Sequencial embaixo), mantida aqui mesmo sem mais replicar a
// câmera dele.
//
// Pranchetas usadas EXATAMENTE como foram enviadas, moldura preta original
// incluída, sem cortar nada (scripts/build-intranet-grid.mjs não usa mais
// .trim(), pedido explícito): as nove já nascem na mesma proporção
// (1166×724, a prancheta original), então uma célula só (TILE_ASPECT
// abaixo) serve pra todas, sem letterbox nenhum. object-contain continua
// como rede de segurança (não object-cover): mesmo com a proporção
// batendo, contain garante que nenhum arredondamento de pixel corte um
// fio sequer da imagem. Sem arredondamento nas bordas da célula, a mesma
// linguagem "prancheta" das capturas em si.
//
// Imagens processadas por scripts/build-intranet-grid.mjs a partir das
// pranchetas brutas em intranet-componentes/ (enviadas direto pra main em
// 20/08/2026).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

// Proporção nativa da prancheta original (1166×724), a mesma pras nove:
// sem essa aspect-ratio exata, o navegador teria que esperar a imagem
// carregar pra saber a altura da célula, deslocando o resto da grade.
const TILE_ASPECT = "1166/724";

const CENTER_INDEX = 4;

const GRID_TILES = [
  gridPath("ig-05.webp"), // Tipografia
  gridPath("ig-06.webp"), // Timeline
  gridPath("ig-07.webp"), // Badges & Tags
  gridPath("ig-09.webp"), // Progress Bar
  gridPath("ig-08.webp"), // Dashboard do Aluno — célula central, em destaque
  gridPath("ig-01.webp"), // Jornada do Herói
  gridPath("ig-02.webp"), // Botões
  gridPath("ig-03.webp"), // Contagem Regressiva
  gridPath("ig-04.webp"), // Paleta Sequencial
];

// Direção de entrada de cada satélite, em porcentagem da PRÓPRIA célula
// (translate()): o sinal aponta pra fora, na mesma direção da posição da
// célula em relação ao centro (linha 0 = cima, então -y; coluna 2 =
// direita, então +x). 200% desloca a célula bem além da borda visível do
// cartão (a grade não escala mais, então "sumir de quadro" depende só
// desse deslocamento), e ela desliza de volta pra translate(0,0), a
// própria posição na grade, "parando em suas extremidades" contra o
// Dashboard.
const SLIDE_OFFSET_BY_POSITION: Record<number, { x: string; y: string }> = {
  0: { x: "-200%", y: "-200%" },
  1: { x: "0%", y: "-200%" },
  2: { x: "200%", y: "-200%" },
  3: { x: "-200%", y: "0%" },
  5: { x: "200%", y: "0%" },
  6: { x: "-200%", y: "200%" },
  7: { x: "0%", y: "200%" },
  8: { x: "200%", y: "200%" },
};

export function IntranetGridPreview({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Fundo: a FOTO de verdade (landing-pages-grid/FUNDO.jpg, processada
          por scripts/build-intranet-fundo.mjs), não mais uma aproximação em
          gradiente radial (a Landing Pages usa isso, ver
          LandingPagesGridPreview.tsx, mas tentar recriar a nuvem de luz
          fora de centro e o grão pesado da própria foto só com CSS nunca
          convencia). .intranet-fundo-photo (ver globals.css) cuida do
          movimento (Ken Burns lento); aqui só o backgroundImage, que
          precisa de style inline porque a URL depende de
          NEXT_PUBLIC_BASE_PATH em tempo de build. Mostra bem mais dela
          agora: sem uma câmera escalando a grade inteira, sobra fundo
          visível em volta das pranchetas o tempo todo, não só nas bordas. */}
      <div
        className="intranet-fundo-photo"
        style={{ position: "absolute", inset: 0, backgroundImage: `url(${gridPath("fundo.webp")})` }}
      />

      {/* No mobile (ver MobileCaseCard em CasesGrid.tsx), este componente
          vive dentro de um cartão bem mais alto que largo. A grade não
          estica pra preencher essa altura (nasce do próprio conteúdo,
          altura automática, só a largura é w-full); este wrapper de fora
          só centraliza esse bloco dentro do cartão. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full">
          <div className="grid w-full grid-cols-3 gap-2 sm:gap-3">
            {GRID_TILES.map((src, i) => {
              const isCenter = i === CENTER_INDEX;
              const slide = SLIDE_OFFSET_BY_POSITION[i];
              return (
                <div
                  key={i}
                  className={`overflow-hidden border border-white/10 bg-black ${
                    isCenter ? "intranet-tile-center-pulse" : "intranet-tile-slide"
                  }`}
                  style={{
                    aspectRatio: TILE_ASPECT,
                    ...(!isCenter ? { "--slide-x": slide.x, "--slide-y": slide.y } : {}),
                  } as CSSProperties}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                </div>
              );
            })}

            {/* Linhas finas da "grade estrutural": acendem durante o platô
                revelado e apagam durante os dois fechamentos (ver
                .intranet-grid-lines-guide em globals.css, mesmo relógio de
                9s), guiando o olho pro instante em que a grade se completa
                em vez de ficar um traço estático o tempo todo. */}
            <div className="intranet-grid-lines-guide pointer-events-none absolute inset-0 z-10">
              <div className="absolute top-0 left-1/3 h-full w-px bg-white/25" />
              <div className="absolute top-0 left-2/3 h-full w-px bg-white/25" />
              <div className="absolute top-1/3 left-0 h-px w-full bg-white/25" />
              <div className="absolute top-2/3 left-0 h-px w-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
