"use client";

import { motion, useMotionValue, useReducedMotion, useSpring } from "framer-motion";
import type { ReactNode } from "react";

// Tag quadrada (sem arredondar, como todo botão do site) que puxa sutilmente
// na direção do cursor enquanto ele passa por cima, e volta ao lugar com a
// mesma mola: peso físico, não clique nem link, só textura de hover. Mesmo
// raciocínio de mola cursor→posição já usado na lente da hero (Hero.tsx), só
// que aqui o alvo é a própria tag, não um círculo flutuante.
//
// onMouseMove só dispara com o cursor de verdade sobre o próprio elemento
// (não com toque), então em tela de toque a tag nunca se move, mesmo sem
// checagem explícita de ponteiro: mesmo princípio que já mantém a lente da
// hero e o selo do CasesGrid parados no mobile.
const STRENGTH = 0.35;

export function MagneticTag({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 300, damping: 20, mass: 0.4 });

  function onMouseMove(event: React.MouseEvent<HTMLSpanElement>) {
    if (reduceMotion) return;
    const rect = event.currentTarget.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * STRENGTH);
    y.set((event.clientY - (rect.top + rect.height / 2)) * STRENGTH);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.span
      onMouseMove={onMouseMove}
      onMouseLeave={reset}
      style={{ x: springX, y: springY }}
      className={`type-mono inline-block cursor-default border border-line px-3 py-1.5 transition-colors duration-300 hover:bg-foreground hover:text-background ${className}`}
    >
      {children}
    </motion.span>
  );
}
