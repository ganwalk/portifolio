"use client";

// Prévia ao vivo do case da Intranet (ver CasesGrid.tsx): réplica em CSS
// puro do vídeo que ocupava esse lugar antes (public/videos/intranet-
// preview.mp4, uma peça de motion design pronta), não uma coreografia
// inventada. As três versões anteriores deste componente (fileiras
// deslizantes, zoom de câmera sobre o grupo inteiro, cada célula animando a
// própria escala) tentaram resolver "algo parecido" sem nunca estudar o
// vídeo de verdade quadro a quadro; o resultado nunca convencia porque
// nenhuma delas era de fato a mesma coisa.
//
// Estudado com ffmpeg (fps=5, contact sheets, quadros isolados em pontos
// específicos): o vídeo é uma câmera só, dando zoom numa grade 3×3 estática
// de pranchetas do Design System, o Dashboard do Aluno sempre na célula
// central. Por isso aqui é um scale() só na GRADE INTEIRA (ver .intranet-
// camera em globals.css para os tempos exatos medidos), com transform-
// origin no centro dela mesma: como o Dashboard mora exatamente ali, "a
// grade encolhe pro centro" e "o Dashboard cresce sozinho preenchendo o
// quadro" são o MESMO movimento, não dois efeitos combinados. Nenhuma
// célula anima a própria escala; a câmera é quem se move.
//
// Ordem das nove pranchetas: a mesma do vídeo (lida direto de um quadro da
// grade revelada em resolução real), não a ordem alfabética nem a ordem em
// que os componentes existem no Design System.
//
// Ladrilho na proporção NATIVA de cada prancheta dentro de uma célula
// aspect-video (a proporção nativa da maioria delas): as pranchetas têm
// proporções bem diferentes entre si (de 1.54:1 a 2.46:1, ver
// scripts/build-intranet-grid.mjs, que preserva a proporção original ao
// recortar a margem preta), então object-contain (não object-cover) evita
// cortar qualquer uma. Sem arredondamento nas bordas, a mesma linguagem
// "prancheta" das capturas em si.
//
// Imagens processadas por scripts/build-intranet-grid.mjs a partir das
// pranchetas brutas em intranet-componentes/ (enviadas direto pra main em
// 20/08/2026).

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

// Ordem de leitura (0 a 8, esquerda pra direita, cima pra baixo) igual à
// grade revelada no vídeo de origem: Tipografia/Timeline/Badges&Tags na
// fileira de cima, Progress Bar/Dashboard/Jornada do Herói no meio,
// Botões/Contagem Regressiva/Paleta Sequencial embaixo.
const GRID_TILES = [
  gridPath("ig-05.webp"), // Tipografia
  gridPath("ig-06.webp"), // Timeline
  gridPath("ig-07.webp"), // Badges & Tags
  gridPath("ig-09.webp"), // Progress Bar
  gridPath("ig-08.webp"), // Dashboard do Aluno — célula central, onde a câmera fecha
  gridPath("ig-01.webp"), // Jornada do Herói
  gridPath("ig-02.webp"), // Botões
  gridPath("ig-03.webp"), // Contagem Regressiva
  gridPath("ig-04.webp"), // Paleta Sequencial
];

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
          vive dentro de um cartão bem mais alto que largo. A grade não
          estica pra preencher essa altura (nasce do próprio conteúdo,
          altura automática, só a largura é w-full); este wrapper de fora
          só centraliza esse bloco dentro do cartão.

          Sem deslocamento vertical fixo (versões anteriores deste
          componente usavam um -translate-y pra compensar o título/botão
          ancorados embaixo do cartão, ver CaseColumn/MotionLink em
          CasesGrid.tsx): a grade em repouso (aspect-video × 3 fileiras) já
          cabe com folga na altura do cartão, então centralizar contra a
          altura TOTAL não corta nada nem precisa de ajuste extra. */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full">
          {/* .intranet-camera: o scale() único que faz a vez de câmera (ver
              globals.css). transform-origin fica no padrão (center), o
              centro da PRÓPRIA grade, que é exatamente a célula do
              Dashboard: por isso zoom-out da câmera e "as outras oito
              pranchetas se afastando do centro" são o mesmo movimento
              físico, não dois efeitos separados tentando concordar. */}
          <div className="intranet-camera grid w-full grid-cols-3 gap-2 sm:gap-3">
            {GRID_TILES.map((src, i) => (
              <div key={i} className="aspect-video overflow-hidden border border-white/10 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" aria-hidden="true" className="h-full w-full object-contain" />
              </div>
            ))}

            {/* Linhas finas da "grade estrutural", dentro do MESMO elemento
                escalado que as células: crescem e encolhem junto com o
                zoom, então somem de quadro sozinhas quando a câmera fecha
                no Dashboard (exatamente como no vídeo: a grade revelada tem
                essas linhas, o quadro fechado não tem nenhuma), sem
                precisar de uma animação de opacidade à parte tentando
                sincronizar com o zoom. */}
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute top-0 left-1/3 h-full w-px bg-white/25" />
              <div className="absolute top-0 left-2/3 h-full w-px bg-white/25" />
              <div className="absolute top-1/3 left-0 h-px w-full bg-white/25" />
              <div className="absolute top-2/3 left-0 h-px w-full bg-white/25" />
            </div>
          </div>
        </div>
      </div>

      {/* Moldura de monitor (ver .intranet-bezel em globals.css): vive FORA
          do bloco escalado de propósito, então nunca cresce/encolhe junto
          com a grade, só aparece (opacidade) quando a câmera está fechada
          num quadro só, igual no vídeo original. */}
      <div className="intranet-bezel pointer-events-none absolute inset-0 z-20" />
    </div>
  );
}
