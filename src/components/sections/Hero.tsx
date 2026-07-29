"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Hero com lente: manchete em sans display com uma palavra serif itálica de
// acento, e um círculo de vidro que segue o mouse revelando uma cópia do
// conteúdo com aberração cromática (a "tinta molhada" embaixo da lupa).
// O mesmo cursor acende um brilho radial no fundo. Perto do botão de CTA o
// raio da lente encolhe até quase sumir, cedendo o palco ao clique.
// Em telas de toque nada disso roda: sem mousemove, a lente fica com raio zero.

const LENS_MAX = 150;
const LENS_MIN = 22;

function Headline({ dict }: { dict: Dictionary }) {
  return (
    <h1 className="leading-[0.86]">
      <span className="type-display block text-[16vw] sm:text-[12vw]">
        {dict.hero.titleTop}
      </span>
      <span className="type-serif-display block pl-[6vw] text-[10vw] italic text-accent sm:text-[7vw]">
        {dict.hero.titleAccent}
      </span>
      <span className="type-display block pl-[14vw] text-[16vw] sm:text-[12vw]">
        {dict.hero.titleBottom}
      </span>
    </h1>
  );
}

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

  return (
    <div className="flex h-full flex-col justify-between px-4 pb-8 pt-16 sm:px-8 sm:pt-24">
      <motion.div {...reveal(0)}>
        <Headline dict={dict} />
      </motion.div>

      <div className="mt-12 flex flex-col gap-8">
        <motion.div {...reveal(2)}>
          <a
            ref={ctaRef}
            href="#work"
            tabIndex={chromatic ? -1 : undefined}
            className="btn-tactile type-mono inline-block rounded-full border border-line px-7 py-4"
          >
            {dict.hero.cta}
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

  const clip = useMotionTemplate`circle(${r}px at ${x}px ${y}px)`;
  const glow = useMotionTemplate`radial-gradient(560px circle at ${x}px ${y}px, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%)`;
  const lensSize = useTransform(r, (v) => v * 2);

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

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => radius.set(0)}
      className="texture-noise relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label={profile.name}
    >
      {/* Brilho de fundo que acompanha o cursor */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: glow }}
      />

      <div className="relative flex-1">
        <HeroContent dict={dict} ctaRef={ctaRef} />

        {/* Cópia cromática, visível só dentro do círculo da lente */}
        <motion.div
          aria-hidden
          className="lens-ink pointer-events-none absolute inset-0"
          style={{ clipPath: clip }}
        >
          <HeroContent dict={dict} chromatic />
        </motion.div>

        {/* O vidro da lente: aro, reflexo e leve distorção do que há atrás */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute rounded-full border border-line shadow-[inset_0_1px_8px_rgba(255,255,255,0.25),inset_0_-6px_14px_rgba(0,0,0,0.12)] backdrop-blur-[1.5px]"
          style={{
            width: lensSize,
            height: lensSize,
            left: x,
            top: y,
            translateX: "-50%",
            translateY: "-50%",
          }}
        />
      </div>
    </section>
  );
}
