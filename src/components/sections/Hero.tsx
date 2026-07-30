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

// Hero em preto e branco: o nome em display gigante, uma palavra por linha,
// alinhado à esquerda, e o subtítulo em serif itálica logo abaixo.
//
// A lente é uma inversão: dentro do círculo que segue o mouse, tinta e papel
// trocam de lugar. A revelação usa máscara radial de borda suave, não recorte
// duro, então o círculo é difuso nas beiradas. Perto do CTA o raio encolhe,
// cedendo o palco ao clique. Em telas de toque nada disso roda: sem mousemove,
// o raio fica em zero.

const LENS_MAX = 210;
const LENS_MIN = 40;

function HeroContent({
  dict,
  mirrored,
  ctaRef,
}: {
  dict: Dictionary;
  /** Cópia dentro da lente: entra pronta, sem repetir a animação de entrada. */
  mirrored?: boolean;
  ctaRef?: React.RefObject<HTMLAnchorElement | null>;
}) {
  const reveal = (index: number): object =>
    mirrored
      ? {}
      : {
          initial: { y: 40, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.35 + index * 0.12,
          },
        };

  const words = profile.name.split(" ");

  // flex-1, e não h-full: altura percentual não resolve contra um pai que só
  // ganha altura por flex-grow, e o justify-between viraria letra morta.
  return (
    <div className="flex flex-1 flex-col justify-between px-4 pb-8 pt-16 sm:px-8 sm:pt-24">
      <div>
        <h1 className="type-display text-[17vw] leading-[0.84] sm:text-[12vw]">
          {words.map((word, index) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={mirrored ? undefined : { y: "108%" }}
                animate={mirrored ? undefined : { y: 0 }}
                transition={
                  mirrored
                    ? undefined
                    : {
                        duration: 0.95,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.1 + index * 0.13,
                      }
                }
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.p
          {...reveal(1)}
          className="type-serif-display mt-5 text-[6.5vw] italic text-muted sm:text-[3.6vw]"
        >
          {dict.hero.subtitle}
        </motion.p>
      </div>

      <div className="mt-12 flex flex-col gap-8">
        <motion.div {...reveal(2)}>
          <a
            ref={ctaRef}
            href="#work"
            tabIndex={mirrored ? -1 : undefined}
            className="type-mono group inline-flex items-center gap-3"
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
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${x}px ${y}px, black 0%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,0.4) 72%, transparent 100%)`;

  const onMouseMove = (event: React.MouseEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);

    // Perto do CTA a lente encolhe: o raio é função da distância ao botão.
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
      <div className="relative flex flex-1">
        <HeroContent dict={dict} ctaRef={ctaRef} />

        {/* Cópia invertida, revelada pela lente */}
        <motion.div
          aria-hidden
          className="lens-invert pointer-events-none absolute inset-0 flex"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <HeroContent dict={dict} mirrored />
        </motion.div>
      </div>
    </section>
  );
}
