"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useHydrated } from "@/lib/use-hydrated";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Tema e idioma: no desktop moram do lado direito do cabeçalho, junto da
// lua. O Modo Boring mora do outro lado (veja BoringToggle), separado
// porque é a funcionalidade de primeira classe da mesa de controle, e
// merece caixa própria em vez de disputar espaço com estes dois.

interface ControlBarProps {
  locale: Locale;
  dict: Dictionary;
}

export function ControlBar({ locale, dict }: ControlBarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  // Tema e preferências só existem no cliente. Antes de hidratar, os rótulos
  // mostram o estado padrão para não divergir do HTML gerado no build.
  const mounted = useHydrated();

  const switchLocalePath = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    return `/${target}${rest || "/"}`;
  };

  // Só texto: nada de moldura nem fundo. O estado ativo se resolve na cor.
  const buttonClass =
    "type-mono cursor-pointer text-muted hover:text-foreground transition-colors";

  return (
    <div className="no-print flex flex-wrap items-center gap-4">
      <button
        type="button"
        className={buttonClass}
        aria-label={dict.controls.theme}
        style={{ fontSize: "1.1rem" }}
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        {mounted && resolvedTheme === "dark" ? "☀" : "☾"}
      </button>

      <nav aria-label={dict.controls.language} className="flex gap-2">
        {locales.map((l) => (
          <Link
            key={l}
            href={switchLocalePath(l)}
            hrefLang={l}
            aria-current={l === locale ? "true" : undefined}
            className={`type-mono px-1 py-1.5 ${
              l === locale
                ? "text-foreground underline underline-offset-4"
                : "text-muted hover:text-foreground"
            }`}
            title={localeNames[l]}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </nav>
    </div>
  );
}
