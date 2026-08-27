"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";
import { RepoLink } from "./RepoLink";
import { Catalog } from "./intranet/Catalog";
import { catalogGroups, INTRANET_ORIGIN } from "./intranet/catalog";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet. Já teve uma bento inteira aqui (tokens de cor
// e seis componentes do Design System portados de verdade, código real
// rodando nativamente, sem imagem nem iframe): pedido explícito pra
// simplificar, a página nunca ficou satisfatória com tanto tratamento
// especial competindo entre si (ver histórico de BentoCard.tsx e
// DesignTokens.tsx, removidos). Depois disso, um quadro estático com o
// still do vídeo de capa (intranet-preview.webp) ocupou o lugar por um
// tempo, e depois dele, um bloco de texto com prompt pronto pra IA
// (histórico também removido: pedido explícito pra trocar por algo mais
// visual e dinâmico). Agora esse lugar é o índice de acesso (abrir o site
// ao vivo, ir direto pro repositório) mais um quadro que cicla sozinho
// pelas categorias do Design System, com os itens de cada categoria
// surgindo em cascata a cada troca (ver CategoryCycler abaixo). A versão
// viva do site continua um clique de distância, e o índice completo das
// 26 partes documentadas mora logo abaixo (Catalog.tsx).

const CYCLE_MS = 4200;
const MAX_ITEMS_PER_CATEGORY = 6;

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

function CategoryCycler() {
  const [index, setIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % catalogGroups.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  const group = catalogGroups[index];
  const items = group.items.slice(0, MAX_ITEMS_PER_CATEGORY);

  return (
    <div className="relative flex aspect-[1440/900] flex-col justify-center overflow-hidden px-6 py-8 sm:px-12 sm:py-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={group.label}
          initial={reduceMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <p className="type-mono text-muted">{group.label}</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.a
                  key={item.name}
                  href={`${INTRANET_ORIGIN}${item.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: reduceMotion ? 0 : i * 0.07,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group flex items-center gap-2.5 rounded-xl border border-line bg-background px-3.5 py-3 transition-colors hover:bg-surface"
                >
                  <Icon
                    className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-foreground"
                    strokeWidth={1.5}
                  />
                  <span className="truncate text-sm">{item.name}</span>
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bolinhas de qual categoria está ativa no ciclo, mesmo tratamento
          dos pontos de slide do trio de cases (ver CasesGrid.tsx): a ativa
          cresce (scale 1.4) em vez de mudar de cor sozinha. */}
      <div className="absolute bottom-5 right-6 flex gap-1.5 sm:right-8">
        {catalogGroups.map((g, i) => (
          <motion.span
            key={g.label}
            animate={{ scale: i === index ? 1.4 : 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-foreground" : "bg-line"}`}
          />
        ))}
      </div>
    </div>
  );
}

export function IntranetShowcase({
  locale,
  demoUrl,
  repoUrl,
  title,
  dict,
  className = "",
}: {
  locale: Locale;
  demoUrl: string;
  repoUrl: string;
  title: string;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-6 border-b border-line px-6 py-5 sm:px-8 sm:py-6">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-mono inline-flex items-center gap-2 text-foreground transition-colors hover:text-muted"
            >
              {dict.cases.openDemo}
              <span aria-hidden>↗</span>
            </a>
            <RepoLink repoUrl={repoUrl} title={title} dict={dict} />
          </div>

          <CategoryCycler />
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-14">
        <p className="type-mono text-muted">{catalogHeading[locale]}</p>
        <div className="mt-3">
          <Catalog locale={locale} />
        </div>
      </Reveal>
    </div>
  );
}
