"use client";

import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
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
// DesignTokens.tsx, removidos). Depois disso vieram, nessa ordem, um
// quadro estático com still do vídeo de capa, um bloco de texto com
// prompt pronto pra IA e um quadro que ciclava só os NOMES das categorias
// (histórico removido a cada vez, pedido explícito): a última rodada
// pediu partes DE VERDADE da Intranet, embutidas, não uma representação
// abstrata. Agora esse lugar é o índice de acesso (abrir o site ao vivo,
// ir direto pro repositório) mais um quadro com o site publicado de
// verdade embutido (ver EmbeddedCycler abaixo), que cicla sozinho pelas
// 26 partes documentadas, rolando até cada seção real dentro do mesmo
// iframe (sem recarregar a cada troca). O índice completo mora logo
// abaixo (Catalog.tsx), mesma lista, mesma ordem.

const CYCLE_MS = 3800;

// As 26 partes documentadas, achatadas numa lista só na mesma ordem do
// índice abaixo: o quadro cicla por elas em sequência, uma de cada vez.
const CYCLE_ITEMS = catalogGroups.flatMap((group) => group.items);

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

function EmbeddedCycler() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % CYCLE_ITEMS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [reduceMotion]);

  // Só funciona quando o iframe é MESMA ORIGEM que a página que o embute
  // (ganwalk.github.io serve tanto o portfólio quanto a Intranet, ver
  // dezert-horse-cleanup.ts pro mesmo raciocínio aplicado lá). Em
  // desenvolvimento local (localhost embutindo o site publicado) isso NÃO
  // vale, contentDocument lança SecurityError: o catch cobre esse caso,
  // caindo pro iframe mostrando a própria home do Design System como
  // carregou, sem esconder nada nem rolar sozinho.
  function handleLoad() {
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      if (doc) {
        const style = doc.createElement("style");
        // Header fixo e a sidebar de navegação (nav logo antes do <main>,
        // ver DesignSystem.tsx no repositório da Intranet) escondidos:
        // sem os dois, cada seção começa já no topo do próprio quadro, sem
        // precisar compensar a altura do header no cálculo da rolagem.
        // Duas regras separadas, não uma lista só: se :has() não for
        // suportado, só a regra da sidebar falha, o header some do mesmo
        // jeito.
        style.textContent = "header { display: none !important; } nav:has(+ main) { display: none !important; }";
        doc.head.appendChild(style);
      }
    } catch {
      // Cross-origin: segue sem limpar nada.
    } finally {
      setReady(true);
    }
  }

  useEffect(() => {
    if (!ready) return;
    const iframe = iframeRef.current;
    try {
      const doc = iframe?.contentDocument;
      const id = CYCLE_ITEMS[index].path.split("#")[1];
      const el = id ? doc?.getElementById(id) : null;
      el?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    } catch {
      // Cross-origin: sem como rolar, o iframe fica parado onde carregou.
    }
  }, [index, ready, reduceMotion]);

  const current = CYCLE_ITEMS[index];
  const Icon = current.icon;

  return (
    <a
      href={`${INTRANET_ORIGIN}${current.path}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={current.name}
      className="relative block aspect-[1440/900] overflow-hidden bg-background"
    >
      <iframe
        ref={iframeRef}
        src={`${INTRANET_ORIGIN}${CYCLE_ITEMS[0].path}`}
        title="Design System"
        tabIndex={-1}
        aria-hidden
        loading="lazy"
        onLoad={handleLoad}
        className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ border: 0, opacity: ready ? 1 : 0 }}
      />
      <div className="pointer-events-none absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-line bg-surface/90 px-3 py-1.5 backdrop-blur-sm">
        <Icon className="h-3.5 w-3.5 text-muted" strokeWidth={1.5} />
        <span className="type-mono text-xs">{current.name}</span>
      </div>
    </a>
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

          <EmbeddedCycler />
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
