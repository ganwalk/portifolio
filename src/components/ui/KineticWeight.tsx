"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Só o nome na hero reage ao mouse: cada letra "engorda" conforme a
// distância até o ponteiro, gaussiana + suavização por quadro, mesma
// família do artefato interativo da seção de Contato (InteractiveGridImage).
// Sem scaleY nem qualquer transform desta vez: uma versão anterior
// deformava a altura da letra e ficou estranha; esta só muda o peso.
//
// A Whyte Inktrap não é uma fonte variável (vem em arquivos estáticos por
// peso, ver src/fonts/whyte-inktrap/), então animar font-weight diretamente
// faz o navegador pular entre os arquivos carregados em vez de interpolar,
// um efeito visivelmente truncado (a letra "salta" de peso em vez de
// engordar aos poucos). Em vez disso, cada letra é desenhada duas vezes,
// empilhada: uma cópia em Bold (sempre visível, é a base) e uma em Black
// por cima, cuja opacidade acompanha a mesma curva gaussiana suavizada de
// antes. Opacidade é uma propriedade genuinamente contínua (o navegador
// faz alpha blending pixel a pixel, não escolhe entre estados discretos),
// então o resultado é um dissolve fluido entre os dois pesos, líquido de
// verdade, em vez do degrau antigo.
//
// Posição horizontal sempre fixa, de propósito: cada par de letras trava a
// própria largura no estado de repouso (medida uma vez, no mount) antes de
// soltar a animação, senão o glifo mais pesado ficaria mais largo e
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

const SIGMA = 55; // px, alcance da influência do ponteiro
const EASE = 0.16; // mais baixo que antes: a transição contínua pede um pouco mais de lag pra parecer líquida, não elétrica

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
  const heavyRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const intensityRef = useRef<number[]>([]);

  useEffect(() => {
    if (isBoringMode) return;
    intensityRef.current = text.split("").map(() => 0);

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
        const heavy = heavyRefs.current[i];
        if (!el || !heavy) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        let target = 0;
        if (active) {
          const dx = px - cx;
          const dy = py - cy;
          const d = Math.hypot(dx, dy);
          target = Math.exp(-0.5 * (d / SIGMA) ** 2);
        }

        const eased =
          intensityRef.current[i] + (target - intensityRef.current[i]) * EASE;
        intensityRef.current[i] = eased;
        heavy.style.opacity = String(eased);
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
              position: "relative",
              display: "inline-block",
              textAlign: "center",
              overflow: "visible",
              fontWeight: 700,
            }}
          >
            {char === " " ? " " : char}
            <span
              ref={(el) => {
                heavyRefs.current[i] = el;
              }}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                fontWeight: 900,
                opacity: 0,
              }}
            >
              {char === " " ? " " : char}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}
