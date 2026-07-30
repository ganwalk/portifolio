"use client";

import { useEffect, useState } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useSound } from "@/contexts/SoundContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Dictionary } from "@/i18n/dictionaries";

// O interruptor do Modo Boring, isolado do resto da mesa de controle porque
// mora do outro lado do cabeçalho: no desktop fica à esquerda, junto do menu,
// enquanto tema, som e idioma (ControlBar) vivem à direita, junto da lua. No
// mobile ganha uma segunda linha só dele no cabeçalho (veja SiteFrame), em
// vez de ficar escondido dentro do menu hamburguer ou flutuando solto num
// canto da tela (as duas versões já tentadas antes desta).
//
// É o único controle com caixa própria, quadrada (sem arredondar, como o
// resto do site): é a porta de saída da experiência inteira para quem não
// quer ver nem uma animação, merece se destacar dos demais, que são só texto.

interface BoringToggleProps {
  dict: Dictionary;
  /**
   * Só a cópia do cabeçalho desktop deve oferecer o tooltip: a de dentro do
   * menu mobile fica muda, porque abrir o menu já é a pessoa procurando os
   * controles, não precisa de mais um empurrão.
   */
  showTooltip?: boolean;
}

export function BoringToggle({ dict, showTooltip = false }: BoringToggleProps) {
  const { isBoringMode, toggleBoringMode } = useBoringMode();
  const { play } = useSound();
  const mounted = useHydrated();

  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // No desktop o cabeçalho está sempre visível, então o tooltip nasce logo
  // que a página assenta, e some sozinho depois de alguns segundos, ou assim
  // que a pessoa entra no Boring (a sugestão já foi seguida).
  useEffect(() => {
    if (!showTooltip || tooltipDismissed) return;
    const timer = setTimeout(() => setTooltipDismissed(true), 4500);
    return () => clearTimeout(timer);
  }, [showTooltip, tooltipDismissed]);

  const tooltipVisible =
    showTooltip && !tooltipDismissed && !isBoringMode && mounted;

  return (
    <div className="relative">
      <button
        type="button"
        className="type-mono cursor-pointer border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
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
  );
}
