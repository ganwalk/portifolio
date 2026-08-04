"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Dictionary } from "@/i18n/dictionaries";

const ROTATE_MS = 3200;

// O interruptor do Modo Boring, isolado do resto da mesa de controle porque
// mora do outro lado do cabeçalho: no desktop fica à esquerda, junto do menu,
// enquanto tema, som e idioma (ControlBar) vivem à direita, junto da lua. No
// mobile aparece em dois lugares, nunca ao mesmo tempo: numa segunda linha
// só dele no cabeçalho enquanto a hero está na tela (veja SiteFrame) e,
// depois disso, dentro do menu, ao lado de tema e idioma (veja SiteMenu).
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
  /**
   * Chamado logo depois de alternar o modo. Existe para a cópia que mora
   * dentro do menu (SiteMenu), que precisa fechar o overlay no mesmo clique:
   * entrar em Modo Boring faz o menu inteiro parar de renderizar, mas parar
   * de renderizar não desmonta o componente, então a limpeza que devolve a
   * rolagem ao documento só acontece se o menu for fechado de propósito.
   */
  onToggle?: () => void;
}

export function BoringToggle({
  dict,
  showTooltip = false,
  dismissTooltip = false,
  onToggle,
}: BoringToggleProps) {
  const { isBoringMode, toggleBoringMode } = useBoringMode();
  const mounted = useHydrated();

  const [tooltipDismissed, setTooltipDismissed] = useState(false);

  // O rótulo alterna entre duas descrições da mesma ação ("vá direto ao
  // ponto" e "veja meu currículo", o Modo Boring é as duas coisas ao mesmo
  // tempo). Relógio próprio, não o mesmo de subscribeRouletteTick (Hero):
  // este botão mora no cabeçalho, presente em toda página, não só na home,
  // não faz sentido girar em sincronia com o retrato da hero.
  const onLabels = dict.controls.boringOn;
  const [labelIndex, setLabelIndex] = useState(0);

  useEffect(() => {
    if (isBoringMode || onLabels.length <= 1) return;
    const interval = window.setInterval(() => {
      setLabelIndex((i) => (i + 1) % onLabels.length);
    }, ROTATE_MS);
    return () => window.clearInterval(interval);
  }, [isBoringMode, onLabels.length]);

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
        className="type-mono relative inline-grid cursor-pointer overflow-hidden border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
        aria-pressed={isBoringMode}
        title={dict.controls.boringHint}
        onClick={() => {
          setTooltipDismissed(true);
          toggleBoringMode();
          onToggle?.();
        }}
      >
        {/* Todo rótulo possível empilhado, invisível, na mesma célula do
            grid: é o próprio motor de layout do navegador, que já sabe a
            largura real de cada string nesta fonte, quem decide a largura
            reservada da caixa (contar caracteres erra sempre que a fonte
            não é monoespaçada, mesmo raciocínio do SubtitleRoulette). Sem
            isso, o botão mudaria de tamanho a cada troca de rótulo. */}
        {[...onLabels, dict.controls.boringOff].map((label) => (
          <span
            key={label}
            aria-hidden
            className="invisible col-start-1 row-start-1 whitespace-nowrap"
          >
            {label}
          </span>
        ))}
        <AnimatePresence initial={false} mode="wait">
          <motion.span
            key={mounted && isBoringMode ? dict.controls.boringOff : onLabels[labelIndex]}
            className="col-start-1 row-start-1 whitespace-nowrap"
            initial={{ y: "40%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-40%", opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {mounted && isBoringMode ? dict.controls.boringOff : onLabels[labelIndex]}
          </motion.span>
        </AnimatePresence>
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
