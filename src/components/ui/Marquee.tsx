"use client";

import { motion, useReducedMotion } from "framer-motion";

// Letreiro contínuo: duas cópias idênticas do conteúdo lado a lado (ou
// empilhadas, ver `direction`), andando de 0% a -50% pra sempre (linear,
// sem pausa). Como as cópias são idênticas, o instante em que a primeira
// sai por uma ponta é exatamente o instante em que a segunda chega no
// início, sem costura no loop. Mesma técnica do selo "ver caso" que segue o
// cursor em CasesGrid, extraída aqui por já ter um segundo uso (ver
// Brands.tsx). A segunda cópia é aria-hidden: quem usa leitor de tela lê o
// conteúdo uma vez só, como texto normal, não como animação.
//
// `direction="vertical"` (ver IntranetMobileCarousel.tsx) troca x por y e a
// linha por uma coluna: mesma mecânica, só o eixo muda.
//
// Quem pede menos movimento no sistema recebe uma cópia só, estática, sem
// duplicar (senão o conteúdo lido em voz alta repetiria).
export function Marquee({
  children,
  durationSeconds = 28,
  direction = "horizontal",
  className = "",
}: {
  children: React.ReactNode;
  durationSeconds?: number;
  direction?: "horizontal" | "vertical";
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const vertical = direction === "vertical";

  if (reduceMotion) {
    return (
      <div className={`flex items-center ${vertical ? "flex-col" : "flex-wrap"} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <motion.div
        className={`flex items-center ${vertical ? "h-max flex-col" : "w-max"}`}
        animate={vertical ? { y: ["0%", "-50%"] } : { x: ["0%", "-50%"] }}
        transition={{ duration: durationSeconds, ease: "linear", repeat: Infinity }}
      >
        <div className={`flex shrink-0 items-center ${vertical ? "flex-col" : ""}`}>{children}</div>
        <div aria-hidden className={`flex shrink-0 items-center ${vertical ? "flex-col" : ""}`}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}
