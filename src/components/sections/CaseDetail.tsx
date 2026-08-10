"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo da página de um case (/work/[slug]): antes era um bloco de texto
// só, sem nenhum movimento, um fim de linha reto demais depois do clique
// animado que leva até aqui (a pilha da home, o FLIP de ExpandedCase no
// desktop). Esta versão reaproveita a MESMA linguagem visual do painel
// expandido (capa em tela cheia com zoom lento, gradiente, título grande
// por cima) como o topo de verdade da página, não como uma segunda cópia:
// ExpandedCase mostra esse painel dentro do overlay antes de mandar pra cá,
// e chegar aqui pra ver o MESMO tratamento (não um texto plano) é o que
// fecha a transição, em vez de cortar seco pra uma página estática.
//
// Client component: framer-motion (zoom contínuo, useReducedMotion) e
// Reveal exigem isso; a página em si (page.tsx) continua Server Component,
// só delega o corpo pra cá.

export function CaseDetail({
  caseStudy,
  locale,
  dict,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <>
      <div className="relative h-svh w-full overflow-hidden bg-black">
        {/* Zoom lento e contínuo, igual ExpandedCase: a mídia nunca fica
            parada, mesmo antes de qualquer scroll. Sem guarda manual de
            reduceMotion aqui (o MotionConfig global, em Providers.tsx, já
            resolve pra quem pede menos movimento, mesmo padrão que
            ExpandedCase já usa). */}
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

        {/* Volta pra lista de projetos: sobre o painel, não antes dele, pra
            não quebrar a imersão do primeiro quadro com um link em texto
            plano antes de qualquer mídia aparecer. */}
        <Link
          href={`/${locale}/#work`}
          className="type-mono absolute left-5 top-5 z-10 text-white/80 transition-colors hover:text-white sm:left-8 sm:top-8"
        >
          ← {dict.nav.work}
        </Link>

        <div className="gutter absolute inset-x-0 bottom-10 text-white sm:bottom-16">
          <motion.p
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="type-mono mb-4 text-white/70"
          >
            {caseStudy.title[locale]} · {caseStudy.year}
          </motion.p>
          <motion.h1
            initial={{ y: 32, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            className="type-display type-inktrap pt-[0.16em] text-[11vw] leading-[0.92] sm:text-[6vw]"
          >
            {caseStudy.title[locale]}
          </motion.h1>
        </div>
      </div>

      <div className="gutter py-16 sm:py-20">
        <Reveal>
          <p className="type-serif-display max-w-3xl text-3xl sm:text-5xl">
            {caseStudy.statement[locale]}
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <CaseMetrics caseStudy={caseStudy} locale={locale} className="mt-12" />
        </Reveal>

        <Reveal delay={0.12}>
          <p className="type-mono mt-10 text-muted">
            {caseStudy.tags[locale].join(" • ")}
          </p>
        </Reveal>

        <Reveal
          delay={0.16}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <div className="texture-noise aspect-4/3 bg-surface" />
          <div className="texture-noise aspect-4/3 bg-surface" />
        </Reveal>

        {caseStudy.metrics.some((m) => m.illustrative) && (
          <p className="type-mono mt-8 text-muted">
            * {dict.cases.metricsDisclaimer}
          </p>
        )}
      </div>
    </>
  );
}
