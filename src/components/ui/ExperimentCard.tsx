"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MediaView } from "@/components/ui/MediaView";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Card do Playground. A maioria só mostra a mídia de vitrine (MediaView),
// mas quem tem `process` (bastidores reais) ganha um segundo comportamento
// no hover: em vez da vitrine parada, os stills do processo entram em
// ciclo (crossfade, um relógio simples) e uma legenda em caixa acompanha o
// cursor dizendo que etapa é aquela, no mesmo idioma "letreiro preso ao
// mouse" do SkillsOrbit. Sem `process`, o card nunca monta esse aparato.
const CYCLE_MS = 1600;
const CAPTION_OFFSET = 16;

export function ExperimentCard({
  experiment,
  locale,
}: {
  experiment: Experiment;
  locale: Locale;
}) {
  const reduceMotion = useReducedMotion();
  const process = experiment.process;
  const hasProcess = Boolean(process && process.length > 0 && !reduceMotion);

  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  const showProcess = hasProcess && hovering;

  useEffect(() => {
    if (!showProcess || !process) return;
    const interval = window.setInterval(() => {
      setFrameIndex((i) => (i + 1) % process.length);
    }, CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [showProcess, process]);

  useEffect(() => {
    if (!showProcess) return;
    const box = mediaBoxRef.current;
    if (!box) return;
    function onMove(event: MouseEvent) {
      const rect = box!.getBoundingClientRect();
      const el = captionRef.current;
      if (!el) return;
      el.style.transform = `translate(${event.clientX - rect.left + CAPTION_OFFSET}px, ${event.clientY - rect.top + CAPTION_OFFSET}px)`;
    }
    box.addEventListener("mousemove", onMove);
    return () => box.removeEventListener("mousemove", onMove);
  }, [showProcess]);

  return (
    <figure
      className="group relative border border-line bg-background"
      onMouseEnter={() => {
        setFrameIndex(0);
        setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={mediaBoxRef} className="relative aspect-square overflow-hidden bg-surface">
        <MediaView
          media={experiment.media}
          locale={locale}
          className={`h-full w-full object-cover transition-[transform,opacity] duration-700 ease-out group-hover:scale-105 ${
            showProcess ? "opacity-0" : "opacity-100"
          }`}
        />

        {hasProcess &&
          process!.map((frame, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={frame.src}
              src={frame.src}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
              style={{ opacity: showProcess && i === frameIndex ? 1 : 0 }}
            />
          ))}

        {showProcess && process && (
          <div
            ref={captionRef}
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-10 max-w-[75%] whitespace-normal border border-line bg-background px-3 py-1.5 font-mono text-xs tracking-wide"
          >
            {process[frameIndex].caption[locale]}
          </div>
        )}
      </div>

      <figcaption className="border-t border-line p-4">
        <span className="block font-medium">{experiment.title[locale]}</span>
        <span className="type-mono text-muted">{experiment.medium[locale]}</span>
      </figcaption>
    </figure>
  );
}
