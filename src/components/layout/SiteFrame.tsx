"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BoringToggle } from "@/components/controls/BoringToggle";
import { ControlBar } from "@/components/controls/ControlBar";
import { SiteMenu } from "@/components/nav/SiteMenu";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Moldura comum a todas as páginas.
//
// O cabeçalho muda de arranjo com a largura, mantendo uma só ordem de DOM
// (menu+Boring, assinatura, tema/som/idioma+lua): no mobile é grid de três
// colunas, com a assinatura centralizada; no desktop vira flex e a assinatura
// vai para a frente da fila (order-first), com o segundo cluster empurrado
// para a direita. No mobile a mesa de controle (tema/som/idioma) mora dentro
// do menu; no desktop ela se divide nos dois clusters da própria barra. Ao
// rolar, a barra encorpa (fundo mais sólido) para não sumir sobre as mídias.
// Some por completo na impressão.
//
// O Modo Boring é o único controle com uma segunda linha própria no mobile:
// depois de passar por dentro do menu hamburguer (visível demais escondido)
// e por um botão flutuante solto num canto (achado estranho), a linha extra
// ficou sendo o meio termo, sempre visível sem competir por espaço com menu,
// assinatura e lua na primeira linha. No desktop essa segunda linha não
// existe, o botão já cabe folgado na primeira, junto do menu.
//
// No mobile, na home em Modo Criativo, o cabeçalho começa escondido: a hero
// ocupa a primeira dobra sozinha, sem chrome nenhum por cima, e a barra
// desliza para dentro assim que o scroll passa da altura da tela. No desktop
// o cabeçalho é sempre visível, em qualquer página e desde o primeiro pixel:
// lá o espaço sobra, esconder a barra só tira acesso sem ganhar nada em troca.
// Em Modo Boring, ou fora da home, o cabeçalho também é sempre visível, em
// qualquer largura: sem hero para esconder atrás, e o botão de voltar ao
// criativo precisa estar sempre à mão.
//
// Na home em Modo Criativo o cabeçalho é `fixed`, não `sticky`: um elemento
// sticky reserva a própria altura no fluxo do documento mesmo escondido via
// opacity/transform (são propriedades visuais, não afetam layout), o que
// deixava uma tarja vazia no topo do mobile antes da hero aparecer. Fixed
// nunca reserva espaço, então a hero pode ocupar a tela inteira (100svh) e o
// cabeçalho simplesmente flutua por cima quando decide aparecer. Fora da
// home (ou em Boring), continua sticky: essas páginas não têm hero e sempre
// dependeram do cabeçalho empurrando o conteúdo para baixo.

export function SiteFrame({
  children,
  locale,
  dict,
}: {
  children: ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const { isBoringMode } = useBoringMode();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [pastFirstFold, setPastFirstFold] = useState(false);

  const isHomeHero =
    !isBoringMode && (pathname === `/${locale}` || pathname === `/${locale}/`);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setPastFirstFold(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerVisible = !isHomeHero || pastFirstFold;

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="type-mono no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {dict.nav.skipToContent}
      </a>

      <header
        className={`no-print ${isHomeHero ? "fixed" : "sticky"} top-0 z-40 flex w-full flex-col border-b border-line backdrop-blur transition-all duration-300 ${
          scrolled ? "bg-background/95" : "bg-background/85"
        } ${
          headerVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        } lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto`}
      >
        <div
          className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-6 transition-all duration-300 sm:px-12 lg:flex lg:gap-8 xl:px-20 ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
          <div className="flex items-center gap-4 justify-self-start">
            <SiteMenu locale={locale} dict={dict} />
            <div className={isBoringMode ? "flex" : "hidden lg:flex"}>
              <BoringToggle dict={dict} showTooltip />
            </div>
          </div>

          <Link
            href={`/${locale}/`}
            className="type-mono justify-self-center whitespace-nowrap font-bold lg:order-first"
          >
            {profile.name}
          </Link>

          <div className="flex items-center gap-4 justify-self-end lg:ml-auto">
            <div className="hidden lg:flex">
              <ControlBar locale={locale} dict={dict} />
            </div>
            <MoonPhase className="h-5 w-5" />
          </div>
        </div>

        {/* Segunda linha, só no mobile e fora do Modo Boring (que já mostra
            o botão na primeira linha, veja acima). */}
        {!isBoringMode && (
          <div className="flex justify-center border-t border-line px-6 py-2 lg:hidden">
            <BoringToggle dict={dict} showTooltip />
          </div>
        )}
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-14 sm:px-12 xl:px-20">
        <p className="type-mono text-muted">{dict.footer.rights}</p>
        <p className="type-mono text-muted">
          {new Date().getFullYear()} · {profile.name}
        </p>
      </footer>
    </div>
  );
}
