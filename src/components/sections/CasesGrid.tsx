"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Projetos em destaque como uma sequência amarrada ao scroll da própria
// página, não um carrossel com botões e timer: a seção é alta (uma tela
// inteira por projeto) e fica presa (position: sticky) enquanto o visitante
// rola por ela, e cada projeto se desdobra a partir de uma cortina fechada
// no centro (clip-path fechado nas bordas superior e inferior, abrindo
// conforme o scroll avança), com o texto entrando um instante depois, e
// fecha de volta pra dar lugar ao próximo. Rolar É a navegação: sem seta,
// sem play/pause, sem índice próprio brigando com o scroll de verdade.
//
// Cada projeto ocupa uma fatia igual de scrollYProgress (1/N da seção).
// Nas pontas (primeiro e último projeto) a fatia não tem a metade que não
// existe: o primeiro já nasce aberto (nada "antes" dele pra desdobrar de),
// o último fica aberto até o fim da seção (nada "depois").
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

function ProjectPanel({
  caseStudy,
  locale,
  dict,
  index,
  count,
  scrollYProgress,
  isActive,
  isNearActive,
  onExpand,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  index: number;
  count: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  isActive: boolean;
  isNearActive: boolean;
  onExpand: (rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];
  const { input, output } = segmentRange(index, count);
  const openT = useTransform(scrollYProgress, input, output);

  // A "cortina": fechada como uma fresta no centro, abrindo pras bordas.
  // clip-path em vez de scaleY porque não distorce o conteúdo por baixo, só
  // revela mais dele, o desdobrar parece uma abertura, não um esticar.
  const insetPercent = useTransform(openT, [0, 1], [46, 0]);
  const clipPath = useMotionTemplate`inset(${insetPercent}% 0% ${insetPercent}% 0%)`;
  const mediaZoom = useTransform(openT, [0, 1], [1.18, 1]);
  const contentOpacity = useTransform(openT, [0, 0.55, 1], [0, 1, 1]);
  const contentY = useTransform(openT, [0, 1], [28, 0]);

  return (
    <motion.button
      type="button"
      onClick={(event) =>
        isActive && onExpand(event.currentTarget.getBoundingClientRect())
      }
      tabIndex={isActive ? 0 : -1}
      aria-hidden={!isActive}
      aria-label={caseStudy.title[locale]}
      className={`absolute inset-0 block h-full w-full overflow-hidden bg-black text-left ${
        isActive ? "" : "pointer-events-none"
      }`}
      style={{ clipPath, zIndex: isActive ? count + 1 : index }}
    >
      <motion.div style={{ scale: mediaZoom }} className="absolute inset-0">
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
        style={{ opacity: contentOpacity, y: contentY }}
        className="gutter relative flex h-full flex-col justify-between py-24 text-white sm:py-28"
      >
        <div className="flex items-start justify-between gap-4">
          <p className="type-mono text-white/70">
            {pad(index + 1)} / {pad(count)} · {caseStudy.year}
          </p>
          <p className="text-right">
            <span className="type-serif-display block text-4xl sm:text-6xl">
              {metric.value}
            </span>
            <span className="type-mono text-white/70">
              {metric.label[locale]}
              {metric.illustrative && " *"}
            </span>
          </p>
        </div>

        <div>
          <h3 className="type-display type-inktrap text-[12vw] leading-[0.9] sm:text-[6vw]">
            {caseStudy.title[locale]}
          </h3>
          <p className="type-mono mt-4 text-white/70">
            {caseStudy.tags[locale].join(" • ")}
          </p>
          <span className="type-mono mt-8 inline-flex items-center gap-3 rounded-full border border-white/40 px-6 py-3 backdrop-blur-sm">
            {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
            <span aria-hidden>→</span>
          </span>
        </div>
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

  const count = cases.length;
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
    <section id="work" className="border-t border-line">
      <div className="gutter section-y">
        <Reveal>
          <h2 className="type-mono mb-2">{dict.cases.title}</h2>
          <p className="max-w-lg text-muted">{dict.cases.subtitle}</p>
        </Reveal>
      </div>

      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${count * 100}vh` }}
      >
        <div className="sticky top-0 h-svh w-full overflow-hidden">
          {cases.map((caseStudy, index) => (
            <ProjectPanel
              key={caseStudy.slug}
              caseStudy={caseStudy}
              locale={locale}
              dict={dict}
              index={index}
              count={count}
              scrollYProgress={scrollYProgress}
              isActive={index === activeIndex}
              isNearActive={Math.abs(index - activeIndex) <= 1}
              onExpand={(rect) => setExpanding({ caseStudy, rect })}
            />
          ))}

          {/* Leitura de posição, não navegação: informa onde o scroll está,
              não oferece atalho de clique (é a rolagem que manda agora). */}
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-8 z-20 flex items-center justify-between text-white">
            <span className="type-mono">
              {pad(activeIndex + 1)} / {pad(count)}
            </span>
            <div className="flex gap-2">
              {cases.map((caseStudy, index) => (
                <span
                  key={caseStudy.slug}
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
