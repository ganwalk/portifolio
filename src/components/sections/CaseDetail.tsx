"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { CaseStatement } from "@/components/ui/CaseStatement";
import { IntranetShowcase } from "@/components/ui/IntranetShowcase";
import { LandingPagesShowcase } from "@/components/ui/LandingPagesShowcase";
import { LiveEmbed } from "@/components/ui/LiveEmbed";
import { Reveal } from "@/components/ui/Reveal";
import { RepoLink } from "@/components/ui/RepoLink";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo da página de um case (/work/[slug]): vai direto ao título e à
// descrição, sem capa de vídeo/imagem no topo. A capa em tela cheia com
// zoom lento já apareceu no painel expandido (ExpandedCase, na home) que
// trouxe o visitante até aqui; repeti-la aqui só adiava o conteúdo de
// verdade (título, métricas, descrição) por uma tela inteira de rolagem
// sem nada de novo pra ler.
//
// As métricas moram na própria coluna da descrição (metricsSlot de
// CaseStatement), acima do texto, em vez de um bloco à parte mais abaixo:
// a coluna do título, sozinha, é bem mais curta que a da descrição; com as
// métricas encaixadas ali (numa versão menor, "compact"), as duas colunas
// fecham numa altura parecida em vez de uma sobrar vazia embaixo da outra.
//
// Client component: framer-motion (entrada do título) e Reveal exigem
// isso; a página em si (page.tsx) continua Server Component, só delega
// o corpo pra cá.

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
    <div className="gutter pb-16 pt-16 sm:pb-20 sm:pt-20">
      <Link
        href={`/${locale}/#work`}
        className="type-mono text-muted transition-colors hover:text-foreground"
      >
        ← {dict.nav.work}
      </Link>

      <motion.h1
        initial={{ y: 32, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="type-display type-inktrap mt-6 pt-[0.16em] text-[11vw] leading-[0.92] sm:text-[6vw]"
      >
        {caseStudy.title[locale]}
      </motion.h1>
      <Reveal className="mt-16">
        <CaseStatement
          caseStudy={caseStudy}
          locale={locale}
          metricsSlot={
            <CaseMetrics caseStudy={caseStudy} locale={locale} compact className="mb-8" />
          }
        />
      </Reveal>

      <Reveal delay={0.08}>
        <p className="type-mono mt-10 text-muted">
          {caseStudy.tags[locale].join(" • ")}
        </p>
      </Reveal>

      {caseStudy.slug === "intranet-auvp" && caseStudy.demoUrl ? (
        // No lugar do LiveEmbed genérico (que carregaria o Design System
        // inteiro num iframe): tokens de cor e dois componentes portados,
        // rodando nativamente aqui, sem imagem nem iframe (ver
        // IntranetShowcase.tsx).
        <IntranetShowcase
          locale={locale}
          demoUrl={caseStudy.demoUrl}
          className="mt-12"
        />
      ) : caseStudy.slug === "ecossistema-auvp" ? (
        // Sem demoUrl único (é uma coleção de páginas publicadas separadas,
        // não um produto): cada uma mora na própria simulação de janela de
        // navegador, com still e link direto (ver LandingPagesShowcase.tsx).
        <LandingPagesShowcase locale={locale} dict={dict} className="mt-12" />
      ) : caseStudy.demoUrl ? (
        <Reveal delay={0.12} className="mt-12">
          <LiveEmbed
            url={caseStudy.demoUrl}
            title={caseStudy.title[locale]}
            dict={dict}
          />
        </Reveal>
      ) : (
        <Reveal
          delay={0.12}
          className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2"
        >
          <div className="texture-noise aspect-4/3 bg-surface" />
          <div className="texture-noise aspect-4/3 bg-surface" />
        </Reveal>
      )}

      {caseStudy.repoUrl && (
        <Reveal delay={0.16} className="mt-12 flex justify-center">
          <RepoLink repoUrl={caseStudy.repoUrl} title={caseStudy.title[locale]} dict={dict} />
        </Reveal>
      )}

      {caseStudy.metrics.some((m) => m.illustrative) && (
        <p className="type-mono mt-8 text-muted">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </div>
  );
}
