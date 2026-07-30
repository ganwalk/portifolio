"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Cortina que cobre a tela por um instante ao alternar entre Modo Criativo e
// Modo Boring, e revela o novo modo por baixo, em vez do corte seco de uma
// troca instantânea de página inteira.
//
// Não pode depender de CSS transition nem de Framer Motion: a regra global em
// globals.css que zera todo movimento quando `data-boring="true"` mata
// literalmente qualquer transition do documento inteiro no instante em que o
// atributo muda, incluindo indo PARA o Boring (é uma regra de CSS, então
// alcança qualquer elemento do DOM, não importa onde ele mora na árvore React
// nem se está dentro do MotionConfig). Por isso a cortina anima via
// requestAnimationFrame, escrevendo opacity a cada quadro na mão: nenhuma
// regra de CSS intercepta uma mutação de estilo feita assim.
//
// Quem pediu menos movimento no sistema não vê a cortina, só a troca direta.

const COVER_MS = 220;
const HOLD_MS = 90;
const REVEAL_MS = 320;
const TOTAL_MS = COVER_MS + HOLD_MS + REVEAL_MS;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function ModeTransitionOverlay() {
  const { isBoringMode } = useBoringMode();
  const elRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef(isBoringMode);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (prevRef.current === isBoringMode) return;
    prevRef.current = isBoringMode;

    const el = elRef.current;
    if (!el) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    el.style.pointerEvents = "auto";

    function frame(now: number) {
      const elapsed = now - start;
      let opacity: number;

      if (elapsed < COVER_MS) {
        opacity = easeOutCubic(elapsed / COVER_MS);
      } else if (elapsed < COVER_MS + HOLD_MS) {
        opacity = 1;
      } else if (elapsed < TOTAL_MS) {
        const t = (elapsed - COVER_MS - HOLD_MS) / REVEAL_MS;
        opacity = 1 - easeOutCubic(t);
      } else {
        opacity = 0;
      }

      if (el) el.style.opacity = String(opacity);

      if (elapsed < TOTAL_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        if (el) el.style.pointerEvents = "none";
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
      ref={elRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[100] bg-foreground opacity-0"
    />
  );
}
