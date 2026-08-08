"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { MediaView } from "@/components/ui/MediaView";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Card do Playground. Três comportamentos possíveis, escolhidos pelos campos
// que o experimento tem:
//
// - Só `media` (a maioria): vitrine parada ou vídeo em loop, via MediaView,
//   sem nenhum aparato a mais.
// - `process` (bastidores reais, ex.: o teste de animação): a vitrine
//   normal continua até o hover, que troca pelos stills do processo em
//   ciclo (crossfade) com uma legenda em texto acompanhando o cursor.
// - `gallery` (uma série de peças, ex.: as ilustrações): entra em ciclo
//   sozinha, com ou sem hover, no lugar da vitrine normal; o hover só
//   acrescenta uma ascii art de uma linha (a peça de cada quadro) que
//   acompanha o cursor, no mesmo idioma "letreiro preso ao mouse" do
//   SkillsOrbit.
const PROCESS_CYCLE_MS = 1600;
const GALLERY_CYCLE_MS = 2800;
const TOOLTIP_OFFSET_X = 16;
// O cursor personalizado (ver cursor/hover.webp) é uma mãozinha de 56x63
// com o hotspot no topo, então ela ocupa quase 63px abaixo da posição real
// do mouse: um offset vertical raso deixava a legenda nascendo tampada pela
// própria mão.
const TOOLTIP_OFFSET_Y = 60;

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
  const gallery = experiment.gallery;
  const hasGallery = Boolean(gallery && gallery.length > 0);

  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [processIndex, setProcessIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const showProcess = hasProcess && hovering;
  const showAsciiTooltip = hasGallery && !reduceMotion && hovering;
  const showTooltip = showProcess || showAsciiTooltip;

  useEffect(() => {
    if (!showProcess || !process) return;
    const interval = window.setInterval(() => {
      setProcessIndex((i) => (i + 1) % process.length);
    }, PROCESS_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [showProcess, process]);

  useEffect(() => {
    if (!hasGallery || reduceMotion || !gallery) return;
    const interval = window.setInterval(() => {
      setGalleryIndex((i) => (i + 1) % gallery.length);
    }, GALLERY_CYCLE_MS);
    return () => window.clearInterval(interval);
  }, [hasGallery, reduceMotion, gallery]);

  useEffect(() => {
    if (!showTooltip) return;
    const box = mediaBoxRef.current;
    if (!box) return;
    function onMove(event: MouseEvent) {
      const rect = box!.getBoundingClientRect();
      const el = tooltipRef.current;
      if (!el) return;
      el.style.transform = `translate(${event.clientX - rect.left + TOOLTIP_OFFSET_X}px, ${event.clientY - rect.top + TOOLTIP_OFFSET_Y}px)`;
    }
    box.addEventListener("mousemove", onMove);
    return () => box.removeEventListener("mousemove", onMove);
  }, [showTooltip]);

  return (
    <figure
      className="group relative border border-line bg-background"
      onMouseEnter={() => {
        setProcessIndex(0);
        setHovering(true);
      }}
      onMouseLeave={() => setHovering(false)}
    >
      <div ref={mediaBoxRef} className="relative aspect-square overflow-hidden bg-surface">
        {!hasGallery && (
          <MediaView
            media={experiment.media}
            locale={locale}
            className={`h-full w-full object-cover transition-opacity duration-700 ease-out ${
              showProcess ? "opacity-0" : "opacity-100"
            }`}
          />
        )}

        {hasGallery &&
          gallery!.map((frame, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={frame.src}
              src={frame.src}
              alt={i === galleryIndex ? frame.alt[locale] : ""}
              aria-hidden={i !== galleryIndex}
              loading={i === 0 ? undefined : "lazy"}
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out"
              style={{ opacity: i === galleryIndex ? 1 : 0 }}
            />
          ))}

        {hasProcess &&
          process!.map((frame, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={frame.src}
              src={frame.src}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ease-out"
              style={{ opacity: showProcess && i === processIndex ? 1 : 0 }}
            />
          ))}

        {showTooltip && (
          <div
            ref={tooltipRef}
            aria-hidden
            className={`pointer-events-none absolute left-0 top-0 z-10 max-w-[75%] whitespace-normal border border-line bg-background px-3 py-1.5 font-mono tracking-wide ${
              showAsciiTooltip ? "text-sm" : "text-xs"
            }`}
          >
            {showProcess && process ? process[processIndex].caption[locale] : gallery![galleryIndex].asciiArt}
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
