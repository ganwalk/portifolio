"use client";

import { LocaleSwitcher } from "@/components/controls/LocaleSwitcher";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Idioma: no desktop mora do lado direito do cabeçalho, junto da lua (que
// hoje também é o seletor de tema, ver MoonPhase). O Modo Boring mora do
// outro lado (veja BoringToggle), separado porque é a funcionalidade de
// primeira classe da mesa de controle, e merece caixa própria em vez de
// disputar espaço com os demais.

interface ControlBarProps {
  locale: Locale;
  dict: Dictionary;
}

export function ControlBar({ locale, dict }: ControlBarProps) {
  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <LocaleSwitcher locale={locale} dict={dict} />
    </div>
  );
}
