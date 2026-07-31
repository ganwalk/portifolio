"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Só o nome na hera reage ao mouse: cada letra engorda (font-weight, Bold
// pra Black) conforme a distância até o ponteiro, gaussiana + suavização
// por quadro, mesma família do artefato interativo da seção de Contato
// (InteractiveGridImage). Sem scaleY nem qualquer transform desta vez: a
// versão anterior deformava a altura da letra e ficou estranha; esta só
// muda o peso.
//
// Posição horizontal sempre fixa, de propósito: cada span trava a própria
// largura no estado de repouso (medida uma vez, no mount) antes de soltar
// o peso variável, senão o glifo mais pesado ficaria mais largo e
// empurraria as letras vizinhas a cada oscilação.
//
// A Whyte Inktrap não é uma fonte variável (vem em arquivos estáticos por
// peso, ver src/fonts/whyte-inktrap/), então a transição pula entre os
// pesos carregados (Bold e Black) em vez de interpolar suave, mas ainda
// assim responde de verdade à posição do mouse, letra a letra.

const SIGMA = 55; // px, alcance da influência do ponteiro
const MIN_WEIGHT = 700; // Bold, o peso de repouso
const MAX_WEIGHT = 900; // Black, o peso perto do ponteiro
const EASE = 0.2;

export function KineticWeight({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stateRef = useRef<Array<{ weight: number }>>([]);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (isBoringMode) return;
    stateRef.current = text.split("").map(() => ({ weight: MIN_WEIGHT }));

    letterRefs.current.forEach((el) => {
      if (!el) return;
      el.style.width = `${el.getBoundingClientRect().width}px`;
    });

    let raf = 0;
    function frame() {
      const container = containerRef.current;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        letterRefs.current.forEach((el, i) => {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const cx = rect.left + rect.width / 2 - containerRect.left;
          const cy = rect.top + rect.height / 2 - containerRect.top;

          let targetWeight = MIN_WEIGHT;
          if (pointer.current.active) {
            const dx = pointer.current.x - cx;
            const dy = pointer.current.y - cy;
            const d = Math.hypot(dx, dy);
            const t = Math.exp(-0.5 * (d / SIGMA) ** 2);
            targetWeight = MIN_WEIGHT + (MAX_WEIGHT - MIN_WEIGHT) * t;
          }

          const s = stateRef.current[i];
          s.weight += (targetWeight - s.weight) * EASE;
          el.style.fontWeight = String(Math.round(s.weight));
        });
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [text, isBoringMode]);

  function onMouseMove(event: React.MouseEvent<HTMLSpanElement>) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointer.current.x = event.clientX - rect.left;
    pointer.current.y = event.clientY - rect.top;
    pointer.current.active = true;
  }

  function onMouseLeave() {
    pointer.current.active = false;
  }

  if (isBoringMode) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span
      ref={containerRef}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={text}
      className={className}
    >
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
