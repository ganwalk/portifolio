"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MediaView } from "@/components/ui/MediaView";
import { cases } from "@/data/cases";
import type { CaseMetric, CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Os cases empilham como baralho: cada painel gruda no topo (sticky) e o
// seguinte desliza por cima, encolhendo e escurecendo o que ficou atrás.
//
// Para o scroll não virar repetição, cada painel usa um arranjo próprio,
// escolhido pela posição na fila, e um movimento próprio junto:
//
//   cheia    mídia de borda a borda, título no pé, parallax vertical
//   meio     meio a meio, texto no papel de um lado, mídia do outro
//   moldura  mídia emoldurada, título atravessando por cima em inversão
//   zoom     mídia com zoom de saída, título e métrica centralizados
//
// Assim a quinta carta recomeça o ciclo, e acrescentar cases mantém o ritmo.

const LAYOUTS = ["cheia", "meio", "moldura", "zoom"] as const;
type Layout = (typeof LAYOUTS)[number];

/** Entradas de título, uma por arranjo, para o reveal não ser sempre igual. */
const TITLE_MOTION = {
  cheia: { fora: { y: "104%" }, dentro: { y: 0 } },
  meio: { fora: { x: "-24%", opacity: 0 }, dentro: { x: 0, opacity: 1 } },
  moldura: { fora: { scale: 1.14, opacity: 0 }, dentro: { scale: 1, opacity: 1 } },
  zoom: { fora: { y: "60%", opacity: 0 }, dentro: { y: 0, opacity: 1 } },
} satisfies Record<Layout, { fora: object; dentro: object }>;

function Meta({
  index,
  year,
  className = "",
}: {
  index: number;
  year: string;
  className?: string;
}) {
  return (
    <p className={`type-mono ${className}`}>
      {String(index + 1).padStart(2, "0")} · {year}
    </p>
  );
}

function Metric({
  metric,
  locale,
  className = "",
  labelClass = "",
}: {
  metric: CaseMetric;
  locale: Locale;
  className?: string;
  labelClass?: string;
}) {
  return (
    <p className={className}>
      <span className="type-serif-display block text-5xl sm:text-7xl">
        {metric.value}
      </span>
      <span className={`type-mono ${labelClass}`}>
        {metric.label[locale]}
        {metric.illustrative && " *"}
      </span>
    </p>
  );
}

function Title({
  text,
  layout,
  className,
}: {
  text: string;
  layout: Layout;
  className: string;
}) {
  // O observer olha o contêiner, não o título: transladado para fora do clip,
  // o título nunca cruzaria o limiar de visibilidade.
  return (
    <motion.div
      className="overflow-hidden"
      initial="fora"
      whileInView="dentro"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.h3
        className={className}
        variants={{
          fora: TITLE_MOTION[layout].fora,
          dentro: {
            ...TITLE_MOTION[layout].dentro,
            transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
          },
        }}
      >
        {text}
      </motion.h3>
    </motion.div>
  );
}

function Footnote({
  caseStudy,
  locale,
  dict,
  className = "",
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <>
      <p className={`type-mono mt-4 ${className}`}>
        {caseStudy.tags[locale].join(" • ")}
      </p>
      <span className="type-mono mt-3 inline-block underline-offset-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:underline">
        {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
      </span>
    </>
  );
}

function Media({
  caseStudy,
  locale,
  style,
  className,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  style?: object;
  className: string;
}) {
  return (
    <motion.div style={style} className={className}>
      <MediaView
        media={caseStudy.cover}
        locale={locale}
        className="h-full w-full object-cover"
      />
    </motion.div>
  );
}

function Panel({
  caseStudy,
  locale,
  dict,
  index,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const layout: Layout = LAYOUTS[index % LAYOUTS.length];

  // Progresso da carta atravessando a viewport: alimenta os parallax.
  const { scrollYProgress: cross } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yMedia = useTransform(cross, [0, 1], ["-6%", "6%"]);
  const yFrame = useTransform(cross, [0, 1], ["-12%", "12%"]);
  const xFrame = useTransform(cross, [0, 1], ["4%", "-4%"]);
  const zoom = useTransform(cross, [0, 1], [1.22, 1]);

  // O quanto esta carta já foi coberta pela seguinte. A carta seguinte começa
  // exatamente onde este invólucro termina, então a borda inferior dele indo
  // do pé ao topo da tela é a própria passagem da carta de cima: 0 enquanto
  // esta carta está inteira à vista, 1 quando a próxima cobriu tudo.
  const { scrollYProgress: covered } = useScroll({
    target: ref,
    offset: ["end end", "end start"],
  });
  const scale = useTransform(covered, [0, 1], [1, 0.94]);
  const dim = useTransform(covered, [0, 1], [0, 0.45]);

  const metric = caseStudy.metrics[0];
  // Painéis de mídia cheia têm fundo escuro, então marcam a sobreposição com
  // um fio de luz; os que assentam no papel marcam com a própria linha.
  const onPaper = layout === "meio" || layout === "moldura";

  // O invólucro é mais alto que a carta de propósito: a sobra é o tempo em que
  // a carta fica parada e inteira à vista, antes da próxima começar a subir.
  // Sem ela, a carta seguinte entra no mesmo instante em que esta fixa.
  return (
    <div ref={ref} className="h-[175svh]">
      <motion.div
        style={{ scale }}
        className={`sticky top-14 h-[calc(100svh-3.5rem)] overflow-hidden ${
          onPaper
            ? "border-t border-line bg-background"
            : "bg-black shadow-[0_-1px_0_rgba(255,255,255,0.18)]"
        }`}
      >
        <Link
          href={`/${locale}/work/${caseStudy.slug}/`}
          className="group relative block h-full"
        >
          {layout === "cheia" && (
            <>
              <Media
                caseStudy={caseStudy}
                locale={locale}
                style={{ y: yMedia }}
                className="absolute inset-x-0 -top-[12%] h-[124%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/40" />
              <div className="absolute inset-0 flex flex-col justify-between p-4 text-white sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <Meta
                    index={index}
                    year={caseStudy.year}
                    className="text-white/70"
                  />
                  <Metric
                    metric={metric}
                    locale={locale}
                    className="text-right"
                    labelClass="text-white/70"
                  />
                </div>
                <div>
                  <Title
                    text={caseStudy.title[locale]}
                    layout={layout}
                    className="type-display max-w-5xl text-[11vw] leading-[0.9] sm:text-[6.5vw]"
                  />
                  <Footnote
                    caseStudy={caseStudy}
                    locale={locale}
                    dict={dict}
                    className="text-white/70"
                  />
                </div>
              </div>
            </>
          )}

          {layout === "meio" && (
            <div className="grid h-full grid-rows-[42%_58%] lg:grid-cols-2 lg:grid-rows-1">
              <div className="relative overflow-hidden lg:order-2">
                <Media
                  caseStudy={caseStudy}
                  locale={locale}
                  style={{ y: yMedia }}
                  className="absolute inset-x-0 -top-[10%] h-[120%]"
                />
              </div>
              <div className="flex flex-col justify-between p-4 sm:p-8 lg:order-1">
                <div className="flex items-start justify-between gap-4">
                  <Meta
                    index={index}
                    year={caseStudy.year}
                    className="text-muted"
                  />
                  <Metric
                    metric={metric}
                    locale={locale}
                    className="text-right"
                    labelClass="text-muted"
                  />
                </div>
                <div>
                  <Title
                    text={caseStudy.title[locale]}
                    layout={layout}
                    className="type-display text-[9vw] leading-[0.92] lg:text-[4.4vw]"
                  />
                  <Footnote
                    caseStudy={caseStudy}
                    locale={locale}
                    dict={dict}
                    className="text-muted"
                  />
                </div>
              </div>
            </div>
          )}

          {layout === "moldura" && (
            <>
              <div className="absolute inset-y-[9%] right-0 w-[82%] overflow-hidden sm:inset-y-[13%] sm:w-[62%]">
                <Media
                  caseStudy={caseStudy}
                  locale={locale}
                  style={{ y: yFrame, x: xFrame }}
                  className="absolute -inset-x-[10%] -top-[14%] h-[128%]"
                />
              </div>
              <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8">
                <Meta
                  index={index}
                  year={caseStudy.year}
                  className="text-muted"
                />
                <div>
                  {/* mix-blend-difference: o título atravessa a borda da mídia
                      e se inverte sozinho, legível no papel e sobre a imagem. */}
                  <Title
                    text={caseStudy.title[locale]}
                    layout={layout}
                    className="type-display origin-left text-[13vw] leading-[0.9] text-white mix-blend-difference sm:text-[7vw]"
                  />
                  <div className="mt-2 flex flex-wrap items-end justify-between gap-6">
                    <div>
                      <Footnote
                        caseStudy={caseStudy}
                        locale={locale}
                        dict={dict}
                        className="text-muted"
                      />
                    </div>
                    <Metric
                      metric={metric}
                      locale={locale}
                      className="text-right"
                      labelClass="text-muted"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {layout === "zoom" && (
            <>
              <Media
                caseStudy={caseStudy}
                locale={locale}
                style={{ scale: zoom }}
                className="absolute inset-0"
              />
              <div className="absolute inset-0 bg-black/50" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-4 text-center text-white sm:p-8">
                <Meta
                  index={index}
                  year={caseStudy.year}
                  className="text-white/70"
                />
                <Title
                  text={caseStudy.title[locale]}
                  layout={layout}
                  className="type-display max-w-5xl text-[12vw] leading-[0.9] sm:text-[7vw]"
                />
                <Metric
                  metric={metric}
                  locale={locale}
                  labelClass="text-white/70"
                />
                <div>
                  <Footnote
                    caseStudy={caseStudy}
                    locale={locale}
                    dict={dict}
                    className="text-white/70"
                  />
                </div>
              </div>
            </>
          )}

          {/* Escurecimento progressivo da carta coberta */}
          <motion.div
            aria-hidden
            style={{ opacity: dim }}
            className="pointer-events-none absolute inset-0 bg-black"
          />
        </Link>
      </motion.div>
    </div>
  );
}

export function CasePanels({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const hasIllustrative = cases.some((c) =>
    c.metrics.some((m) => m.illustrative),
  );

  return (
    <section id="work" className="border-t border-line">
      <h2 className="type-mono px-4 py-6 sm:px-8">{dict.cases.title}</h2>

      <div className="relative">
        {cases.map((caseStudy, index) => (
          <Panel
            key={caseStudy.slug}
            caseStudy={caseStudy}
            locale={locale}
            dict={dict}
            index={index}
          />
        ))}
      </div>

      {hasIllustrative && (
        <p className="type-mono px-4 py-4 text-muted sm:px-8">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </section>
  );
}
