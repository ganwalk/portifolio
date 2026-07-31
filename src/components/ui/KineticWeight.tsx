"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Só o nome na hero reage ao mouse: cada letra engorda (font-weight, Bold
// pra Black em três degraus) conforme a distância até o ponteiro, gaussiana
// + suavização por quadro, mesma família do artefato interativo da seção
// de Contato (InteractiveGridImage). Sem scaleY nem qualquer transform
// desta vez: a versão anterior deformava a altura da letra e ficou
// estranha; esta só muda o peso.
//
// Posição horizontal sempre fixa, de propósito: cada span trava a própria
// largura no estado de repouso (medida uma vez, no mount) antes de soltar
// o peso variável, senão o glifo mais pesado ficaria mais largo e
// empurraria as letras vizinhas a cada oscilação.
//
// A posição do ponteiro vem de fora (pointerX/pointerY/pointerActive, MotionValues
// montados uma vez lá na Hero), em vez de cada instância ouvir seu próprio
// onMouseMove: a hero renderiza este componente duas vezes (a cópia normal
// e a invertida dentro da lente), e a cópia da lente vive num ancestral com
// pointer-events: none (não pode roubar o clique de baixo dela), então
// jamais receberia um evento de mouse próprio. Lendo a MESMA posição
// compartilhada, as duas cópias respondem em uníssono; sem isso, a cópia
// da lente ficava sempre no peso de repouso enquanto a de fora reagia,
// criando uma costura visível bem na borda do círculo da lente.
//
// A Whyte Inktrap não é uma fonte variável (vem em arquivos estáticos por
// peso, ver src/fonts/whyte-inktrap/), então a transição pula entre os
// pesos carregados em vez de interpolar suave; carregar três (Bold, Heavy,
// Black) em vez de dois deixa o salto bem menos brusco.

const SIGMA = 55; // px, alcance da influência do ponteiro
const MIN_WEIGHT = 700; // Bold, o peso de repouso
const MAX_WEIGHT = 900; // Black, o peso perto do ponteiro
const EASE = 0.2;

export function KineticWeight({
  text,
  className = "",
  pointerX,
  pointerY,
  pointerActive,
}: {
  text: string;
  className?: string;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  pointerActive: MotionValue<number>;
}) {
  const { isBoringMode } = useBoringMode();
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stateRef = useRef<Array<{ weight: number }>>([]);

  useEffect(() => {
    if (isBoringMode) return;
    stateRef.current = text.split("").map(() => ({ weight: MIN_WEIGHT }));

    letterRefs.current.forEach((el) => {
      if (!el) return;
      el.style.width = `${el.getBoundingClientRect().width}px`;
    });

    let raf = 0;
    function frame() {
      const active = pointerActive.get() > 0.5;
      const px = pointerX.get();
      const py = pointerY.get();

      letterRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        let targetWeight = MIN_WEIGHT;
        if (active) {
          const dx = px - cx;
          const dy = py - cy;
          const d = Math.hypot(dx, dy);
          const t = Math.exp(-0.5 * (d / SIGMA) ** 2);
          targetWeight = MIN_WEIGHT + (MAX_WEIGHT - MIN_WEIGHT) * t;
        }

        const s = stateRef.current[i];
        s.weight += (targetWeight - s.weight) * EASE;
        el.style.fontWeight = String(Math.round(s.weight));
      });
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text, isBoringMode, pointerX, pointerY, pointerActive]);

  if (isBoringMode) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span aria-label={text} className={className}>
      <span aria-hidden="true">
        {text.split("").map((char, i) => (
          <span
            key={i}
            ref={(el) => {
              letterRefs.current[i] = el;
            }}
            style={{
              display: "inline-block",
              textAlign: "center",
              overflow: "visible",
              fontWeight: MIN_WEIGHT,
            }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}
