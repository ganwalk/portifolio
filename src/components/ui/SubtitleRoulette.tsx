"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { subscribeRouletteTick } from "@/lib/portrait-frames";

// A última palavra do subtítulo gira por uma lista de palavras que aludem ao
// trabalho, e descansa de novo na primeira ("produtos") ao voltar ao início da
// lista. A troca é disparada pelo mesmo relógio do retrato: veja
// subscribeRouletteTick em portrait-frames.ts para o porquê da sincronia.
//
// As duas cópias da hero (normal e a invertida dentro da lente) montam este
// componente separadamente, mas as duas assinam o mesmo relógio, então giram
// juntas.
//
// O texto entra e sai deslizando na vertical com um leve desfoque, feito para
// lembrar as fitas de uma roleta física, não um crossfade comum. A palavra
// mais longa da lista fica invisível por baixo, empilhada no mesmo espaço via
// grid, só para reservar a largura e a rotação nunca empurrar o texto ao lado.

export function SubtitleRoulette({ words }: { words: readonly string[] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeRouletteTick(setTick), []);

  const word = words[tick % words.length];
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a));

  return (
    <span className="relative inline-grid overflow-hidden align-bottom">
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {longest}
      </span>
      <AnimatePresence initial={false}>
        <motion.span
          key={word}
          className="col-start-1 row-start-1"
          initial={{ y: "70%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-70%", opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
