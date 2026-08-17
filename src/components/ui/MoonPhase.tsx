"use client";

import { useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";
import { useTheme } from "next-themes";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useHydrated } from "@/lib/use-hydrated";
import { MOON_CENTER as CENTER, MOON_R as R, moonPath } from "@/lib/moon-path";

// A lua ao lado da assinatura: atravessa as fases conforme o scroll da página.
// Começa cheia (totalmente clara) no topo e termina nova (totalmente escura)
// no fim, com três voltas completas entre os dois estados.
//
// A própria lua é o seletor de tema: um clique alterna claro/escuro, sem
// botão ☀/☾ à parte disputando espaço no cabeçalho por um controle que já
// tem ícone próprio ali. O ciclo de fases continua regido só pelo scroll,
// sem relação nenhuma com o tema em si; o clique muda só o fill/stroke por
// baixo, herdados de --foreground e --line como sempre foram.
//
// f em [0,1): 0 é lua nova, 0.5 cheia. Cheia e nova são opostas no ciclo,
// meia volta uma da outra, então não existe número inteiro de voltas que
// leve de uma direto à outra: o percurso total é sempre um múltiplo inteiro
// mais essa meia volta final. Três voltas "completas" mais a meia volta que
// fecha em nova dá 3.5 voltas de percurso bruto.
const START_PHASE = 0.5;
const LOOPS = 3;
const TOTAL_TURNS = LOOPS + 0.5;

export function MoonPhase({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const { resolvedTheme, setTheme } = useTheme();
  // Tema só existe no cliente: antes de hidratar, aria-pressed fica de fora
  // pra não divergir do HTML gerado no build (mesmo cuidado do ControlBar).
  const mounted = useHydrated();
  const pathRef = useRef<SVGPathElement>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const viewport = window.innerHeight;
    const maxScroll = Math.max(document.documentElement.scrollHeight - viewport, 1);
    const progress = Math.min(Math.max(y / maxScroll, 0), 1);
    pathRef.current?.setAttribute(
      "d",
      moonPath((START_PHASE + progress * TOTAL_TURNS) % 1),
    );
  });

  if (isBoringMode) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={label}
      aria-pressed={mounted ? resolvedTheme === "dark" : undefined}
      className={`cursor-pointer transition-opacity hover:opacity-70 ${className}`}
    >
      <svg viewBox="0 0 20 20" className="h-full w-full" aria-hidden="true">
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
    </button>
  );
}
