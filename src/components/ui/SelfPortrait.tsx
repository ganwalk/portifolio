"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { framePosition, subscribeFrames } from "@/lib/portrait-frames";

// Retrato animado em flipbook, ao lado do nome na hero. Os quadros vivem numa
// folha de sprite (public/frames, gerada por scripts/build-frames.mjs) e a
// animação troca de quadro mexendo só em background-position, sem tocar no DOM.
//
// O basePath do GitHub Pages não é aplicado a url() dentro do CSS, então as
// URLs da folha entram por variável, montadas aqui, onde a variável de ambiente
// existe. A troca entre a folha leve e a grande fica no CSS, por media query.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function SelfPortrait({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return subscribeFrames((frame) => {
      element.style.backgroundPosition = framePosition(frame);
    });
  }, []);

  // Modo Boring é informação, não vitrine.
  if (isBoringMode) return null;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={`portrait-frames ${className}`}
      style={
        {
          "--portrait-sm": `url(${basePath}/frames/eu-sm.webp)`,
          "--portrait-lg": `url(${basePath}/frames/eu-lg.webp)`,
        } as CSSProperties
      }
    />
  );
}
