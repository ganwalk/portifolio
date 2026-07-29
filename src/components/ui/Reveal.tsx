"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Entrada padrão de seção: sobe e aparece quando entra na viewport, uma vez.
// Componente de cliente pensado para ser usado por Server Components: recebe
// children prontos e só cuida do movimento.

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
