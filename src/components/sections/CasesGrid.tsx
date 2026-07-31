"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CaseMediaGrid } from "@/components/ui/CaseMediaGrid";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Carrossel automático: um projeto em cena por vez (vídeo, título, tags e a
// métrica principal), com os vizinhos espiando cortados nas bordas do palco.
// Gira sozinho (barra de progresso por baixo), mas para no hover, no foco e
// enquanto um case está expandido. Clicar no projeto em cena o expande pra
// tela cheia, com um zoom que nasce exatamente do retângulo do cartão
// clicado; os dados completos do case aparecem abaixo, dentro do próprio
// overlay, sem precisar navegar. Substitui a grade bento anterior.
//
// O posicionamento dos slides usa scroll-snap nativo, não transform+posição
// calculados na mão: cada slide é um item comum de um flex horizontal
// rolável (snap-center), e "ativar" um projeto é só chamar scrollIntoView
// nele. Uma primeira versão empilhava os quatro cartões no mesmo ponto e
// deslocava via x/scale animado, mas caía num bug real de hit-testing (o
// próprio palco interceptando cliques que deveriam chegar ao cartão) por
// causa da pilha de elementos sobrepostos. Scroll nativo não sofre disso: o
// navegador cuida do layout, do snap e até do swipe em touch de graça, e
// IntersectionObserver diz qual cartão está centralizado.

const AUTOPLAY_MS = 6000;

function Slide({
  caseStudy,
  locale,
  dict,
  index,
  isActive,
  registerRef,
  onSelect,
  onExpand,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  index: number;
  isActive: boolean;
  registerRef: (el: HTMLDivElement | null) => void;
  onSelect: () => void;
  onExpand: (rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];

  return (
    <div
      ref={registerRef}
      className="w-[80vw] max-w-[420px] flex-shrink-0 snap-center sm:w-[58vw] sm:max-w-[760px]"
    >
      <div
        className={`aspect-[4/3] w-full origin-center transition-[transform,opacity] duration-500 ease-out sm:aspect-[16/10] ${
          isActive ? "scale-100 opacity-100" : "scale-[0.92] opacity-50"
        }`}
      >
        <button
          type="button"
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
              {String(index + 1).padStart(2, "0")}
            </p>
          )}

          <div
            className={`absolute inset-0 flex flex-col justify-between p-5 text-white transition-opacity duration-300 sm:p-6 ${
              isActive ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <p className="type-mono text-white/70">
                {String(index + 1).padStart(2, "0")} · {caseStudy.year}
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

        <div className="mt-12">
          <CaseMediaGrid caseStudy={caseStudy} locale={locale} />
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

  // Avanço automático: um setTimeout de verdade, não o "animationend" da
  // barra visual (CSS puro). Um bug real apareceu por causa disso: em
  // headless o Chromium não roda a animação em tempo de parede, então o
  // animationend disparava quase instantâneo (3 avanços em menos de 1s ao
  // carregar a página). O timer guarda quanto falta em remainingMsRef, que
  // um efeito decrementa na pausa e o outro reseta a cada slide novo, então
  // pausar de verdade preserva o progresso em vez de reiniciar a contagem.
  const remainingMsRef = useRef(AUTOPLAY_MS);

  useEffect(() => {
    remainingMsRef.current = AUTOPLAY_MS;
  }, [activeIndex]);

  useEffect(() => {
    if (isPaused) return;
    const start = Date.now();
    const id = setTimeout(() => {
      goTo(activeIndex + 1);
    }, remainingMsRef.current);
    return () => {
      clearTimeout(id);
      remainingMsRef.current -= Date.now() - start;
    };
  }, [activeIndex, isPaused]);

  // Quem está "ativo" é definido pelo scroll de verdade, não por um índice
  // só nosso: o observer aponta qual slide está mais visível dentro da
  // trilha, então clicar num vizinho, arrastar no touch ou usar as setas
  // chegam todos ao mesmo estado por caminhos diferentes.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio > 0.6) {
            const index = slideRefs.current.indexOf(
              entry.target as HTMLDivElement,
            );
            if (index !== -1) setActiveIndex(index);
          }
        }
      },
      { root: track, threshold: [0.6] },
    );
    slideRefs.current.forEach((slide) => slide && observer.observe(slide));
    return () => observer.disconnect();
  }, []);

  function goTo(index: number) {
    const wrapped = ((index % cases.length) + cases.length) % cases.length;
    slideRefs.current[wrapped]?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
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
            className="no-scrollbar flex h-[62vw] max-h-[460px] min-h-[300px] snap-x snap-mandatory items-center gap-4 overflow-x-auto scroll-smooth px-[10vw] sm:h-[40vw] sm:max-h-[560px] sm:min-h-[360px] sm:gap-6 sm:px-[21vw]"
          >
            {cases.map((caseStudy, index) => (
              <Slide
                key={caseStudy.slug}
                caseStudy={caseStudy}
                locale={locale}
                dict={dict}
                index={index}
                isActive={index === activeIndex}
                registerRef={(el) => {
                  slideRefs.current[index] = el;
                }}
                onSelect={() => goTo(index)}
                onExpand={(rect) => setExpanding({ caseStudy, rect })}
              />
            ))}
          </div>

          <div className="gutter mt-8 flex items-center gap-6">
            <button
              type="button"
              onClick={() => goTo(activeIndex - 1)}
              aria-label={dict.cases.previousProject}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:bg-surface"
            >
              <span aria-hidden>←</span>
            </button>

            <div className="flex-1">
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

              <div className="mt-4 flex items-center justify-between">
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
              onClick={() => goTo(activeIndex + 1)}
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
