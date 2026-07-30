"use client";

import { useEffect, useState } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useSound } from "@/contexts/SoundContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Dictionary } from "@/i18n/dictionaries";

// O interruptor do Modo Boring, isolado do resto da mesa de controle porque
// mora do outro lado do cabeçalho: no desktop fica à esquerda, junto do menu,
// enquanto tema, som e idioma (ControlBar) vivem à direita, junto da lua.
//
// É o único controle com caixa própria, quadrada (sem arredondar, como o
// resto do site): é a porta de saída da experiência inteira para quem não
// quer ver nem uma animação, merece se destacar dos demais, que são só texto.
//
// No mobile ele também existe flutuando num canto da tela (veja `floating`
// em SiteFrame): enfiado só dentro do menu hamburguer ele ficava visível
// demais escondido, e no Modo Criativo o cabeçalho some na primeira dobra,
// então nem ali estaria sempre à mão.

interface BoringToggleProps {
  dict: Dictionary;
  /**
   * Só uma cópia por breakpoint deve oferecer o tooltip, senão duas
   * bolhas nasceriam juntas quando as duas cópias (cabeçalho e flutuante)
   * estão montadas ao mesmo tempo, uma delas só escondida por CSS.
   */
  showTooltip?: boolean;
  /**
   * Versão compacta, presa a um canto da tela: caixa menor e a bolha do
   * tooltip nasce para cima (a caixa já mora perto da borda inferior).
   */
  floating?: boolean;
}

export function BoringToggle({
  dict,
  showTooltip = false,
  floating = false,
}: BoringToggleProps) {
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
    <div
      className={
        floating
          ? "no-print fixed bottom-4 right-4 z-40 lg:hidden"
          : "relative"
      }
    >
      <div className="relative">
        <button
          type="button"
          className={`type-mono cursor-pointer border border-line bg-background/90 backdrop-blur transition-colors hover:bg-foreground hover:text-background ${
            floating ? "px-2.5 py-1.5 text-xs shadow-sm" : "px-3 py-1.5"
          }`}
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
          //
          // A versão flutuante mora perto da borda inferior da tela, então a
          // bolha nasce para cima (bottom-full) em vez de para baixo, com a
          // setinha virada para completar o balão apontando para o botão.
          <div
            role="status"
            className={`pointer-events-none absolute left-1/2 z-50 w-max -translate-x-1/2 bg-foreground px-3 py-1.5 font-mono text-xs tracking-wide text-background ${
              floating ? "bottom-full mb-3" : "top-full mt-3"
            }`}
          >
            <span
              aria-hidden
              className={`absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-foreground ${
                floating ? "-bottom-1" : "-top-1"
              }`}
            />
            {dict.controls.boringTooltip}
          </div>
        )}
      </div>
    </div>
  );
}
