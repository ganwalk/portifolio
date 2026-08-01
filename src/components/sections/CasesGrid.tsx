"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useMediaQuery } from "@/lib/use-media-query";

// Projetos em destaque como uma sequência amarrada ao scroll da própria
// página, não um carrossel com botões e timer: a seção sai direto da hero
// (sem título nem subtítulo próprios, só um rótulo acessível no <section>
// pra quem usa leitor de tela) e já entra prendendo o scroll. É alta (uma
// tela inteira por projeto) e fica presa (position: sticky) enquanto o
// visitante rola por ela, e cada projeto se desdobra a partir de uma cortina
// fechada no centro (clip-path fechado nas bordas superior e inferior,
// abrindo conforme o scroll avança), com o texto entrando um instante
// depois, e fecha de volta pra dar lugar ao próximo. Rolar É a navegação:
// sem seta, sem play/pause, sem índice próprio brigando com o scroll de
// verdade.
//
// Cada FATIA ocupa uma porção igual de scrollYProgress (1/N da seção), mas
// uma fatia nem sempre é um case só: no desktop (min-width 1024px, ver
// useMediaQuery), cases adjacentes que compartilham `group` (o trio de
// artistas, hoje) viram uma fatia lado a lado, dentro da mesma cortina, em
// vez de três aberturas separadas (buildSlides monta as duas versões,
// flatSlides pro mobile e groupedSlides pro desktop, uma vez só, fora do
// componente porque `cases` é estático). O rótulo de índice de cada coluna
// ("03 / 06") sempre conta cases, não fatias: SlidePanel repassa o índice
// original (`flatIndex`) pra cada CaseColumn, independente de quantas
// fatias existem. Nas pontas (primeira e última fatia) a fatia não tem a
// metade que não existe: a primeira já nasce aberta (nada "antes" dela pra
// desdobrar de), a última fica aberta até o fim da seção (nada "depois").
//
// Quatro camadas de vocabulário de agência por cima da cortina, todas
// escondidas atrás do MotionConfig do Modo Boring:
// 1. Texto em máscara escalonada: cada linha (índice, métrica, título, tags,
//    convite) mora num overflow-hidden próprio e sobe do zero por baixo dele
//    num instante diferente, em vez do bloco inteiro nascer junto num só
//    fade. O atraso entre linhas é maior justamente no título, o elemento
//    mais dramático da composição.
// 2. Cor como recompensa do foco: a mídia nasce em preto e branco
//    (grayscale) e ganha cor só quando o projeto termina de abrir, o mesmo
//    princípio do resto do site (preto e branco, cor só vem da mídia), agora
//    também contando o próprio ato de focar um projeto.
// 3. Paralaxe magnética: a mídia do projeto em cena desliza alguns pontos
//    percentuais na direção do ponteiro, a mesma resposta que a grade bento
//    tinha antes, devolvida aqui em cima do zoom de abertura.
// 4. Rótulo ferrofluido: em vez do cursor do sistema, um rastro de gotas
//    persegue o ponteiro em cadeia (cada gota segue a mola da gota anterior,
//    não o ponteiro direto) e termina no selo "ver caso", deslocado bem à
//    direita da ponta (cursores grandes do sistema cobrem a área logo ao
//    lado dela). O rastro vive atrás de um filtro CSS de blur alto e
//    contraste alto ("goo"): gotas próximas se fundem numa mancha líquida só,
//    o efeito clássico de ferrofluido, puro CSS. Mola em cadeia em vez de
//    reiniciar uma animação por tempo a cada movimento do mouse: mola
//    integra velocidade quadro a quadro, então o rastro nunca "reinicia" (o
//    que soava truncado); tween reiniciado, sim. Complementar ao selo
//    estático dentro do texto (que continua ali por acessibilidade e pra
//    quem usa toque). onMouseMove, não onPointerMove: em toque o evento não
//    dispara, então a mola nunca ativa lá, mesmo princípio que já mantém a
//    lente da hero parada no mobile.
//
// Clicar no projeto em cena ainda expande pra tela cheia com os dados
// completos do case, igual antes; só a navegação ENTRE projetos mudou.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Ranges de entrada/saída de scrollYProgress pra useTransform, com o caso
 *  especial das pontas: o primeiro projeto não tem fase de entrada (já
 *  nasce aberto) e o último não tem fase de saída (fica aberto até o fim). */
function segmentRange(index: number, count: number) {
  const span = 1 / count;
  const start = index * span;
  const end = start + span;
  const enterEnd = start + span * 0.3;
  const exitStart = start + span * 0.7;

  if (index === 0) return { input: [start, exitStart, end], output: [1, 1, 0] };
  if (index === count - 1)
    return { input: [start, enterEnd, end], output: [0, 1, 1] };
  return {
    input: [start, enterEnd, exitStart, end],
    output: [0, 1, 1, 0],
  };
}

interface SlideCase {
  caseStudy: CaseStudy;
  /** Posição do case na lista completa (0-based), independente de slide:
   *  o rótulo de índice de cada coluna ("03 / 06") conta projetos, não
   *  fatias de scroll. */
  flatIndex: number;
}

/** Agrupa cases adjacentes que compartilham `group` numa fatia só de scroll
 *  (lado a lado, ver SlidePanel); `grouped: false` devolve uma fatia por
 *  case, o comportamento empilhado de sempre (usado no mobile). */
function buildSlides(list: CaseStudy[], grouped: boolean): SlideCase[][] {
  if (!grouped) return list.map((caseStudy, flatIndex) => [{ caseStudy, flatIndex }]);

  const slides: SlideCase[][] = [];
  let i = 0;
  while (i < list.length) {
    const group = list[i].group;
    const slide: SlideCase[] = [{ caseStudy: list[i], flatIndex: i }];
    i++;
    while (group && i < list.length && list[i].group === group) {
      slide.push({ caseStudy: list[i], flatIndex: i });
      i++;
    }
    slides.push(slide);
  }
  return slides;
}

// `cases` é estático (import), então as duas versões cabem calcular uma vez
// só, fora do componente: flat é o empilhado de sempre (mobile), grouped
// funde o trio de artistas numa fatia lado a lado (desktop, ver
// CasesGrid).
const flatSlides = buildSlides(cases, false);
const groupedSlides = buildSlides(cases, true);

function SlidePanel({
  slide,
  totalCases,
  locale,
  dict,
  index,
  count,
  scrollYProgress,
  isActive,
  isNearActive,
  onExpand,
}: {
  slide: SlideCase[];
  totalCases: number;
  locale: Locale;
  dict: Dictionary;
  index: number;
  count: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  isActive: boolean;
  isNearActive: boolean;
  onExpand: (caseStudy: CaseStudy, rect: DOMRect) => void;
}) {
  const { input, output } = segmentRange(index, count);
  const openT = useTransform(scrollYProgress, input, output);
  const multi = slide.length > 1;

  // A "cortina": fechada como uma fresta no centro, abrindo pras bordas.
  // clip-path em vez de scaleY porque não distorce o conteúdo por baixo, só
  // revela mais dele, o desdobrar parece uma abertura, não um esticar.
  // Continua existindo em toda fatia, mesmo a do trio: sem ela, a fatia
  // fica sem fechar quando inativa (não é só decoração, é o que garante que
  // uma fatia escondida não vaze por trás da fatia realmente ativa
  // enquanto a cortina dela ainda está abrindo). A diferença é só a curva:
  // na fatia do trio a cortina abre quase instantânea (não há "esticar"
  // visível pra ver), porque a entrada de verdade ali é o zoom distinto de
  // cada coluna (ver CaseColumn), não o desdobrar da cortina.
  const insetPercent = useTransform(
    openT,
    multi ? [0, 0.02, 1] : [0, 1],
    multi ? [46, 0, 0] : [46, 0],
  );
  const clipPath = useMotionTemplate`inset(${insetPercent}% 0% ${insetPercent}% 0%)`;

  return (
    <motion.div
      aria-hidden={!isActive}
      className="absolute inset-0 h-full w-full overflow-hidden bg-black"
      style={{
        clipPath,
        zIndex: isActive ? count + 1 : index,
      }}
    >
      <div className="flex h-full w-full">
        {multi && (
          <div className="flex w-10 shrink-0 items-center justify-center sm:w-14">
            <span
              className="type-mono whitespace-nowrap text-white/50"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {dict.cases.interactiveExperiences}
            </span>
          </div>
        )}
        {slide.map(({ caseStudy, flatIndex }, columnIndex) => (
          <CaseColumn
            key={caseStudy.slug}
            caseStudy={caseStudy}
            flatIndex={flatIndex}
            totalCases={totalCases}
            locale={locale}
            dict={dict}
            openT={openT}
            isActive={isActive}
            isNearActive={isNearActive}
            multi={multi}
            columnIndex={columnIndex}
            dividerLeft={multi}
            onExpand={onExpand}
          />
        ))}
      </div>
    </motion.div>
  );
}

// Um "zoom" distinto por coluna do trio, no lugar da cortina compartilhada
// (que é a fatia inteira abrindo junto, um deslocamento das bordas): cada
// coluna entra sozinha, só dando zoom, cada uma com seu próprio ponto de
// partida e sua própria curva ao longo do mesmo openT, pra não ficarem
// clonadas umas das outras. A primeira nasce de mais longe (zoom out
// grande), a segunda respira num meio de caminho antes de assentar, a
// terceira dispara rápido no começo e desacelera devagar no fim.
const SINGLE_ZOOM = { input: [0, 1], output: [1.18, 1] };
const MULTI_ZOOMS = [
  { input: [0, 1], output: [1.55, 1] },
  { input: [0, 0.55, 1], output: [1.1, 1.32, 1] },
  { input: [0, 0.7, 1], output: [1.65, 1.06, 1] },
];

function CaseColumn({
  caseStudy,
  flatIndex,
  totalCases,
  locale,
  dict,
  openT,
  isActive,
  isNearActive,
  multi,
  columnIndex,
  dividerLeft,
  onExpand,
}: {
  caseStudy: CaseStudy;
  flatIndex: number;
  totalCases: number;
  locale: Locale;
  dict: Dictionary;
  openT: MotionValue<number>;
  isActive: boolean;
  isNearActive: boolean;
  /** Uma de três colunas lado a lado, não o painel cheio: título e métrica
   *  encolhem pra caber num terço da largura em vez de vazar. */
  multi: boolean;
  /** Posição dentro do trio (0, 1 ou 2): escolhe qual das três curvas de
   *  zoom distintas essa coluna usa. Ignorado fora do trio. */
  columnIndex: number;
  /** Fio vertical à esquerda: toda coluna do trio ganha (a régua vertical
   *  já mora imediatamente antes da primeira), nenhuma moldura além dessa
   *  linha fina entre elas. */
  dividerLeft: boolean;
  onExpand: (caseStudy: CaseStudy, rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];
  const zoomRecipe = multi ? MULTI_ZOOMS[columnIndex % MULTI_ZOOMS.length] : SINGLE_ZOOM;
  const mediaZoom = useTransform(openT, zoomRecipe.input, zoomRecipe.output);
  const mediaGrayscale = useTransform(openT, [0, 1], [1, 0]);
  const mediaFilter = useMotionTemplate`grayscale(${mediaGrayscale})`;
  const contentOpacity = useTransform(openT, [0, 0.55, 1], [0, 1, 1]);

  // Máscara escalonada: cada linha sobe do zero num instante diferente
  // dentro da própria abertura da cortina, em vez do bloco de texto inteiro
  // nascer junto. Título por último e com a janela mais longa, é o elemento
  // que merece mais peso na entrada.
  const kickerY = useTransform(openT, [0.05, 0.4], ["100%", "0%"]);
  const metricY = useTransform(openT, [0.1, 0.45], ["100%", "0%"]);
  const titleY = useTransform(openT, [0.18, 0.58], ["100%", "0%"]);
  const tagsY = useTransform(openT, [0.32, 0.62], ["100%", "0%"]);
  const ctaY = useTransform(openT, [0.42, 0.7], ["100%", "0%"]);

  // Paralaxe magnética da mídia: mola contida, desloca pouco.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const tiltSpringX = useSpring(tiltX, { stiffness: 150, damping: 20 });
  const tiltSpringY = useSpring(tiltY, { stiffness: 150, damping: 20 });
  const mediaTiltX = useTransform(tiltSpringX, [-0.5, 0.5], ["-3%", "3%"]);
  const mediaTiltY = useTransform(tiltSpringY, [-0.5, 0.5], ["-3%", "3%"]);

  // Selo que segue o cursor: posição bruta do ponteiro suavizada por uma
  // mola só (sem rastro de partículas), deslocada bem à direita e um pouco
  // abaixo da ponta: cursores grandes do sistema cobrem a área logo ao lado
  // dela.
  const pointerRawX = useMotionValue(0);
  const pointerRawY = useMotionValue(0);
  const leadX = useSpring(pointerRawX, { stiffness: 55, damping: 16, mass: 0.8 });
  const leadY = useSpring(pointerRawY, { stiffness: 55, damping: 16, mass: 0.8 });
  const labelX = useTransform(leadX, (v) => v + 80);
  const labelY = useTransform(leadY, (v) => v + 22);

  const [hovering, setHovering] = useState(false);

  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    tiltX.set(relX / rect.width - 0.5);
    tiltY.set(relY / rect.height - 0.5);
    pointerRawX.set(relX);
    pointerRawY.set(relY);
  }

  function handleMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
    setHovering(false);
  }

  return (
    <motion.button
      type="button"
      onClick={(event) =>
        isActive && onExpand(caseStudy, event.currentTarget.getBoundingClientRect())
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={handleMouseLeave}
      tabIndex={isActive ? 0 : -1}
      aria-hidden={!isActive}
      aria-label={caseStudy.title[locale]}
      className={`relative block h-full flex-1 bg-black text-left ${
        dividerLeft ? "border-l border-white/15" : ""
      } ${isActive ? "" : "pointer-events-none"}`}
    >
      {/* Tudo que precisa de corte (zoom da mídia, máscara do texto) vive
          aqui dentro; o botão em si fica sem overflow-hidden pra não cortar
          o rastro ferrofluido e o selo, que podem passar do próprio limite
          da coluna quando o cursor chega perto da borda. */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={{ scale: mediaZoom, filter: mediaFilter }}
          className="absolute inset-0"
        >
          <motion.div
            style={{ x: mediaTiltX, y: mediaTiltY }}
            className="h-full w-full"
          >
            {isNearActive ? (
              <MediaView
                media={caseStudy.cover}
                locale={locale}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/45" />

        <motion.div
          style={{ opacity: contentOpacity }}
          className="gutter relative flex h-full flex-col justify-between py-24 text-white sm:py-28"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="overflow-hidden">
              <motion.p style={{ y: kickerY }} className="type-mono text-white/70">
                {pad(flatIndex + 1)} / {pad(totalCases)} · {caseStudy.year}
              </motion.p>
            </div>
            <div className="overflow-hidden text-right">
              <motion.p style={{ y: metricY }}>
                <span
                  className={`type-serif-display block ${
                    multi ? "text-3xl sm:text-4xl" : "text-4xl sm:text-6xl"
                  }`}
                >
                  {metric.value}
                </span>
                <span className="type-mono text-white/70">
                  {metric.label[locale]}
                  {metric.illustrative && " *"}
                </span>
              </motion.p>
            </div>
          </div>

          <div>
            {/* pt-[0.16em] no wrapper: leading-[0.9] é mais apertado que a
                altura real da Whyte Inktrap, sem esse respiro o
                overflow-hidden usado pra máscara de entrada corta o topo do
                "A" e de outras letras (mesmo ajuste do H1 na hero, ver
                Hero.tsx). */}
            <div className="overflow-hidden pt-[0.16em]">
              <motion.h3
                style={{ y: titleY }}
                className={`type-display type-inktrap leading-[0.9] ${
                  multi ? "text-[9vw] sm:text-[3.4vw]" : "text-[12vw] sm:text-[6vw]"
                }`}
              >
                {caseStudy.title[locale]}
              </motion.h3>
            </div>
            <div className="mt-4 overflow-hidden">
              <motion.p style={{ y: tagsY }} className="type-mono text-white/70">
                {caseStudy.tags[locale].join(" • ")}
              </motion.p>
            </div>
            <div className="mt-8 inline-block overflow-hidden">
              <motion.span
                style={{ y: ctaY }}
                className="type-mono inline-flex items-center gap-3 border border-white/40 px-6 py-3 backdrop-blur-sm"
              >
                {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
                <span aria-hidden>→</span>
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Selo "ver caso": segue o cursor deslocado bem à direita e um pouco
          abaixo dele. Só desktop (hover real existe), e só quando o painel
          está de fato em cena. O texto roda num letreiro horizontal
          contínuo, como uma placa luminosa antiga: a pílula é uma janela de
          largura fixa (overflow-hidden), menor que o conteúdo, e a faixa lá
          dentro tem DUAS cópias do texto uma atrás da outra, andando de 0%
          a -50% pra sempre. Como as duas cópias são idênticas, o instante em
          que a primeira sai pela esquerda é exatamente o instante em que a
          segunda chega no início, o loop não tem costura. */}
      <motion.div
        aria-hidden
        style={{ x: labelX, y: labelY }}
        className="pointer-events-none absolute left-0 top-0 z-10 hidden sm:block"
      >
        <motion.div
          animate={{
            opacity: isActive && hovering ? 1 : 0,
            scale: isActive && hovering ? 1 : 0.6,
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-44 overflow-hidden bg-white py-2.5 text-black"
        >
          <motion.div
            className="type-mono flex w-max items-center whitespace-nowrap"
            style={{ fontFamily: "var(--font-array)" }}
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center gap-2 px-4">
                {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase} →
              </span>
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}

function ExpandedCase({
  caseStudy,
  locale,
  dict,
  rect,
  onClose,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  rect: DOMRect;
  onClose: () => void;
}) {
  // FLIP manual: o overlay já nasce do tamanho da viewport inteira (fixed
  // inset-0), mas o transform inicial o encolhe e posiciona exatamente sobre
  // o retângulo do painel clicado; a transição anima de volta pra identidade.
  // Como o painel em cena já ocupa quase a tela inteira, esse ajuste tende a
  // ser sutil, mas mantém a mesma lógica se um dia o gatilho vier de um
  // elemento menor. scaleX/scaleY separados porque o painel e a viewport
  // quase nunca têm a mesma proporção exata.
  const origin = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: rect.left + rect.width / 2 - vw / 2,
      y: rect.top + rect.height / 2 - vh / 2,
      scaleX: rect.width / vw,
      scaleY: rect.height / vh,
    };
  }, [rect]);

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{
        x: origin.x,
        y: origin.y,
        scaleX: origin.scaleX,
        scaleY: origin.scaleY,
        opacity: 0.7,
      }}
      animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
      exit={{
        x: origin.x,
        y: origin.y,
        scaleX: origin.scaleX,
        scaleY: origin.scaleY,
        opacity: 0,
      }}
      transition={{ type: "spring", stiffness: 210, damping: 28 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="relative h-svh w-full overflow-hidden bg-black">
        {/* Zoom lento e contínuo na mídia, por cima do FLIP de entrada. */}
        <motion.div
          animate={{ scale: [1, 1.06] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="h-full w-full"
        >
          <MediaView
            media={caseStudy.cover}
            locale={locale}
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="gutter absolute inset-x-0 bottom-10 text-white sm:bottom-16">
          <p className="type-mono mb-4 text-white/70">
            {caseStudy.title[locale]} · {caseStudy.year}
          </p>
          <h2 className="type-display type-inktrap text-[11vw] leading-[0.92] sm:text-[6vw]">
            {caseStudy.title[locale]}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={dict.nav.close}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border border-white/30 text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:right-8 sm:top-8"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>

      <div className="gutter py-16 sm:py-20">
        <p className="type-serif-display max-w-3xl text-3xl sm:text-5xl">
          {caseStudy.statement[locale]}
        </p>

        <CaseMetrics caseStudy={caseStudy} locale={locale} className="mt-12" />

        <p className="type-mono mt-10 text-muted">
          {caseStudy.tags[locale].join(" • ")}
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="texture-noise aspect-4/3 bg-surface" />
          <div className="texture-noise aspect-4/3 bg-surface" />
        </div>

        {caseStudy.metrics.some((m) => m.illustrative) && (
          <p className="type-mono mt-8 text-muted">
            * {dict.cases.metricsDisclaimer}
          </p>
        )}

        <Link
          href={`/${locale}/work/${caseStudy.slug}/`}
          className="type-mono mt-16 inline-flex items-center gap-3 underline underline-offset-8"
        >
          {dict.cases.fullCase} →
        </Link>
      </div>
    </motion.div>
  );
}

export function CasesGrid({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanding, setExpanding] = useState<{
    caseStudy: CaseStudy;
    rect: DOMRect;
  } | null>(null);

  // Trio de artistas lado a lado só faz sentido com espaço de sobra: no
  // mobile cada case continua sua própria fatia de scroll, empilhado como
  // sempre foi (ver buildSlides). O padrão de "false" antes de hidratar
  // bate com o prerender estático, que não sabe a largura de tela de quem
  // vai abrir.
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const slides = isDesktop ? groupedSlides : flatSlides;
  const count = slides.length;
  const hasIllustrative = cases.some((c) =>
    c.metrics.some((m) => m.illustrative),
  );

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const next = Math.min(count - 1, Math.max(0, Math.floor(v * count)));
    setActiveIndex(next);
  });

  return (
    <section id="work" aria-label={dict.cases.title} className="border-t border-line">
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${count * 100}vh` }}
      >
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {slides.map((slide, index) => (
            <SlidePanel
              key={slide.map(({ caseStudy }) => caseStudy.slug).join("+")}
              slide={slide}
              totalCases={cases.length}
              locale={locale}
              dict={dict}
              index={index}
              count={count}
              scrollYProgress={scrollYProgress}
              isActive={index === activeIndex}
              isNearActive={Math.abs(index - activeIndex) <= 1}
              onExpand={(caseStudy, rect) => setExpanding({ caseStudy, rect })}
            />
          ))}

          {/* Leitura de posição, não navegação: informa onde o scroll está,
              não oferece atalho de clique (é a rolagem que manda agora). O
              número desliza pro lugar do anterior a cada troca, em vez de só
              trocar de texto, o mesmo princípio de máscara escalonada dos
              painéis, só que em miniatura. */}
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-8 z-20 flex items-center justify-between text-white">
            <span className="type-mono relative inline-block overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={activeIndex}
                  initial={{ y: "100%" }}
                  animate={{ y: "0%" }}
                  exit={{ y: "-100%" }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="block"
                >
                  {pad(activeIndex + 1)} / {pad(count)}
                </motion.span>
              </AnimatePresence>
            </span>
            <div className="flex gap-2">
              {slides.map((slide, index) => (
                <motion.span
                  key={slide.map(({ caseStudy }) => caseStudy.slug).join("+")}
                  animate={{ scale: index === activeIndex ? 1.4 : 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === activeIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {hasIllustrative && (
        <p className="gutter type-mono py-8 text-muted">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}

      <AnimatePresence>
        {expanding && (
          <ExpandedCase
            caseStudy={expanding.caseStudy}
            locale={locale}
            dict={dict}
            rect={expanding.rect}
            onClose={() => setExpanding(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
