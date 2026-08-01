"use client";

import { useState } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
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
   * Só a cópia do cabeçalho desktop deve oferecer o tooltip: a linha do
   * mobile nunca mostra, em momento algum, a caixa reduzida pré rolagem já
   * é aperto suficiente pra não sobrar espaço pra bolha.
   */
  showTooltip?: boolean;
  /**
   * Vira true quando é hora de fechar a tooltip sozinha, além do fechamento
   * por clique. No desktop é "passou da primeira dobra" (vindo de
   * SiteFrame): a tooltip fica fixa até a pessoa rolar a hero pra longe, em
   * vez de sumir num tempo fixo que pode não bater com o ritmo de leitura.
   */
  dismissTooltip?: boolean;
}

export function BoringToggle({
  dict,
  showTooltip = false,
  dismissTooltip = false,
}: BoringToggleProps) {
  const { isBoringMode, toggleBoringMode } = useBoringMode();
  const mounted = useHydrated();

  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  const tooltipVisible =
    showTooltip &&
    !tooltipDismissed &&
    !dismissTooltip &&
    !isBoringMode &&
    mounted;

  return (
    <div className="relative">
      <button
        type="button"
        className="type-mono cursor-pointer border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
        aria-pressed={isBoringMode}
        title={dict.controls.boringHint}
        onClick={() => {
          setTooltipDismissed(true);
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
