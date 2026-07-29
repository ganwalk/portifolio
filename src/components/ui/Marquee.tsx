"use client";

import { motion } from "framer-motion";
import { Fragment, type ReactNode } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Letreiro contínuo, referência direta aos marquees de impresso antigo.
// Duplicamos o conteúdo para o loop ser imperceptível.
// No Modo Boring o componente simplesmente não renderiza (informação redundante).

interface MarqueeProps {
  items: readonly string[];
  /** Segundos para uma volta completa. */
  duration?: number;
  separator?: ReactNode;
  className?: string;
}

export function Marquee({
  items,
  duration = 30,
  separator = "•",
  className = "",
}: MarqueeProps) {
  const { isBoringMode } = useBoringMode();
  if (isBoringMode) return null;

  const strip = (
    <div className="flex shrink-0 items-center gap-6 pr-6">
      {items.map((item, i) => (
        <Fragment key={i}>
          <span>{item}</span>
          <span aria-hidden className="text-accent">
            {separator}
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div
      className={`flex overflow-hidden whitespace-nowrap border-y border-line ${className}`}
    >
      <span className="sr-only">{items.join(", ")}</span>
      <motion.div
        aria-hidden
        className="flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {strip}
        {strip}
      </motion.div>
    </div>
  );
}
