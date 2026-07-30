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
// lembrar as fitas de uma roleta física, não um crossfade comum.
//
// A largura reservada não vem de "achar a palavra mais longa por número de
// caracteres": letras têm larguras diferentes (um "m" não é um "i"), então
// contar caracteres erra a largura real sempre que a fonte não é monoespaçada,
// e a palavra visível acaba maior que a caixa reservada e é cortada pelo
// overflow-hidden. Em vez de adivinhar, TODAS as palavras da lista entram
// como texto invisível empilhado na mesma célula do grid, e é o próprio
// motor de layout do navegador, que já sabe a largura real de cada uma
// nesta fonte, quem decide a largura da coluna.

export function SubtitleRoulette({ words }: { words: readonly string[] }) {
  const [tick, setTick] = useState(0);

  useEffect(() => subscribeRouletteTick(setTick), []);

  const word = words[tick % words.length];

  // Alinhado à esquerda (padrão): a palavra sempre começa colada no prefixo
  // "Designer de", então o vão de uma palavra curta como "sites" sobra à
  // direita, fora da linha de leitura, em vez de abrir um buraco entre o
  // prefixo e a palavra como aconteceria centralizado.
  return (
    <span className="relative inline-grid overflow-hidden text-left align-bottom">
      {words.map((w) => (
        <span
          key={w}
          aria-hidden
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
        >
          {w}
        </span>
      ))}
      <AnimatePresence initial={false}>
        <motion.span
          key={word}
          className="col-start-1 row-start-1 whitespace-nowrap"
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
