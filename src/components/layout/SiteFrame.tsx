"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ControlBar } from "@/components/controls/ControlBar";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Moldura comum a todas as páginas: assinatura, mesa de controle, rodapé.
// A barra fica fixa no topo em posição flutuante, dando a sensação de software
// e não de página, e some por completo na impressão.

export function SiteFrame({
  children,
  locale,
  dict,
}: {
  children: ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="type-mono no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {dict.nav.skipToContent}
      </a>

      <header className="no-print sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-background/85 px-4 py-3 backdrop-blur sm:px-8">
        <Link href={`/${locale}/`} className="type-mono font-bold">
          {profile.name}
        </Link>
        <ControlBar locale={locale} dict={dict} />
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
