"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Habilidades como uma constelação: em repouso, tags quadradas na grade
// normal (flex-wrap). Ao passar o mouse por cima da área inteira, cada tag
// se solta do lugar, se liga ao cursor por uma linha fina e entra em órbita
// dele, cada uma na sua posição fixa ao redor do círculo (um ângulo por
// índice, mais um relógio comum que gira todas juntas). Quando a última
// termina de assentar na órbita, uma frase aparece no meio, no mesmo estilo
// de selo do "Case completo em breve" do CasesGrid. Solta o mouse e tudo
// volta pro lugar, na mesma mola.
//
// rAF com escrita direta no DOM (style.transform, sem state por quadro),
// mesmo raciocínio de InteractiveGridImage e HeroTitleGL: são ~15 elementos
// animando toda hora que o cursor se move, e passar isso por state do React
// recriaria o componente inteiro a cada quadro.
const ORBIT_RADIUS = 110; // px
const ORBIT_SPEED = 0.6; // rad/s, velocidade angular do relógio comum
const EASE = 0.12; // suavização por quadro, mesmo valor de InteractiveGridImage
const REVEAL_DELAY_MS = 900; // tempo até a mensagem aparecer, depois que a órbita começa
const LINE_OPACITY = 0.35;

export function SkillsOrbit({
  skills,
  message,
}: {
  skills: string[];
  message: string;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const messageRef = useRef<HTMLDivElement>(null);

  const [revealMessage, setRevealMessage] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    const container = containerRef.current;
    if (!container) return;

    let raf = 0;
    let orbiting = false;
    let revealTimer: number | null = null;
    let angleClock = 0;
    let lastTime = performance.now();

    const mouse = { x: 0, y: 0 };
    // Posição "de repouso" de cada tag, relativa ao container: medida de
    // novo sempre que a órbita começa, porque o layout (flex-wrap) muda de
    // largura da tela e não dá pra confiar numa medida antiga.
    const natural: { x: number; y: number }[] = [];
    const current = skills.map(() => ({ x: 0, y: 0 }));
    const angle0 = skills.map((_, i) => (i / skills.length) * Math.PI * 2);

    function measureNatural() {
      const containerBox = container!.getBoundingClientRect();
      natural.length = 0;
      for (const el of tagRefs.current) {
        if (!el) continue;
        const prevTransform = el.style.transform;
        el.style.transform = "";
        const box = el.getBoundingClientRect();
        el.style.transform = prevTransform;
        natural.push({
          x: box.left - containerBox.left + box.width / 2,
          y: box.top - containerBox.top + box.height / 2,
        });
      }
    }

    function onMouseMove(event: MouseEvent) {
      const box = container!.getBoundingClientRect();
      mouse.x = event.clientX - box.left;
      mouse.y = event.clientY - box.top;
    }

    function onMouseEnter() {
      measureNatural();
      orbiting = true;
      if (revealTimer !== null) window.clearTimeout(revealTimer);
      revealTimer = window.setTimeout(() => setRevealMessage(true), REVEAL_DELAY_MS);
    }

    function onMouseLeave() {
      orbiting = false;
      if (revealTimer !== null) {
        window.clearTimeout(revealTimer);
        revealTimer = null;
      }
      setRevealMessage(false);
    }

    function frame(time: number) {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      if (orbiting) angleClock += ORBIT_SPEED * dt;

      skills.forEach((_, i) => {
        const el = tagRefs.current[i];
        const line = lineRefs.current[i];
        const rest = natural[i];
        if (!el) return;

        let targetX = 0;
        let targetY = 0;
        let centerX = rest?.x ?? 0;
        let centerY = rest?.y ?? 0;

        if (orbiting && rest) {
          const angle = angle0[i] + angleClock;
          const orbitX = mouse.x + Math.cos(angle) * ORBIT_RADIUS;
          const orbitY = mouse.y + Math.sin(angle) * ORBIT_RADIUS;
          targetX = orbitX - rest.x;
          targetY = orbitY - rest.y;
        }

        current[i].x += (targetX - current[i].x) * EASE;
        current[i].y += (targetY - current[i].y) * EASE;
        el.style.transform = `translate(${current[i].x}px, ${current[i].y}px)`;

        if (rest) {
          centerX = rest.x + current[i].x;
          centerY = rest.y + current[i].y;
        }

        if (line) {
          line.setAttribute("x1", String(centerX));
          line.setAttribute("y1", String(centerY));
          line.setAttribute("x2", String(mouse.x));
          line.setAttribute("y2", String(mouse.y));
          line.style.opacity = orbiting ? String(LINE_OPACITY) : "0";
        }
      });

      const messageEl = messageRef.current;
      if (messageEl) {
        messageEl.style.transform = `translate(${mouse.x}px, ${mouse.y}px) translate(-50%, -50%)`;
      }

      raf = requestAnimationFrame(frame);
    }

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseenter", onMouseEnter);
    container.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (revealTimer !== null) window.clearTimeout(revealTimer);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [skills, reduceMotion]);

  // Quem pede menos movimento no sistema recebe as tags paradas na grade,
  // sem linha, sem órbita, sem mensagem: mesma vitrine, sem o movimento.
  if (reduceMotion) {
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="type-mono inline-block border border-line px-3 py-1.5"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-2">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {skills.map((skill, i) => (
          <line
            key={skill}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted transition-opacity duration-300"
            style={{ opacity: 0 }}
          />
        ))}
      </svg>

      {skills.map((skill, i) => (
        <span
          key={skill}
          ref={(el) => {
            tagRefs.current[i] = el;
          }}
          className="type-mono relative inline-block border border-line px-3 py-1.5"
        >
          {skill}
        </span>
      ))}

      <AnimatePresence>
        {revealMessage && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute left-0 top-0 z-10"
          >
            {/* Sem .type-mono aqui de propósito (mesmo critério do tooltip
                em BoringToggle e da descrição no menu): a classe força caixa
                alta, e essa frase é comprida demais pra ler bem em versal.
                Fonte mono só no family. */}
            <div
              ref={messageRef}
              className="inline-flex items-center whitespace-nowrap border border-line bg-background px-6 py-3 font-mono text-sm tracking-wide"
            >
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
