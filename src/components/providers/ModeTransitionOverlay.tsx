"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Cortina que cobre a tela por um instante ao alternar entre Modo Criativo e
// Modo Boring, e revela o novo modo por baixo, em vez do corte seco de uma
// troca instantânea de página inteira.
//
// Não é mais um fade plano de opacidade (lia como um simples pisca preto/
// branco): agora é um conjunto de réguas verticais, alternando a dobradiça
// entre topo e base, que fecham em leque da esquerda para a direita até
// cobrir a tela por completo, seguram um instante, e abrem no mesmo padrão
// para revelar o novo modo. Mais perto de uma cortina de verdade (ou do
// obturador de uma câmera) do que um crossfade.
//
// Não pode depender de CSS transition nem de Framer Motion: a regra global em
// globals.css que zera todo movimento quando `data-boring="true"` mata
// literalmente qualquer transition do documento inteiro no instante em que o
// atributo muda, incluindo indo PARA o Boring (é uma regra de CSS, então
// alcança qualquer elemento do DOM, não importa onde ele mora na árvore React
// nem se está dentro do MotionConfig). Por isso a cortina anima via
// requestAnimationFrame, escrevendo transform a cada quadro na mão: nenhuma
// regra de CSS intercepta uma mutação de estilo feita assim.
//
// Quem pediu menos movimento no sistema não vê a cortina, só a troca direta.

const STRIPE_COUNT = 8;
const STRIPE_MS = 200;
const STAGGER_MS = 26;
const HOLD_MS = 90;
const COVER_MS = STRIPE_MS + (STRIPE_COUNT - 1) * STAGGER_MS;
const REVEAL_MS = COVER_MS;
const TOTAL_MS = COVER_MS + HOLD_MS + REVEAL_MS;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

// Progresso (0 a 1) de uma régua num dado instante, considerando o atraso
// que a régua carrega por causa da posição dela na fileira.
function stripeProgress(elapsedInPhase: number, index: number): number {
  const local = elapsedInPhase - index * STAGGER_MS;
  if (local <= 0) return 0;
  if (local >= STRIPE_MS) return 1;
  return local / STRIPE_MS;
}

export function ModeTransitionOverlay() {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevRef = useRef(isBoringMode);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevRef.current === isBoringMode) return;
    prevRef.current = isBoringMode;

    const container = containerRef.current;
    const stripes = stripeRefs.current;
    if (!container || stripes.some((s) => !s)) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    // Reatribuído a uma const própria: dentro do closure de frame() o TS não
    // conserva o estreitamento de null feito acima, mesmo sendo const.
    const overlayEl = container;
    overlayEl.style.pointerEvents = "auto";

    function frame(now: number) {
      const elapsed = now - start;

      stripes.forEach((el, i) => {
        if (!el) return;
        let scale: number;

        if (elapsed < COVER_MS) {
          scale = easeOutCubic(stripeProgress(elapsed, i));
        } else if (elapsed < COVER_MS + HOLD_MS) {
          scale = 1;
        } else if (elapsed < TOTAL_MS) {
          const t = stripeProgress(elapsed - COVER_MS - HOLD_MS, i);
          scale = 1 - easeInCubic(t);
        } else {
          scale = 0;
        }

        el.style.transform = `scaleY(${scale})`;
      });

      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        overlayEl.style.pointerEvents = "none";
        rafRef.current = null;
      }
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isBoringMode]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] flex"
    >
      {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            stripeRefs.current[i] = el;
          }}
          className={`h-full flex-1 bg-foreground ${
            i % 2 === 0 ? "origin-top" : "origin-bottom"
          }`}
          // O repouso é "transform: scaleY(0)" via style inline, não a
          // utilitária scale-y-0 do Tailwind: aquela utilitária escreve na
          // propriedade CSS `scale`, separada de `transform`, e as duas se
          // compõem multiplicando uma pela outra na hora de renderizar. Como
          // o rAF só escreve em `transform`, um `scale-y-0` deixado para trás
          // travaria a régua em altura zero para sempre, não importa o que
          // `transform` diga.
          style={{ transform: "scaleY(0)" }}
        />
      ))}
    </div>
  );
}
