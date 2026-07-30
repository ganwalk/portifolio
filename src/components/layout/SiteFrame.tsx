"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
// (menu, assinatura, lua): no mobile é grid de três colunas, com a assinatura
// centralizada e a lua do outro lado; no desktop virá flex e a assinatura vai
// para a frente da fila (order-first), com a lua empurrada para a direita.
// A mesa de controle mora na barra no desktop e dentro do menu no mobile.
// Ao rolar, a barra encorpa (fundo mais sólido) para não sumir sobre as
// mídias. Some por completo na impressão.
//
// Na home em Modo Criativo, o cabeçalho começa escondido: a hero ocupa a
// primeira dobra sozinha, sem chrome nenhum por cima, e a barra desliza para
// dentro assim que o scroll passa da altura da tela. Em qualquer outra
// página, ou já em Modo Boring (onde não existe hero para esconder atrás, e
// o botão de voltar ao criativo precisa estar sempre à mão), o cabeçalho
// segue visível desde o primeiro pixel, como sempre foi.

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
        className={`no-print sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-6 backdrop-blur transition-all duration-300 sm:px-12 lg:flex lg:gap-8 xl:px-20 ${
          scrolled ? "bg-background/95 py-2" : "bg-background/85 py-3"
        } ${
          headerVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        }`}
      >
        <div className="flex items-center gap-4 justify-self-start">
          <SiteMenu locale={locale} dict={dict} />
          <div className={isBoringMode ? "flex" : "hidden lg:flex"}>
            <ControlBar
              locale={locale}
              dict={dict}
              showTooltip
              tooltipArmed={headerVisible}
            />
          </div>
        </div>

        <Link
          href={`/${locale}/`}
          className="type-mono justify-self-center whitespace-nowrap font-bold lg:order-first"
        >
          {profile.name}
        </Link>

        <div className="justify-self-end lg:ml-auto">
          <MoonPhase className="h-5 w-5" />
        </div>
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
