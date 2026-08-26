"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

// Entrada padrão de seção: sobe e aparece quando entra na viewport, uma vez.
// Componente de cliente pensado para ser usado por Server Components: recebe
// children prontos e só cuida do movimento.
//
// amount: "some" (uma fração mínima do elemento visível), não um número
// como 0.25 (25% do próprio elemento): esse número é uma fração do TAMANHO
// DO ELEMENTO, não da tela, então uma seção mais alta que o viewport (comum
// no celular: qualquer bloco de texto+métrica já passa da altura da tela)
// só disparava depois de já estar bem dentro da área visível, um "pulo"
// abrupto no meio da rolagem em vez de uma entrada suave assim que a seção
// se aproxima. Esse mesmo problema já tinha sido contornado individualmente
// no case da Intranet (ver histórico de BentoCard.tsx: cada card ganhou o
// próprio Reveal pequeno, pra nunca esbarrar nesse limiar), mas o problema
// era daqui, do componente compartilhado, não de nenhum card específico:
// "some" dispara assim que qualquer parte do elemento cruza a margem
// abaixo (margin), um ponto fixo em relação à TELA, que nunca escala com a
// altura do conteúdo.
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
      viewport={{ once: true, amount: "some", margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
