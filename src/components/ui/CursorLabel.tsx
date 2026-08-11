"use client";

import { motion, type MotionValue } from "framer-motion";

// Estilo único pra toda caixa de texto que segue o cursor no site: pílula
// branca sobre preto (quadrada, sem rounded), na mesma mono dos outros
// rótulos técnicos. Nasceu como o selo "ver caso" de CasesGrid e virou a
// referência pra qualquer outro lugar com o mesmo idioma (ver ExperimentCard).
//
// `scroll` decide o comportamento, não só o visual: true é o letreiro de
// verdade (janela de largura fixa, duas cópias do texto andando de 0% a
// -50% pra sempre, sem costura no loop, como uma placa luminosa antiga).
// false é uma pílula parada, do tamanho do próprio conteúdo: usada onde o
// texto já É a peça (a ascii art de cada ilustração no Playground) e girar
// só atrapalharia a leitura.
export function CursorLabel({
  x,
  y,
  visible,
  text,
  scroll = true,
  width = "w-44",
  className = "",
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  visible: boolean;
  text: string;
  scroll?: boolean;
  width?: string;
  className?: string;
}) {
  return (
    <motion.div
      aria-hidden
      style={{ x, y }}
      className={`pointer-events-none absolute left-0 top-0 z-40 hidden sm:block ${className}`}
    >
      <motion.div
        animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.6 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`type-mono bg-white text-black ${
          scroll ? `${width} overflow-hidden py-2.5` : "whitespace-nowrap px-4 py-2.5"
        }`}
      >
        {scroll ? (
          <motion.div
            className="flex w-max items-center whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 6, ease: "linear", repeat: Infinity }}
          >
            {[0, 1].map((copy) => (
              <span key={copy} className="flex shrink-0 items-center">
                <span aria-hidden className="px-3">
                  •
                </span>
                {text}
              </span>
            ))}
          </motion.div>
        ) : (
          text
        )}
      </motion.div>
    </motion.div>
  );
}
