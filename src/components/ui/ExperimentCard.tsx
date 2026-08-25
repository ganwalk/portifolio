"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { CursorLabel } from "@/components/ui/CursorLabel";
import { ExperimentCaption } from "@/components/ui/ExperimentCaption";
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
//   ciclo (crossfade) com uma legenda em texto acompanhando o cursor, no
//   mesmo letreiro (janela fixa, texto correndo) do selo "ver caso" de
//   CasesGrid.
// - `gallery` (uma série de peças, ex.: as ilustrações): entra em ciclo
//   sozinha, com ou sem hover, no lugar da vitrine normal; o hover só
//   acrescenta uma ascii art de uma linha (a peça de cada quadro) que
//   acompanha o cursor. Mesma pílula do letreiro acima, mas sem o texto
//   correndo: a ascii já é curta, girar só atrapalharia a leitura, então
//   fica fixa na peça atual da galeria.
// - `hoverNote` (um comentário à parte, ex.: a produção musical): a vitrine
//   nunca troca, só a legenda aparece no hover, no mesmo letreiro rolante
//   do process acima (é uma frase, não uma ascii de uma linha só).
//
// Independente desses três, `dither` (também usado pela produção musical)
// cobre a vitrine com um retículo de meio-tom animado (xadrez preto e
// branco bem fino, cintilando, ver DITHER_PATTERN e .experiment-dither em
// globals.css) em mix-blend-mode overlay, sem tocar na cor da mídia por
// baixo: um efeito por cima, não uma versão dessaturada dela. O hover
// dissolve o retículo, revelando a mídia como já estava, colorida.
//
// As legendas (`CursorLabel`) moram fora do overflow-hidden da vitrine,
// direto no <figure>: podem transbordar o cartão inteiro, não só a imagem,
// senão a legenda corta perto da borda toda vez que o cursor chega lá.
const PROCESS_CYCLE_MS = 1600;
const GALLERY_CYCLE_MS = 2800;
const TOOLTIP_OFFSET_X = 16;
// O cursor personalizado (ver cursor/hover.webp) é uma mãozinha de 56x63
// com o hotspot no topo, então ela ocupa quase 63px abaixo da posição real
// do mouse: um offset vertical raso deixava a legenda nascendo tampada pela
// própria mão.
const TOOLTIP_OFFSET_Y = 60;

// Xadrez de 2px por quadrante (4px o par): um truque só de CSS
// (conic-gradient repetindo, sem imagem nenhuma), preto e branco puros
// porque quem preserva a cor do vídeo por baixo é o mix-blend-mode
// difference (inverte só onde cai o branco, mantém intacto onde cai o
// preto), não uma opacidade a mais na própria trama. 4px, não menor: o par
// precisa ser divisível por 2 pra .experiment-dither (ver globals.css)
// trocar de fase deslocando exatamente meio quadro.
const DITHER_PATTERN = "repeating-conic-gradient(#000 0% 25%, #fff 0% 50%)";

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
  const hoverNote = experiment.hoverNote;
  const hasHoverNote = Boolean(hoverNote && !reduceMotion);
  const hasDither = Boolean(experiment.dither && !reduceMotion);

  const mediaBoxRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [processIndex, setProcessIndex] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const showProcess = hasProcess && hovering;
  const showAsciiTooltip = hasGallery && !reduceMotion && hovering;
  const showHoverNote = hasHoverNote && hovering;
  const showTooltip = showProcess || showAsciiTooltip || showHoverNote;

  // Mesma mola do selo "ver caso" de CasesGrid: a posição bruta do cursor
  // vira a posição da legenda só depois de passar por uma spring, então ela
  // persegue o cursor com um atraso curto em vez de grudar nele.
  const pointerRawX = useMotionValue(0);
  const pointerRawY = useMotionValue(0);
  const leadX = useSpring(pointerRawX, { stiffness: 400, damping: 35, mass: 0.5 });
  const leadY = useSpring(pointerRawY, { stiffness: 400, damping: 35, mass: 0.5 });
  const labelX = useTransform(leadX, (v) => v + TOOLTIP_OFFSET_X);
  const labelY = useTransform(leadY, (v) => v + TOOLTIP_OFFSET_Y);

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
      pointerRawX.set(event.clientX - rect.left);
      pointerRawY.set(event.clientY - rect.top);
    }
    box.addEventListener("mousemove", onMove);
    return () => box.removeEventListener("mousemove", onMove);
  }, [showTooltip, pointerRawX, pointerRawY]);

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

        {hasDither && (
          <div
            aria-hidden
            className="experiment-dither pointer-events-none absolute inset-0 mix-blend-difference opacity-85 transition-opacity duration-700 ease-out group-hover:opacity-0"
            style={{ backgroundImage: DITHER_PATTERN, backgroundSize: "4px 4px" }}
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
      </div>

      {/* Fora do overflow-hidden da vitrine, de propósito: a legenda pode
          transbordar o cartão inteiro conforme o cursor se aproxima da
          borda, em vez de cortar junto com a imagem. */}
      {(hasProcess || hasGallery || hasHoverNote) && (
        <CursorLabel
          x={labelX}
          y={labelY}
          visible={showTooltip}
          scroll={showProcess || showHoverNote}
          width="w-56"
          text={
            showProcess && process
              ? process[processIndex].caption[locale]
              : hasGallery && gallery
                ? gallery[galleryIndex].asciiArt
                : hoverNote
                  ? hoverNote[locale]
                  : ""
          }
        />
      )}

      <ExperimentCaption experiment={experiment} locale={locale} />
    </figure>
  );
}
