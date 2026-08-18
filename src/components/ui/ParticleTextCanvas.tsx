"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Prévia leve, local, de um nome em partículas: a mesma linguagem visual
// que Ganwalk e Pink Opala usam de verdade (texto amostrado em pixels,
// virando partículas), reconstruída em Canvas 2D simples, sem WebGL nem
// física de mola. Existe pra tirar o peso de embutir os sites de verdade
// num iframe sempre montado no card do trio (três contextos de
// WebGL/Three.js/áudio simultâneos, só pra uma prévia) — a versão
// completa, com todos os efeitos de verdade, continua um clique de
// distância (LiveEmbed, no corpo do case).
//
// IntersectionObserver pausa o loop de animação fora de tela: útil aqui
// porque o card do trio monta de cara, mesmo antes do scroll alcançar
// ele (ver CasesGrid.tsx), então nada impede o visitante de nunca chegar
// perto o bastante pra essas partículas ficarem visíveis.

const GAP = 4;
const IDLE_AMPLITUDE = 1.4;
const REPULSE_RADIUS = 70;
const REPULSE_STRENGTH = 26;
const RETURN_SPEED = 0.12;

interface Particle {
  ox: number;
  oy: number;
  x: number;
  y: number;
  size: number;
  seed: number;
}

export function ParticleTextCanvas({
  lines,
  color,
  background,
  interactive = false,
  className = "",
}: {
  lines: string[];
  color: string;
  background: string;
  /** Repulsão de partículas perto do cursor de verdade, escutado direto
   *  neste componente (sem repasse entre janelas: tudo mora aqui). */
  interactive?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  // Posição do ponteiro em coordenadas de VIEWPORT (clientX/clientY crus),
  // não relativas ao container: o container pode se mover por baixo de um
  // cursor parado (paralaxe de scroll em CasesGrid, ver mediaY), e uma
  // posição relativa guardada no momento do pointermove ficaria PRESA à
  // rect de então, saindo do eixo do cursor de verdade assim que o
  // container terminasse de se mexer sem nenhum movimento novo do mouse
  // pra corrigir. Convertida pra espaço local só no momento de pintar (ver
  // paint, abaixo), contra a rect ATUAL, sempre.
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number | null = null;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function buildParticles() {
      const rect = container!.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      const off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      const offCtx = off.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      // Cabe de verdade, medido, não chutado: a largura real de cada linha
      // varia por fonte e por peso (glifos largos como "M" e estreitos
      // como "I" não rendem numa razão fixa de caractere-por-pixel), e um
      // fator fixo (0.62, valor antigo) cortava a última letra de "PINK"
      // pra fora do canvas sempre que a fonte de verdade ficava mais larga
      // que a estimativa. Desenha uma vez num tamanho de partida, mede a
      // linha mais larga de verdade (measureText), e escala o tamanho da
      // fonte pela razão entre o espaço disponível e essa largura medida.
      const longest = Math.max(...lines.map((l) => l.length), 1);
      let fontSize = Math.max(8, Math.round(width / (longest * 0.62)));
      offCtx.fillStyle = "#fff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      const widthBudget = width * 0.92;
      const heightBudget = height * 0.85;
      offCtx.font = `900 ${fontSize}px "Archivo Black", "Inter", sans-serif`;
      const measuredWidth = Math.max(
        ...lines.map((line) => offCtx.measureText(line).width),
        1,
      );
      const widthScale = widthBudget / measuredWidth;
      const heightScale = heightBudget / (fontSize * 1.05 * lines.length);
      fontSize = Math.max(8, Math.floor(fontSize * Math.min(widthScale, heightScale)));
      offCtx.font = `900 ${fontSize}px "Archivo Black", "Inter", sans-serif`;

      const lineHeight = fontSize * 1.05;
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => offCtx.fillText(line, width / 2, startY + i * lineHeight));

      const data = offCtx.getImageData(0, 0, width, height).data;
      const particles: Particle[] = [];
      for (let y = 0; y < height; y += GAP) {
        for (let x = 0; x < width; x += GAP) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 128) {
            particles.push({
              ox: x,
              oy: y,
              x,
              y,
              size: Math.random() * 1.1 + 0.9,
              seed: Math.random() * Math.PI * 2,
            });
          }
        }
      }
      particlesRef.current = particles;
    }

    buildParticles();
    const resizeObserver = new ResizeObserver(buildParticles);
    resizeObserver.observe(container);

    function handlePointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }
    function handlePointerLeave() {
      pointerRef.current = { x: -9999, y: -9999 };
    }
    if (interactive && !reduceMotion) {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);
    }

    function paint(now: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = background;
      ctx!.fillRect(0, 0, width, height);
      ctx!.fillStyle = color;

      const t = now / 1000;
      // Convertido pra espaço local aqui, contra a rect ATUAL do container,
      // não a de quando o pointermove disparou (ver comentário em
      // pointerRef): o eixo da repulsão fica preso na ponta do cursor de
      // verdade mesmo se o container se mover por baixo dele (paralaxe de
      // scroll, ver mediaY em CasesGrid) sem nenhum movimento novo do mouse.
      let px = -9999;
      let py = -9999;
      if (interactive && pointerRef.current.x !== -9999) {
        const rect = container!.getBoundingClientRect();
        px = pointerRef.current.x - rect.left;
        py = pointerRef.current.y - rect.top;
      }

      for (const p of particlesRef.current) {
        let tx = p.ox;
        let ty = p.oy;
        if (!reduceMotion) {
          tx += Math.sin(t * 0.8 + p.seed) * IDLE_AMPLITUDE;
          ty += Math.cos(t * 0.8 + p.seed) * IDLE_AMPLITUDE;
          if (interactive) {
            const dx = tx - px;
            const dy = ty - py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPULSE_RADIUS) {
              const force = (1 - dist / REPULSE_RADIUS) * REPULSE_STRENGTH;
              tx += (dx / (dist || 1)) * force;
              ty += (dy / (dist || 1)) * force;
            }
          }
          p.x += (tx - p.x) * RETURN_SPEED;
          p.y += (ty - p.y) * RETURN_SPEED;
        } else {
          p.x = tx;
          p.y = ty;
        }
        ctx!.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    function frame(now: number) {
      if (!visible) {
        raf = null;
        return;
      }
      paint(now);
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      paint(0);
    } else {
      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible && raf === null) raf = requestAnimationFrame(frame);
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(container);
      raf = requestAnimationFrame(frame);

      return () => {
        if (raf !== null) cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        if (interactive) {
          container.removeEventListener("pointermove", handlePointerMove);
          container.removeEventListener("pointerleave", handlePointerLeave);
        }
      };
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [lines, color, background, interactive, reduceMotion]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
