"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MediaView } from "@/components/ui/MediaView";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Os cases como painéis de tela quase inteira: a mídia é o protagonista, em
// parallax atrás de um título display e uma métrica. O texto longo (statement,
// contexto) mora na página do case; aqui é impacto e clique.

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
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  // A mídia mora num contêiner 24% mais alto que o painel e desliza dentro
  // dele conforme o painel cruza a viewport: o efeito parallax inteiro.
  const y = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const metric = caseStudy.metrics[0];

  return (
    <div ref={ref} className="relative h-[92svh] overflow-hidden">
      <Link
        href={`/${locale}/work/${caseStudy.slug}/`}
        className="group block h-full"
      >
        <motion.div style={{ y }} className="absolute inset-x-0 -top-[12%] h-[124%]">
          <MediaView
            media={caseStudy.cover}
            locale={locale}
            className="h-full w-full object-cover"
          />
        </motion.div>

        {/* Véu para legibilidade do texto sobre qualquer mídia */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/40" />

        <div className="absolute inset-0 flex flex-col justify-between p-4 text-white sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <p className="type-mono text-white/70">
              {String(index + 1).padStart(2, "0")} · {caseStudy.year}
            </p>
            <p className="text-right">
              <span className="type-serif-display block text-5xl sm:text-7xl">
                {metric.value}
              </span>
              <span className="type-mono text-white/70">
                {metric.label[locale]}
                {metric.illustrative && " *"}
              </span>
            </p>
          </div>

          <div>
            {/* O observer olha o contêiner, não o título: transladado para fora
                do clip, o título nunca cruzaria o limiar de visibilidade. */}
            <motion.div
              className="overflow-hidden"
              initial="fora"
              whileInView="dentro"
              viewport={{ once: true, amount: 0.5 }}
            >
              <motion.h3
                className="type-display max-w-5xl text-[11vw] leading-[0.9] sm:text-[6.5vw]"
                variants={{
                  fora: { y: "104%" },
                  dentro: {
                    y: 0,
                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                {caseStudy.title[locale]}
              </motion.h3>
            </motion.div>
            <p className="type-mono mt-4 text-white/70">
              {caseStudy.tags[locale].join(" • ")}
            </p>
            <span className="type-mono mt-3 inline-block text-white underline-offset-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:underline">
              {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
            </span>
          </div>
        </div>
      </Link>
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
      <h2 className="type-mono px-4 py-6 text-accent sm:px-8">
        {dict.cases.title}
      </h2>

      {cases.map((caseStudy, index) => (
        <Panel
          key={caseStudy.slug}
          caseStudy={caseStudy}
          locale={locale}
          dict={dict}
          index={index}
        />
      ))}

      {hasIllustrative && (
        <p className="type-mono px-4 py-4 text-muted sm:px-8">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </section>
  );
}
