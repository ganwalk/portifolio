"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { ControlBar } from "@/components/controls/ControlBar";
import { SiteMenu } from "@/components/nav/SiteMenu";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Moldura comum a todas as páginas. O cabeçalho é um grid de três colunas:
// menu à esquerda, assinatura centralizada, lua do outro lado. No mobile a
// mesa de controle sai da barra e mora dentro do menu overlay; no desktop
// fica ao lado do menu. Ao rolar, a barra encorpa (fundo mais sólido e sombra)
// para não sumir sobre as mídias. Some por completo na impressão.

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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="type-mono no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {dict.nav.skipToContent}
      </a>

      <header
        className={`no-print sticky top-0 z-40 grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-line px-4 backdrop-blur transition-all duration-300 sm:px-8 ${
          scrolled
            ? "bg-background/95 py-2 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
            : "bg-background/85 py-3"
        }`}
      >
        <div className="flex items-center gap-2 justify-self-start">
          <SiteMenu locale={locale} dict={dict} />
          <div className={isBoringMode ? "flex" : "hidden lg:flex"}>
            <ControlBar locale={locale} dict={dict} />
          </div>
        </div>

        <Link
          href={`/${locale}/`}
          className="type-mono justify-self-center whitespace-nowrap font-bold"
        >
          {profile.name}
        </Link>

        <div className="justify-self-end">
          <MoonPhase className="h-5 w-5" />
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-line px-4 py-8 sm:px-8">
        <p className="type-mono text-muted">{dict.footer.rights}</p>
        <p className="type-mono text-muted">
          {new Date().getFullYear()} · {profile.name}
        </p>
      </footer>
    </div>
  );
}
