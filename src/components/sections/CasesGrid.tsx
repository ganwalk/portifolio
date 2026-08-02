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

// Projetos em destaque como uma sequência amarrada ao scroll da própria
// página, não um carrossel com botões e timer: a seção sai direto da hero
// (sem título nem subtítulo próprios, só um rótulo acessível no <section>
// pra quem usa leitor de tela) e já entra prendendo o scroll. É alta (uma
// tela inteira por fatia) e fica presa (position: sticky) enquanto o
// visitante rola por ela, e cada fatia se revela a partir de uma íris
// fechada no centro (clip-path circle(), raio 0% a 102%, que é exatamente a
// distância até o canto mais longe a partir do centro) com um leve zoom
// junto, e fecha de volta pra dar lugar à próxima. Rolar É a navegação: sem
// seta, sem play/pause, sem índice próprio brigando com o scroll de
// verdade.
//
// Cada FATIA ocupa uma porção igual de scrollYProgress (1/N da seção), mas
// uma fatia nem sempre é um case só: cases adjacentes que compartilham
// `group` no dado (o trio de artistas, hoje) viram uma fatia só
// (`buildSlides`, calculado uma vez fora do componente porque `cases` é
// estático), lado a lado a partir do `lg:` (1024px) ou empilhados
// verticalmente dentro do mesmo painel antes disso: reduz o scroll do trio
// a 1/3 do que seria com um artista por fatia, no mobile também, não só no
// desktop. Essa fatia ganha uma coluna extra, estreita, antes das outras
// (à esquerda no lg:, à esquerda também empilhada): só a frase
// "Experiências interativas" girada 90°, na Whyte Inktrap, uma régua de
// contexto, não um case clicável. O rótulo de índice de cada coluna
// ("03 / 06") sempre conta cases, não fatias: SlidePanel repassa o índice
// original (`flatIndex`) pra cada CaseColumn, independente de quantas
// fatias existem; é a ÚNICA contagem da seção, não existe outra em nível de
// fatia competindo com ela. Nas pontas (primeira e última fatia) a fatia
// não tem a metade que não existe: a primeira já nasce aberta (nada
// "antes" dela pra desdobrar de), a última fica aberta até o fim da seção
// (nada "depois").
//
// Texto em máscara escalonada por cima da cortina, atrás do MotionConfig do
// Modo Boring: cada linha (índice, métrica, título, tags, convite) mora num
// overflow-hidden próprio e sobe do zero por baixo dele num instante
// diferente, em vez do bloco inteiro nascer junto num só fade. O atraso
// entre linhas é maior justamente no título, o elemento mais dramático da
// composição. A mídia em si fica sempre a cores (nenhum preto e branco
// entra na conta aqui, ao contrário do resto do site: a exceção é
// proposital, é o próprio projeto quem fala).
//
// O fundo de cada card é estático (só a mídia, sem deslocar com o cursor):
// o único movimento que resta nela é um zoom sutil, e esse é só no hover,
// não no scroll, pra não competir com a máscara de texto pela atenção. Um
// selo "ver caso" acompanha o cursor (mola só, sem rastro de partículas),
// deslocado bem à direita e um pouco abaixo da ponta (cursores grandes do
// sistema cobrem a área logo ao lado dela), com o texto rodando num
// letreiro horizontal contínuo, como uma placa luminosa antiga: duas cópias
// idênticas do texto lado a lado, sem seta nem espaço, só o ponto final de
// cada cópia separando da próxima, andando de 0% a -50% pra sempre, sem
// costura no loop. Complementar ao selo estático dentro do texto (que
// continua ali por acessibilidade e pra quem usa toque). onMouseMove, não
// onPointerMove: em toque o evento não dispara, então nada disso ativa lá,
// mesmo princípio que já mantém a lente da hero parada no mobile.
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
 *  (ver SlidePanel: lado a lado a partir do lg:, empilhados antes disso).
 *  Cases sem `group`, ou cujo vizinho tem um `group` diferente, viram uma
 *  fatia de um caso só, do jeito que sempre foi. */
function buildSlides(list: CaseStudy[]): SlideCase[][] {
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

// `cases` é estático (import), então cabe calcular uma vez só, fora do
// componente.
const groupedSlides = buildSlides(cases);

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

  // Íris: um círculo que cresce do centro até cobrir as quatro quinas
  // (100% de raio, na definição de clip-path, é exatamente a distância até
  // o canto mais longe a partir do centro), no lugar da cortina antiga de
  // barras horizontais fechando/abrindo. Fechado (raio 0) ainda é só um
  // ponto, mesma proteção contra vazar por trás de outra fatia enquanto
  // ela ainda abre. Por cima, um leve zoom no conteúdo (não no clip-path
  // em si, numa camada à parte) dá uma sensação de aproximação junto da
  // abertura, em vez de um recorte estático crescendo.
  const irisRadius = useTransform(openT, [0, 1], [0, 102]);
  const clipPath = useMotionTemplate`circle(${irisRadius}% at 50% 50%)`;
  const panelScale = useTransform(openT, [0, 1], [1.08, 1]);

  return (
    <motion.div
      aria-hidden={!isActive}
      className="absolute inset-0 h-full w-full overflow-hidden bg-black"
      style={{
        clipPath,
        zIndex: isActive ? count + 1 : index,
      }}
    >
      <motion.div style={{ scale: panelScale }} className="flex h-full w-full">
        {multi && (
          <div className="flex w-8 shrink-0 items-center justify-center sm:w-10 lg:w-14">
            <span
              className="type-inktrap whitespace-nowrap text-xs uppercase tracking-widest text-white/50"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {dict.cases.interactiveExperiences}
            </span>
          </div>
        )}
        {/* Lado a lado só a partir do lg: até lá (mobile e tablet, onde
            três colunas apertadas ficariam ilegíveis) o trio empilha na
            vertical, dentro do mesmo painel preso ao scroll, uma fatia só
            em vez de três. Reduz o scroll do trio a 1/3 do que seria
            empilhando cada artista na fatia dele, sem abrir mão do "lado a
            lado" onde sobra largura. */}
        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          {slide.map(({ caseStudy, flatIndex }) => (
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
              dividerLeft={multi}
              onExpand={onExpand}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

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
  /** Uma de três, não o painel cheio: título, métrica e respiro encolhem
   *  pra caber num terço do espaço (da largura no lg:, da altura antes
   *  disso, ver dividerLeft) em vez de vazar. */
  multi: boolean;
  /** Fio entre as colunas do trio, na direção que muda com o layout: em
   *  cima (empilhado, antes do lg:) ou à esquerda (lado a lado, lg:). */
  dividerLeft: boolean;
  onExpand: (caseStudy: CaseStudy, rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];
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

  // O fundo do card é estático, só o vídeo/imagem em si: nada de deslocar
  // com o mouse. O único movimento que resta na mídia é o zoom, e esse é só
  // no hover (não mais amarrado ao scroll): mais previsível, sem o "pulo"
  // de zoom que a rolagem causava antes de chegar num projeto.
  function handleMouseMove(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRawX.set(event.clientX - rect.left);
    pointerRawY.set(event.clientY - rect.top);
  }

  function handleMouseLeave() {
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
      className={`relative block h-full w-full flex-1 bg-black text-left ${
        dividerLeft ? "border-t border-white/15 lg:border-l lg:border-t-0" : ""
      } ${isActive ? "" : "pointer-events-none"}`}
    >
      {/* Tudo que precisa de corte (zoom da mídia, máscara do texto) vive
          aqui dentro; o botão em si fica sem overflow-hidden pra não cortar
          o selo, que pode passar do próprio limite da coluna quando o
          cursor chega perto da borda. */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: hovering ? 1.06 : 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/45" />

        <motion.div
          style={{ opacity: contentOpacity }}
          className={`gutter relative flex h-full flex-col text-white ${
            multi
              ? "justify-end gap-2 py-4 sm:py-5 lg:justify-between lg:gap-0 lg:py-24"
              : "justify-between py-24 sm:py-28"
          }`}
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
                    multi ? "text-xl sm:text-2xl lg:text-4xl" : "text-4xl sm:text-6xl"
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
            {/* pt-[0.16em] no PRÓPRIO h3, não no wrapper: leading-[0.9] é
                mais apertado que a altura real da Whyte Inktrap, sem esse
                respiro o overflow-hidden usado pra máscara de entrada corta
                o topo do "A" e de outras letras (mesmo ajuste do H1 na
                hero, ver Hero.tsx). Precisa estar no h3, e não no wrapper:
                em é relativo ao font-size do próprio elemento, e o wrapper
                não herda o text-[Xvw] do h3 (font-size só desce a árvore,
                não sobe), então um pt-[0.16em] nele resolvia contra o
                tamanho herdado de bem mais acima, uma fração pequena demais
                do respiro necessário. */}
            <div className="overflow-hidden">
              <motion.h3
                style={{ y: titleY }}
                className={`type-display type-inktrap pt-[0.16em] leading-[0.9] ${
                  multi ? "text-[7vw] sm:text-[5vw] lg:text-[3.4vw]" : "text-[12vw] sm:text-[6vw]"
                }`}
              >
                {caseStudy.title[locale]}
              </motion.h3>
            </div>
            <div className={`overflow-hidden ${multi ? "mt-1 lg:mt-4" : "mt-4"}`}>
              <motion.p style={{ y: tagsY }} className="type-mono text-white/70">
                {caseStudy.tags[locale].join(" • ")}
              </motion.p>
            </div>
            <div
              className={`inline-block overflow-hidden ${multi ? "mt-2 lg:mt-8" : "mt-8"}`}
            >
              <motion.span
                style={{ y: ctaY }}
                className={`type-mono inline-flex items-center gap-3 border border-white/40 backdrop-blur-sm ${
                  multi ? "px-3 py-1.5 lg:px-6 lg:py-3" : "px-6 py-3"
                }`}
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
          contínuo, como uma placa luminosa antiga, na mesma mono dos fatos
          da hera ("UX/UI · Webapps · Design Systems"): a pílula é uma
          janela de largura fixa (overflow-hidden), menor que o conteúdo, e
          a faixa lá dentro tem DUAS cópias do texto uma atrás da outra,
          separadas por "•" (o mesmo separador de bullet usado em tags e
          fatos pelo site inteiro), andando de 0% a -50% pra sempre. Como as
          duas cópias são idênticas, o instante em que a primeira sai pela
          esquerda é exatamente o instante em que a segunda chega no
          início, o loop não tem costura. */}
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
            className="type-mono flex w-max whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="shrink-0">
                {" "}
                • {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
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

  // O trio de artistas sempre é uma fatia só (groupedSlides), em qualquer
  // largura: lado a lado a partir do lg:, empilhado dentro do mesmo painel
  // antes disso (ver SlidePanel). Reduz o scroll do trio a 1/3 também no
  // mobile, em vez de um projeto por tela inteira.
  const slides = groupedSlides;
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

          {/* A contagem já mora em cada card ("03 / 06", o índice do case na
              lista inteira), então o rodapé não repete outra em nível de
              fatia: só um lembrete de que rolar é a navegação, no lugar
              onde um contador "01 / 04" ficava antes. Os pontos continuam
              como leitura de posição (não navegação, não oferecem atalho de
              clique), animando a troca em vez de só saltar de um pro
              outro. */}
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-8 z-20 flex items-center justify-between text-white">
            <span className="type-mono text-white/50">{dict.cases.scrollHint}</span>
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
