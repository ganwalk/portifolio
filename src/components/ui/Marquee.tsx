"use client";

import { motion, useReducedMotion } from "framer-motion";

// Letreiro contínuo: duas cópias idênticas do conteúdo lado a lado, andando
// de 0% a -50% pra sempre (linear, sem pausa). Como as cópias são idênticas,
// o instante em que a primeira sai pela esquerda é exatamente o instante em
// que a segunda chega no início, sem costura no loop. Mesma técnica do selo
// "ver caso" que segue o cursor em CasesGrid, extraída aqui por já ter um
// segundo uso (ver Brands.tsx). A segunda cópia é aria-hidden: quem usa
// leitor de tela lê o conteúdo uma vez só, como texto normal, não como
// animação.
//
// Quem pede menos movimento no sistema recebe uma linha só, estática, sem
// duplicar (senão o conteúdo lido em voz alta repetiria).
export function Marquee({
  children,
  durationSeconds = 28,
  className = "",
}: {
  children: React.ReactNode;
  durationSeconds?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={`flex flex-wrap items-center ${className}`}>{children}</div>;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className="flex w-max items-center"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
      >
        <div className="flex shrink-0 items-center">{children}</div>
        <div aria-hidden className="flex shrink-0 items-center">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
