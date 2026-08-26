"use client";

import { useEffect, useRef } from "react";
import { ditherFrame, type DitherPhase } from "./dither";

// Canvas animado do retículo de Bayer usado nos cartões do Playground (ver
// ExperimentCard.tsx): redesenha a fonte (vídeo ou imagem) num canvas de
// baixa resolução a cada passo, sempre com uma fase diferente da matriz, o
// que lê como cintilação sem precisar recalcular a cada quadro de verdade
// (ver ditherFrame em dither.ts).
//
// `getSource`, não uma ref direta: no cartão de galeria (colagem-01), a
// fonte muda sozinha (cada quadro da galeria é um <img> diferente), então
// quem chama decide, a cada passo, qual elemento é "o atual" (ver
// ExperimentCard.tsx, onde isso é `() => galleryImgRefs.current[galleryIndex]`).
// Guardado numa ref própria e reatribuído a cada render (não a cada efeito):
// o laço de requestAnimationFrame roda sem reiniciar quando só a função
// muda de identidade, só quando `active`/`size` mudam de verdade.
//
// STEP_MS mais devagar que 60fps de propósito: nem o vídeo precisa de
// motion contínuo aqui (o efeito é decorativo, o design é retrô), e
// redesenhar a cada passo (não a cada quadro) é uma fração do custo.

const MATRIX_SIZE = 4;
const STEP_MS = 175;
// Ver a nota 3 em dither.ts: sem viés, peças claras (a maioria das do
// Playground) mal cruzavam o limiar da matriz em algum canto, o retículo
// quase sumia nelas. +42 deixa o retículo forte em qualquer peça.
const BIAS = 42;

// Quatro fases só, a metade da matriz (2 de 4) em cada eixo: o suficiente
// pra ler como cintilação, sem precisar passar pelas 16 combinações
// possíveis de uma matriz 4×4.
const PHASES: DitherPhase[] = [
  { x: 0, y: 0 },
  { x: 2, y: 0 },
  { x: 2, y: 2 },
  { x: 0, y: 2 },
];

function sourceDims(source: HTMLVideoElement | HTMLImageElement): { width: number; height: number } | null {
  if (source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || !source.videoWidth) return null;
    return { width: source.videoWidth, height: source.videoHeight };
  }
  if (!source.complete || !source.naturalWidth) return null;
  return { width: source.naturalWidth, height: source.naturalHeight };
}

export function useBayerDither(getSource: () => HTMLVideoElement | HTMLImageElement | null, active: boolean, size = 96) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const getSourceRef = useRef(getSource);
  // Fora do corpo do render (regra react-hooks/refs): mesmo efeito de
  // "sempre a versão mais nova", só que depois do render, não durante.
  useEffect(() => {
    getSourceRef.current = getSource;
  });

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    canvas.width = size;
    canvas.height = size;

    let raf = 0;
    let phaseIndex = 0;
    let lastStep = 0;

    const tick = (t: number) => {
      raf = requestAnimationFrame(tick);
      if (t - lastStep < STEP_MS) return;
      lastStep = t;
      const source = getSourceRef.current();
      if (!source) return;
      const dims = sourceDims(source);
      if (!dims) return;
      phaseIndex = (phaseIndex + 1) % PHASES.length;
      ditherFrame(ctx, source, dims.width, dims.height, size, size, MATRIX_SIZE, PHASES[phaseIndex], BIAS);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, size]);

  return canvasRef;
}
