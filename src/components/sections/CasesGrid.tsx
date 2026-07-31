"use client";

import Link from "next/link";
import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Grade bento: cada case é um cartão de tamanho próprio, dois grandes e dois
// pequenos alternando na diagonal (repete a cada quatro, se a lista crescer).
// Substitui a versão anterior, um baralho de cartas que prendia o scroll uma
// tela por vez: efeito e tanto, mas cansa rápido e não lê como "destaque",
// lê como apresentação forçada.
//
// O dinamismo agora vem de dois lugares: a entrada em cascata (Reveal, um
// atraso por índice) e a resposta ao cursor dentro de cada cartão (a mídia
// se desloca um pouco na direção do ponteiro, e o cartão inteiro cresce de
// leve no hover). onMouseMove, não onPointerMove: em tela de toque o evento
// simplesmente não dispara, então a inclinação nunca ativa lá, mesmo
// princípio que já mantém a lente da hera parada no mobile.

const BENTO = [
  { col: "lg:col-span-2", aspect: "aspect-[4/3] lg:aspect-[16/10]" },
  { col: "lg:col-span-1", aspect: "aspect-[4/3] lg:aspect-[3/4]" },
  { col: "lg:col-span-1", aspect: "aspect-[4/3] lg:aspect-[3/4]" },
  { col: "lg:col-span-2", aspect: "aspect-[4/3] lg:aspect-[16/10]" },
];

function Card({
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

  // Parallax ambiente: a mídia deriva alguns pontos percentuais enquanto o
  // cartão atravessa a viewport, igual ao baralho anterior.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const scrollY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  // Foco puxado: a mídia entra um pouco desfocada e ampliada, e assenta
  // (nítida, no tamanho normal) só quando o cartão chega perto do centro da
  // viewport. Mesma faixa 0→0.4 de scrollYProgress usada nos dois, pra
  // desfoque e zoom resolverem juntos. Como os dois nascem do scroll (não de
  // "entrou na viewport uma vez", como o Reveal), o efeito repete toda vez
  // que o cartão cruza a tela, na subida ou na descida.
  const mediaScale = useTransform(scrollYProgress, [0, 0.4], [1.15, 1]);
  const mediaBlurPx = useTransform(scrollYProgress, [0, 0.35], [6, 0]);
  const mediaFilter = useMotionTemplate`blur(${mediaBlurPx}px)`;

  // Resposta ao cursor: a mídia desliza alguns pontos percentuais na direção
  // do ponteiro dentro do cartão, em camada separada da do parallax de
  // scroll pra as duas não disputarem a mesma propriedade.
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springX = useSpring(tiltX, { stiffness: 150, damping: 20 });
  const springY = useSpring(tiltY, { stiffness: 150, damping: 20 });
  const mediaX = useTransform(springX, [-0.5, 0.5], ["-4%", "4%"]);
  const mediaY = useTransform(springY, [-0.5, 0.5], ["-4%", "4%"]);

  function onMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    tiltX.set((event.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((event.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    tiltX.set(0);
    tiltY.set(0);
  }

  const metric = caseStudy.metrics[0];

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      whileHover={{ scale: 1.015 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="group relative h-full w-full overflow-hidden bg-black"
    >
      <Link
        href={`/${locale}/work/${caseStudy.slug}/`}
        className="absolute inset-0 block"
      >
        <motion.div
          style={{ y: scrollY }}
          className="absolute inset-x-0 -top-[12%] h-[124%]"
        >
          <motion.div
            style={{
              x: mediaX,
              y: mediaY,
              scale: mediaScale,
              filter: mediaFilter,
            }}
            className="h-full w-full"
          >
            <MediaView
              media={caseStudy.cover}
              locale={locale}
              className="h-full w-full object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Véu para legibilidade do texto sobre qualquer mídia */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/40" />

        <div className="absolute inset-0 flex flex-col justify-between p-5 text-white sm:p-6">
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

          <div>
            <h3 className="type-display type-inktrap text-2xl leading-[0.95] sm:text-3xl lg:text-4xl">
              {caseStudy.title[locale]}
            </h3>
            <p className="type-mono mt-3 text-white/70">
              {caseStudy.tags[locale].join(" • ")}
            </p>
            <span className="type-mono mt-3 inline-block text-white underline-offset-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:underline">
              {caseStudy.comingSoon
                ? dict.cases.comingSoon
                : dict.cases.viewCase}
            </span>
          </div>
        </div>
      </Link>
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
  const hasIllustrative = cases.some((c) =>
    c.metrics.some((m) => m.illustrative),
  );

  return (
    <section id="work" className="section-y border-t border-line">
      <div className="gutter">
        <Reveal>
          <h2 className="type-mono mb-2">{dict.cases.title}</h2>
          <p className="mb-16 max-w-lg text-muted">{dict.cases.subtitle}</p>
        </Reveal>
      </div>

      {/* Sem gap e sem gutter: os cartões colam uns nos outros e vão até a
          borda da tela, a mesma leitura de "cinema" de antes, só que sem
          prender o scroll. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {cases.map((caseStudy, index) => {
          const bento = BENTO[index % BENTO.length];
          return (
            <Reveal
              key={caseStudy.slug}
              delay={index * 0.08}
              className={`${bento.col} ${bento.aspect}`}
            >
              <Card
                caseStudy={caseStudy}
                locale={locale}
                dict={dict}
                index={index}
              />
            </Reveal>
          );
        })}
      </div>

      {hasIllustrative && (
        <p className="gutter type-mono mt-8 text-muted">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </section>
  );
}
