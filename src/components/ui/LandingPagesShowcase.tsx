"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Reveal } from "./Reveal";
import { landingPages, type LandingPage } from "@/data/landingPages";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case de Landing Pages: cada página real do ecossistema mora
// numa simulação de janela de navegador (barra de endereço, still da
// própria página) com link direto pra abrir ela de verdade, em vez do
// LiveEmbed genérico (não existe um `demoUrl` único aqui, é uma coleção de
// páginas publicadas separadamente, ver landingPages.ts) ou das duas caixas
// vazias que o resto dos cases sem mídia própria usa.
//
// A janela de navegador (barra de endereço, três pontos monocromáticos)
// já nasceu adaptada à identidade do site: nada do vermelho/amarelo/verde
// costumeiro do macOS nem do cinza padrão do Windows, mesmo critério de
// cor do resto do site (ver cases.ts: "colorido sim, saturado não"). A
// técnica de rolagem do still (abaixo) é que é nova, copiada da própria
// Central do Time de Produto AUVP (produtosauvp/central, público,
// src/pages/Hub.tsx, componente ProdutoCard, seção "Soluções Digitais"):
// mesma janela de altura fixa, mesma imagem sem crop, mesma velocidade
// constante de rolagem.

const heading: Localized = {
  pt: "SITES E LPs",
  en: "Landing pages",
  es: "Landing pages",
  zh: "落地页",
};

const intro: Localized = {
  pt: "Cada card abaixo é uma página publicada de verdade: o still é a captura real dela, e o link abre a própria página em nova aba, não uma cópia.",
  en: "Every card below is a genuinely published page: the still is a real capture of it, and the link opens the page itself in a new tab, not a copy.",
  es: "Cada tarjeta abajo es una página publicada de verdad: la captura es real, y el enlace abre la propia página en una nueva pestaña, no una copia.",
  zh: "下面每张卡片都是真正发布的页面：截图是真实抓取的，链接会在新标签页打开页面本身，而非副本。",
};

const emptyState: Localized = {
  pt: "As landing pages aparecem aqui assim que forem publicadas e linkadas.",
  en: "The landing pages show up here as soon as they are published and linked.",
  es: "Las landing pages aparecen aquí en cuanto sean publicadas y enlazadas.",
  zh: "落地页一旦发布并链接后就会显示在这里。",
};

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Velocidade constante do preview em px/s: mesmo valor da Central (ver
// comentário no topo do arquivo), a razão de páginas compridas e curtas
// rolarem no MESMO ritmo, só o tempo total de cada uma que muda.
const LP_SCROLL_SPEED = 45;

function LandingPageCard({
  page,
  locale,
  dict,
}: {
  page: LandingPage;
  locale: Locale;
  dict: Dictionary;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLAnchorElement>(null);
  const [hovered, setHovered] = useState(false);
  const [scroll, setScroll] = useState({ dist: 0, dur: 0 });
  const reduceMotion = useReducedMotion();

  // A distância a rolar é a altura de VERDADE da imagem renderizada menos
  // a janela fixa do quadro, medida no instante do hover: a imagem entra
  // no tamanho natural dela (sem crop, sem aspect-ratio forçado), então
  // uma LP mais comprida rola mais, sem precisar guardar essa medida no
  // dado.
  const measure = useCallback(() => {
    const img = imgRef.current;
    const frame = frameRef.current;
    if (!img || !frame) return;
    const dist = Math.max(img.clientHeight - frame.clientHeight, 0);
    setScroll({ dist, dur: dist / LP_SCROLL_SPEED });
  }, []);

  const scrolling = hovered && !reduceMotion;

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Barra de janela de navegador: três pontos monocromáticos (não o
          vermelho/amarelo/verde costumeiro do macOS), pra seguir o mesmo
          critério de cor do resto do site (ver cases.ts: "colorido sim,
          saturado não"). */}
      <div className="flex items-center gap-3 border-b border-line bg-background px-3 py-2.5">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
        </div>
        <span className="type-mono min-w-0 flex-1 truncate rounded-full bg-surface px-3 py-1 text-center text-[11px] text-muted">
          {hostnameOf(page.url)}
        </span>
      </div>
      <a
        ref={frameRef}
        href={page.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={page.title[locale]}
        onMouseEnter={() => {
          measure();
          setHovered(true);
        }}
        onMouseLeave={() => setHovered(false)}
        className="relative block h-64 overflow-hidden bg-background sm:h-72"
      >
        {/* Sem crop nem aspect-video: a imagem é o still da página
            INTEIRA, tamanho natural, e o quadro é só uma janela fixa por
            cima. Parada, mostra só o topo, o mesmo enquadramento de
            sempre; no hover ela sobe até o fim medido de verdade contra a
            própria altura renderizada, e volta suavemente ao soltar o
            mouse (mesma curva do resto do site, não um corte seco). Sem
            cursor de verdade (toque, ou quem pede menos movimento no
            sistema) o hover nunca dispara, e a página fica só no topo,
            sem tentar simular o gesto por outro caminho. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={page.image}
          alt={page.title[locale]}
          loading="lazy"
          onLoad={measure}
          className="h-auto w-full will-change-transform"
          style={{
            transform: scrolling ? `translateY(-${scroll.dist}px)` : "translateY(0)",
            transition: scrolling
              ? `transform ${scroll.dur}s linear`
              : "transform 0.7s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        />
      </a>
      <div className="border-t border-line p-4">
        <p className="text-sm font-bold">{page.title[locale]}</p>
        {/* Só aparece quando a LP é de outro projeto (ver `client` em
            landingPages.ts): o case em si é da AUVP, então uma LP sem
            `client` continua lida como dela, sem rótulo extra nenhum. */}
        {page.client && (
          <p className="type-mono mt-0.5 text-[11px] text-muted/70">{page.client[locale]}</p>
        )}
        <p className="mt-1 text-xs text-muted">{page.description[locale]}</p>
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          className="type-mono mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-foreground"
        >
          {dict.cases.openDemo}
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
  );
}

export function LandingPagesShowcase({
  locale,
  dict,
  className = "",
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        {/* .type-mono força text-transform: uppercase (ver globals.css) no
            elemento inteiro, herdado por qualquer filho, então escrever
            "LPs" com "s" minúsculo na string não bastava: o CSS
            reescrevia pra "LPS" de qualquer jeito. Só em pt: o próprio "s"
            precisa da PRÓPRIA declaração de text-transform (lowercase,
            utilitário do Tailwind), que vence a herdada do pai por
            especificidade normal de CSS, não por estar mais próxima do
            texto. */}
        <p className="type-mono text-muted">
          {locale === "pt" ? (
            <>
              SITES E LP<span className="lowercase">s</span>
            </>
          ) : (
            heading[locale]
          )}
        </p>
        <p className="mt-3 text-lg text-muted">{intro[locale]}</p>
      </Reveal>

      {landingPages.length === 0 ? (
        <Reveal delay={0.06} className="mt-6">
          <p className="type-mono border border-dashed border-line p-6 text-center text-muted">
            {emptyState[locale]}
          </p>
        </Reveal>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {landingPages.map((page, i) => (
            <Reveal key={page.url} delay={0.04 * i}>
              <LandingPageCard page={page} locale={locale} dict={dict} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
