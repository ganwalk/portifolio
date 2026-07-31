"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Ícones desenhados à mão orbitando o retrato, com um 3D de mentirinha: a
// órbita é uma elipse achatada (vista de lado, como um anel inclinado), e
// cada ícone recebe escala, opacidade e z-index calculados a partir do seno
// do próprio ângulo. Metade de cima do anel (seno negativo) fica atrás do
// retrato, menor e mais apagada; a metade de baixo (seno positivo) fica na
// frente, maior e opaca. z-index muda em degrau exatamente no cruzamento
// (seno trocando de sinal), o resto (escala, opacidade, posição) interpola
// suave. Um traço elíptico também desenhado à mão (pontos levemente
// irregulares, não uma elipse geométrica perfeita) marca a trajetória por
// baixo de tudo, com o tracejado "andando" para parecer sendo desenhado.
//
// Cálculo em requestAnimationFrame, mesma família do canvas de
// InteractiveGridImage: nada de estado React por quadro, só leitura e
// escrita direta em style.

const ICONS = [
  { id: "spark", phase: 0, speed: 0.28, size: 34 },
  { id: "note", phase: (Math.PI * 2) / 5, speed: 0.24, size: 30 },
  { id: "bulb", phase: (Math.PI * 4) / 5, speed: 0.31, size: 32 },
  { id: "heart", phase: (Math.PI * 6) / 5, speed: 0.22, size: 28 },
  { id: "pencil", phase: (Math.PI * 8) / 5, speed: 0.26, size: 32 },
] as const;

type IconId = (typeof ICONS)[number]["id"];

// Traços soltos, propositalmente um pouco irregulares: pontos de controle
// deslocados na mão, não uma curva perfeita gerada por fórmula.
function IconGlyph({ id }: { id: IconId }) {
  switch (id) {
    case "spark":
      return (
        <path
          d="M12 2.5 L13.6 9.8 L21 11.7 L13.4 13.4 L12 21.5 L10.7 13.6 L2.8 12 L10.5 10.1 Z"
          fill="none"
        />
      );
    case "note":
      return (
        <g fill="none">
          <path d="M9.4 18.2 C9.7 19.6 8.3 20.8 6.7 20.5 C5.2 20.2 4.4 18.8 5.1 17.7 C5.8 16.6 7.6 16.4 8.7 17.2 C9.2 17.5 9.3 17.8 9.4 18.2 Z" />
          <path d="M9.3 18 L9.6 5.3 C9.6 5.3 10.2 4.6 11.4 4.3 C13 3.9 15.4 4.4 16.1 6.2" />
        </g>
      );
    case "bulb":
      return (
        <g fill="none">
          <path d="M12 3.3 C16.2 3.1 18.9 6.5 18.4 10.2 C18.1 12.5 16.5 13.6 15.7 15.1 C15.1 16.2 15.2 17.1 15.1 17.8 L9 17.7 C8.9 16.9 9 16 8.4 14.9 C7.6 13.5 5.9 12.4 5.7 10 C5.4 6.4 8.1 3.5 12 3.3 Z" />
          <path d="M9.3 20.1 L14.8 20.2" />
          <path d="M9.8 22 L14.3 22" />
        </g>
      );
    case "heart":
      return (
        <path
          d="M12 20.3 C4.6 15.1 2.3 10.7 4.9 7.4 C6.9 4.9 10.4 5.4 12 8.1 C13.7 5.3 17.3 4.8 19.2 7.3 C21.7 10.6 19.5 15 12 20.3 Z"
          fill="none"
        />
      );
    case "pencil":
      return (
        <g fill="none">
          <path d="M5.2 19.4 L15.6 8.6" />
          <path d="M15.6 8.6 L17.4 6.7 C17.4 6.7 18.6 6.9 19.3 7.7 C20 8.5 20.1 9.7 20.1 9.7 L18.3 11.5 Z" />
          <path d="M4.7 19.9 L5.4 17 L7.9 17.9 Z" />
        </g>
      );
  }
}

const SIGMA_SPEED = 1;

export function OrbitingIcons({ className = "" }: { className?: string }) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (isBoringMode) return;

    let raf = 0;
    const start = performance.now();

    function frame(now: number) {
      const t = ((now - start) / 1000) * SIGMA_SPEED;
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rx = rect.width * 0.46;
        const ry = rect.height * 0.2;

        ICONS.forEach((icon, i) => {
          const el = iconRefs.current[i];
          if (!el) return;
          const angle = icon.phase + t * icon.speed;
          const x = cx + rx * Math.cos(angle);
          const y = cy + ry * Math.sin(angle);
          // -1 (fundo do anel, atrás do retrato) a 1 (frente, na nossa cara).
          const depth = Math.sin(angle);
          const k = (depth + 1) / 2;
          const scale = 0.62 + 0.5 * k;
          const opacity = 0.35 + 0.65 * k;

          el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
          el.style.opacity = String(opacity);
          el.style.zIndex = depth >= 0 ? "20" : "5";
        });
      }
      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [isBoringMode]);

  // Vitrine, não informação: mesmo critério do retrato e da imagem
  // interativa de contato, some inteiro no Modo Boring.
  if (isBoringMode) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none absolute ${className}`}
    >
      {/* Trajetória desenhada à mão: elipse com pontos levemente fora de
          lugar (não é <ellipse>, que sairia perfeita demais) e o traço
          "andando" via stroke-dasharray + animação de dashoffset, para
          parecer sendo desenhado em vez de só estar ali. z-index abaixo do
          retrato (que fica em z-10 no wrapper), sempre atrás de tudo. */}
      <svg
        viewBox="0 0 100 44"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        style={{ zIndex: 1 }}
      >
        <path
          d="M4 22 C4 11, 22 3, 50 3.6 C77 4.2, 96 11.5, 96 22 C96 32.8, 78 40.8, 49.5 40.3 C21.8 39.8, 4 32.6, 4 22 Z"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeDasharray="2.2 3.4"
          className="animate-[orbit-trail_5.5s_linear_infinite]"
        />
      </svg>

      {ICONS.map((icon, i) => (
        <div
          key={icon.id}
          ref={(el) => {
            iconRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 text-foreground"
          style={{ width: icon.size, height: icon.size }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-full w-full"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <IconGlyph id={icon.id} />
          </svg>
        </div>
      ))}
    </div>
  );
}
