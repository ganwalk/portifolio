"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Carrossel automático e infinito: um projeto em cena por vez (vídeo,
// título, tags e a métrica principal), consideravelmente maior que os
// vizinhos, que espiam cortados nas bordas do palco em qualquer posição,
// inclusive nas pontas da lista. Gira sozinho (barra de progresso por
// baixo), mas para no hover, no foco e enquanto um case está expandido.
// Clicar no projeto em cena o expande pra tela cheia, com um zoom que nasce
// exatamente do retângulo do cartão clicado; os dados completos do case
// aparecem abaixo, dentro do próprio overlay, sem precisar navegar.
//
// O posicionamento dos slides usa scroll-snap nativo, não transform+posição
// calculados na mão: cada slide é um item comum de um flex horizontal
// rolável (snap-center), e "ativar" um projeto é só mover o scrollLeft da
// trilha até ele (scrollToSlide, abaixo; não scrollIntoView, que sobe por
// qualquer ancestral rolável e chegou a arrastar a página inteira até o
// carrossel ao carregar). Uma primeira versão empilhava os cartões no mesmo
// ponto e deslocava via x/scale animado, mas caía num bug real de
// hit-testing (o próprio palco interceptando cliques que deveriam chegar ao
// cartão). Scroll nativo não sofre disso: o navegador cuida do layout, do
// snap e até do swipe em touch de graça, e IntersectionObserver diz qual
// cartão está centralizado.
//
// Infinito de verdade (não só um índice que dá a volta): a trilha renderiza
// um clone do último projeto antes do primeiro e um clone do primeiro depois
// do último. Assim sempre existe um vizinho pra espiar dos dois lados, até
// nas pontas da lista real, sem o vazio feio que sobrava ali antes. Ao
// pousar num clone, a trilha salta pro slide real equivalente sem animação
// (mesmo conteúdo, então o salto é imperceptível), e a "próxima" viagem já
// parte do lugar certo.

const AUTOPLAY_MS = 6000;

function Slide({
  caseStudy,
  locale,
  dict,
  displayIndex,
  isActive,
  isClone,
  registerRef,
  onSelect,
  onExpand,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  /** Número exibido (01, 02...): a posição do case na lista real, mesmo
   *  quando este slide é um clone de borda. */
  displayIndex: number;
  isActive: boolean;
  isClone: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onExpand: (rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];

  return (
    <div
      ref={registerRef}
      aria-hidden={isClone}
      className="w-[82vw] max-w-[440px] flex-shrink-0 snap-center sm:w-[60vw] sm:max-w-[820px]"
    >
      <div
        className={`aspect-[4/3] w-full origin-center transition-[transform,opacity] duration-500 ease-out sm:aspect-[16/10] ${
          isActive ? "scale-100 opacity-100" : "scale-[0.62] opacity-[0.35]"
        }`}
      >
        <button
          type="button"
          tabIndex={isClone ? -1 : undefined}
          onClick={(event) =>
            isActive
              ? onExpand(event.currentTarget.getBoundingClientRect())
              : onSelect()
          }
          aria-label={
            isActive
              ? caseStudy.title[locale]
              : `${dict.cases.goToProject} ${caseStudy.title[locale]}`
          }
          className="group relative block h-full w-full overflow-hidden bg-black text-left"
        >
          <MediaView
            media={caseStudy.cover}
            locale={locale}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

          {!isActive && (
            <p className="type-mono absolute left-5 top-5 text-white/60">
              {String(displayIndex + 1).padStart(2, "0")}
            </p>
          )}

          <div
            className={`absolute inset-0 flex flex-col justify-between p-5 text-white transition-opacity duration-300 sm:p-6 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="type-mono text-white/70">
                {String(displayIndex + 1).padStart(2, "0")} · {caseStudy.year}
              </p>
              <p className="text-right">
                <span className="type-serif-display block text-2xl sm:text-3xl">
                  {metric.value}
                </span>
                <span className="type-mono text-white/70">
                  {metric.label[locale]}
                  {metric.illustrative && " *"}
                </span>
              </p>
            </div>

            <span className="type-mono self-center rounded-full border border-white/40 px-6 py-3 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
              {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
            </span>

            <div>
              <h3 className="type-display type-inktrap text-2xl leading-[0.95] sm:text-3xl lg:text-4xl">
                {caseStudy.title[locale]}
              </h3>
              <p className="type-mono mt-3 text-white/70">
                {caseStudy.tags[locale].join(" • ")}
              </p>
            </div>
          </div>
        </button>
      </div>
    </div>
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
  // o retângulo do cartão clicado; a transição anima de volta pra identidade,
  // então a mídia parece crescer a partir do próprio cartão, não aparecer do
  // nada. scaleX/scaleY separados (não um scale só) porque o cartão e a
  // viewport quase nunca têm a mesma proporção.
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
        {/* Zoom lento e contínuo na mídia, por cima do FLIP de entrada: o
            "dinâmico" que o site pedia além do zoom de abertura. */}
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
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:right-8 sm:top-8"
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

const COUNT = cases.length;
// Clone do último antes do primeiro e clone do primeiro depois do último:
// a trilha renderizada é sempre [clone, ...cases reais, clone]. loopIndex 0
// e COUNT+1 são os clones; 1..COUNT são os cases reais (realIndex = loopIndex - 1).
const loopCases = [cases[COUNT - 1], ...cases, cases[0]];

function realIndexOf(loopIndex: number) {
  if (loopIndex === 0) return COUNT - 1;
  if (loopIndex === COUNT + 1) return 0;
  return loopIndex - 1;
}

export function CasesGrid({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [expanding, setExpanding] = useState<{
    caseStudy: CaseStudy;
    rect: DOMRect;
  } | null>(null);

  const isPaused = isHovering || manualPaused || expanding !== null;
  const hasIllustrative = cases.some((c) =>
    c.metrics.some((m) => m.illustrative),
  );

  // Rola só a trilha horizontal, nunca a página: scrollIntoView() sobe por
  // qualquer ancestral rolável pra garantir visibilidade, e como a trilha
  // carrega no meio da página (abaixo da hora), ele arrastava o scroll
  // vertical inteiro até o carrossel assim que o efeito de posição inicial
  // rodava, um bug real (a página "pulava" da hero pro carrossel ao
  // carregar). Calcular o delta pelo retângulo de cada um e mover só
  // track.scrollLeft evita esse vazamento por construção.
  function scrollToSlide(loopIndex: number, behavior: ScrollBehavior) {
    const track = trackRef.current;
    const slide = slideRefs.current[loopIndex];
    if (!track || !slide) return;
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const delta =
      slideRect.left + slideRect.width / 2 - (trackRect.left + trackRect.width / 2);
    track.scrollTo({ left: track.scrollLeft + delta, behavior });
  }

  // Avanço automático: um setTimeout de verdade, não o "animationend" da
  // barra visual (CSS puro). Um bug real apareceu por causa disso: em
  // headless o Chromium não roda a animação em tempo de parede, então o
  // animationend disparava quase instantâneo. O timer guarda quanto falta em
  // remainingMsRef, que um efeito decrementa na pausa e o outro reseta a
  // cada slide novo, então pausar de verdade preserva o progresso em vez de
  // reiniciar a contagem.
  const remainingMsRef = useRef(AUTOPLAY_MS);

  useEffect(() => {
    remainingMsRef.current = AUTOPLAY_MS;
  }, [activeIndex]);

  useEffect(() => {
    if (isPaused) return;
    const start = Date.now();
    const id = setTimeout(() => {
      step(1);
    }, remainingMsRef.current);
    return () => {
      clearTimeout(id);
      remainingMsRef.current -= Date.now() - start;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, isPaused]);

  // Corrige o pouso num clone: some sem animação pro slide real equivalente,
  // então a "próxima" viagem sempre parte de um índice real, nunca de um
  // clone. Também define quem está ativo a partir do scroll de verdade, não
  // de um índice só nosso: clicar num vizinho, arrastar no touch ou usar as
  // setas chegam todos ao mesmo estado por caminhos diferentes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio > 0.6) {
            const loopIndex = slideRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (loopIndex === -1) continue;
            const real = realIndexOf(loopIndex);
            setActiveIndex(real);
            if (loopIndex === 0 || loopIndex === COUNT + 1) {
              scrollToSlide(real + 1, "instant");
            }
          }
        }
      },
      { root: track, threshold: [0.6] },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  // Salto inicial: sem isso, o primeiro slide em pé no carregamento seria o
  // clone do último (o primeiro elemento da trilha), não o projeto 01.
  useEffect(() => {
    scrollToSlide(1, "instant");
  }, []);

  /** Pra setas e autoplay: anda um slide na trilha real (pode pousar num
   *  clone na borda, corrigido pelo observer acima), preservando a sensação
   *  de vizinho adjacente em vez de pular pro outro lado da lista. */
  function step(direction: 1 | -1) {
    scrollToSlide(activeIndex + 1 + direction, "smooth");
  }

  /** Pros dots: pula direto pro índice real pedido, seja qual for a
   *  distância na trilha. */
  function goTo(realIndex: number) {
    const wrapped = ((realIndex % COUNT) + COUNT) % COUNT;
    scrollToSlide(wrapped + 1, "smooth");
  }

  return (
    <section id="work" className="section-y border-t border-line">
      <div className="gutter">
        <Reveal>
          <h2 className="type-mono mb-2">{dict.cases.title}</h2>
          <p className="mb-16 max-w-lg text-muted">{dict.cases.subtitle}</p>
        </Reveal>
      </div>

      <Reveal delay={0.1}>
        <div
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div
            ref={trackRef}
            className="no-scrollbar flex h-[68vw] max-h-[520px] min-h-[320px] snap-x snap-mandatory items-center gap-4 overflow-x-auto scroll-smooth px-[9vw] sm:h-[42vw] sm:max-h-[620px] sm:min-h-[380px] sm:gap-8 sm:px-[20vw]"
          >
            {loopCases.map((caseStudy, loopIndex) => {
              const realIndex = realIndexOf(loopIndex);
              const isClone = loopIndex === 0 || loopIndex === COUNT + 1;
              return (
                <Slide
                  key={`${caseStudy.slug}-${loopIndex}`}
                  caseStudy={caseStudy}
                  locale={locale}
                  dict={dict}
                  displayIndex={realIndex}
                  isActive={realIndex === activeIndex}
                  isClone={isClone}
                  registerRef={(el) => {
                    slideRefs.current[loopIndex] = el;
                  }}
                  onSelect={() => scrollToSlide(loopIndex, "smooth")}
                  onExpand={(rect) => setExpanding({ caseStudy, rect })}
                />
              );
            })}
          </div>

          <div className="gutter mt-8 flex items-center gap-6">
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={dict.cases.previousProject}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:bg-surface"
            >
              <span aria-hidden>←</span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="h-[2px] w-full overflow-hidden bg-foreground/15">
                <div
                  key={activeIndex}
                  className="h-full w-full origin-left bg-foreground"
                  style={{
                    animation: `cases-carousel-progress ${AUTOPLAY_MS}ms linear`,
                    animationPlayState: isPaused ? "paused" : "running",
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-4">
                <div className="flex gap-2">
                  {cases.map((caseStudy, index) => (
                    <button
                      key={caseStudy.slug}
                      type="button"
                      onClick={() => goTo(index)}
                      aria-label={`${dict.cases.goToProject} ${caseStudy.title[locale]}`}
                      aria-current={index === activeIndex}
                      className={`h-2 w-2 rounded-full transition-colors ${
                        index === activeIndex ? "bg-foreground" : "bg-line"
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setManualPaused((paused) => !paused)}
                  aria-label={
                    manualPaused
                      ? dict.cases.resumeAutoplay
                      : dict.cases.pauseAutoplay
                  }
                  className="type-mono text-muted transition-colors hover:text-foreground"
                >
                  {manualPaused ? "▶" : "II"}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => step(1)}
              aria-label={dict.cases.nextProject}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:bg-surface"
            >
              <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      </Reveal>

      {hasIllustrative && (
        <p className="gutter type-mono mt-8 text-muted">
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
