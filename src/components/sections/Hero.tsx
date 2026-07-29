"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Hero radical: só o nome, em display condensado ocupando a tela inteira.
// As linhas sobem uma a uma na entrada e o bloco todo sai em parallax quando
// o scroll começa, entregando a página aos cases.

export function Hero({ dict }: { dict: Dictionary }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  const words = profile.name.split(" ");

  return (
    <section
      ref={ref}
      className="texture-noise relative flex min-h-[calc(100svh-3.4rem)] flex-col justify-center overflow-hidden px-4 sm:px-8"
    >
      <motion.h1
        style={{ y, opacity }}
        className="type-display text-[19.5vw] leading-[0.83]"
      >
        {words.map((word, index) => (
          <span key={word} className="block overflow-hidden">
            <motion.span
              className="block"
              style={index > 0 ? { paddingLeft: `${index * 9}vw` } : undefined}
              initial={{ y: "108%" }}
              animate={{ y: 0 }}
              transition={{
                duration: 0.9,
                ease: [0.16, 1, 0.3, 1],
                delay: 0.15 + index * 0.14,
              }}
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.h1>

      <motion.div
        className="absolute bottom-6 left-4 flex items-center gap-3 sm:left-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <span className="type-mono text-muted">{dict.hero.scrollHint}</span>
        <motion.span
          aria-hidden
          className="block h-8 w-px origin-top bg-foreground"
          animate={{ scaleY: [0, 1, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </section>
  );
}
