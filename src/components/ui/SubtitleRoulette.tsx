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

  // No mobile a roleta mora na própria linha, embaixo do prefixo (veja
  // Hero.tsx), então centralizada não sobra vão de nenhum lado: é a própria
  // linha. No desktop ela volta a ficar colada no prefixo "Designer de", na
  // mesma linha, e aí alinhada à esquerda: centralizada ali abriria um vão
  // entre o prefixo e uma palavra curta como "sites".
  // pb-[0.22em]: .type-serif-display, herdado do parágrafo em volta, tem
  // line-height 0.95, mais apertado que a altura de descendentes como "p",
  // "g" e "q", que o overflow-hidden cortava reto embaixo sem essa folga
  // (overflow corta na borda externa do padding, não do conteúdo, então
  // esse respiro extra é o suficiente). Mesmo problema do pt-[0.16em] usado
  // no título dos cases (contra o corte de ascendentes), só que embaixo; e
  // a mesma solução de lá pro efeito colateral dele: -mb-[0.22em] cancela o
  // espaço extra que o padding abriria na hora do align-bottom encaixar a
  // roleta com "Designer de" (senão a palavra sobe visivelmente).
  return (
    <span className="relative -mb-[0.22em] inline-grid overflow-hidden pb-[0.22em] text-center align-bottom sm:text-left">
      {words.map((w) => (
        <span
          key={w}
          aria-hidden
          className="invisible col-start-1 row-start-1 whitespace-nowrap"
        >
          {w}
        </span>
      ))}
      {/* Saída mais rápida que a entrada (0.32s contra 0.45s, a mesma regra
          de "sai mais rápido do que entra" usada no resto do site), com uma
          curva de ease-in diferente da de entrada em vez da mesma curva
          espelhada: cubic-bezier(0.7, 0, 0.84, 0), a mesma da fase de
          recolhimento das células da Intranet (ver @keyframes
          intranet-tile-center em globals.css), então a fita sai com um
          movimento mais abrupto, "chicoteado", e chega devagar, se
          assentando. O desfoque de saída também é mais forte (10px contra
          6px na entrada): a palavra que sai está se movendo mais rápido no
          mesmo instante, então borra mais, como desfoque de movimento de
          verdade, não um blur simétrico igual nos dois sentidos. */}
      <AnimatePresence initial={false}>
        <motion.span
          key={word}
          className="col-start-1 row-start-1 whitespace-nowrap"
          initial={{ y: "70%", opacity: 0, filter: "blur(6px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{
            y: "-70%",
            opacity: 0,
            filter: "blur(10px)",
            transition: { duration: 0.32, ease: [0.7, 0, 0.84, 0] },
          }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {word}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
