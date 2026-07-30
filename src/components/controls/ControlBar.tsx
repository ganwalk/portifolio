"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useSound } from "@/contexts/SoundContext";
import { useHydrated } from "@/lib/use-hydrated";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// A "mesa de controle" do site: Modo Boring, tema, som e idioma.
// Visível logo ao entrar, o toggle do Boring é uma funcionalidade de primeira
// classe, não um easter egg escondido no rodapé. É o único controle com caixa
// própria (contorno mesmo em repouso): os outros são só texto, mas o Boring
// merece se destacar, é a porta de saída do site inteiro para quem não quer
// nem ver uma animação.

interface ControlBarProps {
  locale: Locale;
  dict: Dictionary;
  /**
   * Só a cópia do cabeçalho desktop deve oferecer o tooltip: a de dentro do
   * menu mobile fica muda, porque abrir o menu já é a pessoa procurando os
   * controles, não precisa de mais um empurrão.
   */
  showTooltip?: boolean;
  /** Header visível (fora da primeira dobra): dispara a contagem do tooltip. */
  tooltipArmed?: boolean;
}

export function ControlBar({
  locale,
  dict,
  showTooltip = false,
  tooltipArmed = false,
}: ControlBarProps) {
  const { isBoringMode, toggleBoringMode } = useBoringMode();
  const { isSoundOn, toggleSound, play } = useSound();
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  // Tema e preferências só existem no cliente. Antes de hidratar, os rótulos
  // mostram o estado padrão para não divergir do HTML gerado no build.
  const mounted = useHydrated();

  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // O tooltip nasce quando o header aparece (tooltipArmed vira true) e some
  // sozinho depois de alguns segundos, ou assim que a pessoa entra no Boring
  // (a sugestão já foi seguida, não precisa insistir).
  useEffect(() => {
    if (!showTooltip || !tooltipArmed || tooltipDismissed) return;
    const timer = setTimeout(() => setTooltipDismissed(true), 4500);
    return () => clearTimeout(timer);
  }, [showTooltip, tooltipArmed, tooltipDismissed]);

  const tooltipVisible =
    showTooltip &&
    tooltipArmed &&
    !tooltipDismissed &&
    !isBoringMode &&
    mounted;

  const switchLocalePath = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    return `/${target}${rest || "/"}`;
  };

  // Só texto: nada de moldura nem fundo. O estado ativo se resolve na cor.
  const buttonClass =
    "type-mono cursor-pointer text-muted hover:text-foreground transition-colors";

  return (
    <div className="no-print flex flex-wrap items-center gap-4">
      <div className="relative">
        <button
          type="button"
          className="type-mono cursor-pointer rounded-md border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
          aria-pressed={isBoringMode}
          title={dict.controls.boringHint}
          onClick={() => {
            setTooltipDismissed(true);
            play("toggle");
            toggleBoringMode();
          }}
        >
          {mounted && isBoringMode
            ? dict.controls.boringOff
            : dict.controls.boringOn}
        </button>

        {tooltipVisible && (
          // Sem .type-mono aqui de propósito: aquela classe força
          // text-transform uppercase, e a graça da frase é o contraste entre
          // "eu" minúsculo e "ODEIO" maiúsculo. Fonte mono só no family.
          <div
            role="status"
            className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 w-max -translate-x-1/2 bg-foreground px-3 py-1.5 font-mono text-xs tracking-wide text-background"
          >
            <span
              aria-hidden
              className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground"
            />
            {dict.controls.boringTooltip}
          </div>
        )}
      </div>

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
                ? "text-foreground underline underline-offset-4"
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
