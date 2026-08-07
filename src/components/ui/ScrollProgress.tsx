"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Régua de 2px presa ao topo da viewport, acima do cabeçalho (z-50 contra
// z-40): a leitura de "quanto falta" que complementa o "role para navegar"
// já escrito no rodapé de CasesGrid, agora para a página inteira, não só
// aquela seção. 1:1 com a posição real da rolagem, sem inventar movimento
// próprio: a mola só tira o serrilhado de um salto rápido de scroll, não
// atrasa a leitura. Some por completo no Modo Boring (mesmo critério do
// resto do cabeçalho), na impressão e no mobile: lá a lua do cabeçalho
// (MoonPhase, sempre visível, também nessa largura) já é a leitura de
// progresso da rolagem, e as duas juntas na mesma tarja eram redundância.
export function ScrollProgress() {
  const { isBoringMode } = useBoringMode();
  const { scrollYProgress } = useScroll();
  const reduceMotion = useReducedMotion();
  const smoothed = useSpring(scrollYProgress, {
    stiffness: 300,
    damping: 40,
    mass: 0.2,
    restDelta: 0.001,
  });
  const scaleX = reduceMotion ? scrollYProgress : smoothed;

  if (isBoringMode) return null;

  return (
    <motion.div
      aria-hidden
      className="no-print fixed inset-x-0 top-0 z-50 hidden h-[2px] origin-left bg-foreground sm:block"
      style={{ scaleX }}
    />
  );
}
