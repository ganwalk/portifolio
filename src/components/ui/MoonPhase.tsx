"use client";

import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";

// A lua ao lado da assinatura: atravessa as fases conforme o scroll da página.
// Começa cheia (totalmente clara) no topo e termina nova (totalmente escura)
// no fim, com três voltas completas entre os dois estados.
//
// f em [0,1): 0 é lua nova, 0.5 cheia. Cheia e nova são opostas no ciclo,
// meia volta uma da outra, então não existe número inteiro de voltas que
// leve de uma direto à outra: o percurso total é sempre um múltiplo inteiro
// mais essa meia volta final. Três voltas "completas" mais a meia volta que
// fecha em nova dá 3.5 voltas de percurso bruto.
const START_PHASE = 0.5;
const LOOPS = 3;
const TOTAL_TURNS = LOOPS + 0.5;

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
      moonPath((START_PHASE + progress * TOTAL_TURNS) % 1),
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
      <path
        ref={pathRef}
        d={moonPath(START_PHASE)}
        className="fill-foreground"
      />
    </svg>
  );
}
