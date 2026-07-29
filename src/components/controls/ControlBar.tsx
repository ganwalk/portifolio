"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useSound } from "@/contexts/SoundContext";
import { useHydrated } from "@/lib/use-hydrated";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// A "mesa de controle" do site: Modo Boring, tema, som e idioma.
// Visível logo ao entrar, o toggle do Boring é uma funcionalidade de primeira
// classe, não um easter egg escondido no rodapé.

interface ControlBarProps {
  locale: Locale;
  dict: Dictionary;
}

export function ControlBar({ locale, dict }: ControlBarProps) {
  const { isBoringMode, toggleBoringMode } = useBoringMode();
  const { isSoundOn, toggleSound, play } = useSound();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  // Tema e preferências só existem no cliente. Antes de hidratar, os rótulos
  // mostram o estado padrão para não divergir do HTML gerado no build.
  const mounted = useHydrated();

  const switchLocalePath = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    return `/${target}${rest || "/"}`;
  };

  const buttonClass =
    "btn-tactile type-mono cursor-pointer rounded-md border border-line px-3 py-1.5 hover:bg-foreground hover:text-background transition-colors";

  return (
    <div className="no-print flex flex-wrap items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        aria-pressed={isBoringMode}
        title={dict.controls.boringHint}
        onClick={() => {
          play("toggle");
          toggleBoringMode();
        }}
      >
        {mounted && isBoringMode
          ? dict.controls.boringOff
          : dict.controls.boringOn}
      </button>

      <button
        type="button"
        className={buttonClass}
        aria-label={dict.controls.theme}
        onClick={() => {
          play("toggle");
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        }}
      >
        {mounted && resolvedTheme === "dark" ? "☀" : "☾"}
      </button>

      {!isBoringMode && (
        <button
          type="button"
          className={buttonClass}
          aria-pressed={isSoundOn}
          aria-label={dict.controls.sound}
          onClick={() => {
            toggleSound();
            play("confirm");
          }}
        >
          {mounted && isSoundOn ? "♪ on" : "♪ off"}
        </button>
      )}

      <nav aria-label={dict.controls.language} className="flex gap-2">
        {locales.map((l) => (
          <Link
            key={l}
            href={switchLocalePath(l)}
            hrefLang={l}
            aria-current={l === locale ? "true" : undefined}
            className={`type-mono px-1 py-1.5 ${
              l === locale
                ? "text-accent underline underline-offset-4"
                : "text-muted hover:text-foreground"
            }`}
            title={localeNames[l]}
            onClick={() => play("tick")}
          >
            {l.toUpperCase()}
          </Link>
        ))}
      </nav>
    </div>
  );
}
