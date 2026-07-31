"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Texto cinético: cada letra deforma (mais alta, mais pesada) conforme a
// distância até o ponteiro, mesma família de efeito do artefato interativo
// da seção de Contato (InteractiveGridImage), gaussiana + suavização por
// quadro, só que sobre glifos em vez de células de uma grade.
//
// A posição horizontal de cada letra é fixa de propósito: só scaleY muda
// (transform-origin no pé da letra), nunca scaleX nem translateX. font-weight
// também muda, mas cada span trava a própria largura no estado de repouso
// (medida uma vez, no mount) antes de soltar o peso variável, senão o glifo
// mais pesado ficaria mais largo e empurraria as letras vizinhas a cada
// oscilação.

const SIGMA = 60; // px, alcance da influência do ponteiro
const MAX_SCALE_Y = 1.5;
const MIN_WEIGHT = 300;
const MAX_WEIGHT = 900;
const EASE = 0.18;

export function KineticText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const stateRef = useRef<Array<{ scaleY: number; weight: number }>>([]);
  const pointer = useRef({ x: -9999, y: -9999, active: false });

  useEffect(() => {
    if (isBoringMode) return;
    stateRef.current = text.split("").map(() => ({
      scaleY: 1,
      weight: MIN_WEIGHT,
    }));

    // Trava a largura de repouso antes de soltar o peso variável.
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

          let targetScaleY = 1;
          let targetWeight = MIN_WEIGHT;
          if (pointer.current.active) {
            const dx = pointer.current.x - cx;
            const dy = pointer.current.y - cy;
            const d = Math.hypot(dx, dy);
            const t = Math.exp(-0.5 * (d / SIGMA) ** 2);
            targetScaleY = 1 + (MAX_SCALE_Y - 1) * t;
            targetWeight = MIN_WEIGHT + (MAX_WEIGHT - MIN_WEIGHT) * t;
          }

          const s = stateRef.current[i];
          s.scaleY += (targetScaleY - s.scaleY) * EASE;
          s.weight += (targetWeight - s.weight) * EASE;
          el.style.transform = `scaleY(${s.scaleY})`;
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

  // Modo Boring é informação, não vitrine: a assinatura continua visível lá
  // (só o miolo da home troca pra BoringView), mas sem o gancho de mouse.
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
              transformOrigin: "center bottom",
              willChange: "transform",
            }}
          >
            {char === " " ? " " : char}
          </span>
        ))}
      </span>
    </span>
  );
}
