"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Hero minimalista: o nome em display gigante, o subtítulo em serif itálica,
// e uma mancha de luz que segue o mouse revelando uma cópia do conteúdo com
// aberração cromática. A revelação usa máscara radial de borda suave, não
// recorte duro, então a lente é difusa nas beiradas.
// Perto do CTA a mancha encolhe, cedendo o palco ao clique.
// Em telas de toque nada disso roda: sem mousemove, o raio fica em zero.

const LENS_MAX = 210;
const LENS_MIN = 40;

function HeroContent({
  dict,
  chromatic,
  ctaRef,
}: {
  dict: Dictionary;
  chromatic?: boolean;
  ctaRef?: React.RefObject<HTMLAnchorElement | null>;
}) {
  const reveal = (index: number): object =>
    chromatic
      ? {}
      : {
          initial: { y: 40, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.15 + index * 0.12,
          },
        };

    // flex-1, e não h-full: altura percentual não resolve contra um pai que
    // só ganha altura por flex-grow, e o justify-between viraria letra morta.
  return (
    <div className="flex flex-1 flex-col justify-between px-4 pb-8 pt-16 sm:px-8 sm:pt-24">
      <div>
        <motion.h1
          {...reveal(0)}
          className="type-display text-[15vw] leading-[0.86] sm:text-[11vw]"
        >
          {profile.name}
        </motion.h1>
        <motion.p
          {...reveal(1)}
          className="type-serif-display mt-4 pl-[1vw] text-[7vw] italic text-accent sm:text-[4vw]"
        >
          {dict.hero.subtitle}
        </motion.p>
      </div>

      <div className="mt-12 flex flex-col gap-8">
        <motion.div {...reveal(2)}>
          <a
            ref={ctaRef}
            href="#work"
            tabIndex={chromatic ? -1 : undefined}
            className="type-mono group inline-flex items-center gap-3 text-foreground"
          >
            <span className="underline decoration-1 underline-offset-8">
              {dict.hero.cta}
            </span>
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-y-1"
            >
              ↓
            </span>
          </a>
        </motion.div>

        <motion.div
          {...reveal(3)}
          className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3"
        >
          <p className="type-mono text-muted">{dict.hero.facts[0]}</p>
          <p className="type-mono text-muted">{dict.hero.facts[1]}</p>
          <p className="type-mono text-muted">{dict.hero.availability}</p>
        </motion.div>
      </div>
    </div>
  );
}

export function Hero({ dict }: { dict: Dictionary }) {
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);
  const radius = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 250, damping: 28, mass: 0.6 });
  const y = useSpring(mouseY, { stiffness: 250, damping: 28, mass: 0.6 });
  const r = useSpring(radius, { stiffness: 180, damping: 24 });

  // Máscara de borda suave: opaca no centro, dissolvendo até o raio cheio.
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${x}px ${y}px, black 0%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.35) 68%, transparent 100%)`;
  const glow = useMotionTemplate`radial-gradient(620px circle at ${x}px ${y}px, color-mix(in srgb, var(--accent) 14%, transparent), transparent 72%)`;

  const onMouseMove = (event: React.MouseEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);

    // Perto do CTA a mancha encolhe: o raio é função da distância ao botão.
    const cta = ctaRef.current?.getBoundingClientRect();
    if (cta) {
      const distance = Math.hypot(
        event.clientX - (cta.left + cta.width / 2),
        event.clientY - (cta.top + cta.height / 2),
      );
      const t = Math.min(Math.max((distance - 90) / 340, 0), 1);
      radius.set(LENS_MIN + (LENS_MAX - LENS_MIN) * t);
    } else {
      radius.set(LENS_MAX);
    }
  };

  // A barra do topo é sticky, logo ocupa espaço no fluxo: descontar a altura
  // dela é o que faz hero mais cabeçalho darem exatamente uma tela.
  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => radius.set(0)}
      className="texture-noise relative flex min-h-[calc(100svh-3.5rem)] flex-col overflow-hidden"
      aria-label={profile.name}
    >
      {/* Brilho de fundo que acompanha o cursor */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      <div className="relative flex flex-1">
        <HeroContent dict={dict} ctaRef={ctaRef} />

        {/* Cópia cromática, revelada pela mancha de luz */}
        <motion.div
          aria-hidden
          className="lens-ink pointer-events-none absolute inset-0 flex"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <HeroContent dict={dict} chromatic />
        </motion.div>
      </div>
    </section>
  );
}
