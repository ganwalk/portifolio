"use client";

import { motion } from "framer-motion";
import { Fragment } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// A tarja entre a hero e os projetos, redesenhada: em vez de um ticker mono
// genérico, tipografia editorial grande alternando contorno vazado e serif
// itálica cheia, com costura tracejada nas bordas, clima de ingresso picotado.
// No Modo Boring não renderiza (informação redundante).

export function TicketStrip({
  items,
  duration = 42,
}: {
  items: readonly string[];
  duration?: number;
}) {
  const { isBoringMode } = useBoringMode();
  if (isBoringMode) return null;

  const strip = (
    <div className="flex shrink-0 items-baseline gap-8 pr-8">
      {items.map((item, index) => (
        <Fragment key={`${item}-${index}`}>
          {index % 2 === 0 ? (
            <span className="type-display text-outline whitespace-nowrap text-4xl sm:text-6xl">
              {item}
            </span>
          ) : (
            <span className="type-serif-display whitespace-nowrap text-3xl italic text-accent sm:text-5xl">
              {item}
            </span>
          )}
          <span aria-hidden className="type-mono text-muted">
            ·
          </span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="texture-noise overflow-hidden border-y border-dashed border-line bg-surface py-5">
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
