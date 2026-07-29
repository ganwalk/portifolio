"use client";

import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";

// A lua ao lado da assinatura: atravessa as fases conforme o scroll da página.
// CYCLES define quantas lunações completas cabem do topo ao fim; mais de uma,
// senão a mudança fica lenta demais para ser percebida.
// A fase é desenhada direto no atributo d via motion value, sem re-render por
// frame de scroll. No Modo Boring o ícone não existe.

const CYCLES = 3;
// Fase inicial: crescente côncava, para o ícone já nascer visível no topo.
const START = 0.18;
const R = 9;
const CENTER = 10;

// f em [0,1): 0 é lua nova, 0.5 cheia, 1 nova de novo. A parte iluminada é a
// interseção entre o semicírculo do lado aceso e a elipse do terminador.
function moonPath(f: number): string {
  const k = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(k) * R;
  const waxing = f < 0.5;
  const side = waxing ? 1 : 0;
  const bulge = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  const top = CENTER - R;
  const bottom = CENTER + R;
  return [
    `M ${CENTER} ${top}`,
    `A ${R} ${R} 0 0 ${side} ${CENTER} ${bottom}`,
    `A ${rx} ${R} 0 0 ${bulge} ${CENTER} ${top}`,
    "Z",
  ].join(" ");
}

export function MoonPhase({ className = "" }: { className?: string }) {
  const { isBoringMode } = useBoringMode();
  const pathRef = useRef<SVGPathElement>(null);
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    pathRef.current?.setAttribute(
      "d",
      moonPath((START + progress * CYCLES) % 1),
    );
  });

  if (isBoringMode) return null;

  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <circle
        cx={CENTER}
        cy={CENTER}
        r={R}
        className="fill-transparent stroke-line"
        strokeWidth={1}
      />
      <path ref={pathRef} d={moonPath(START)} className="fill-foreground" />
    </svg>
  );
}
