"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Imagem em grade interativa: fatiada em colunas e linhas que crescem perto
// do ponteiro (como o dock do macOS, só que em duas dimensões e sobre pixels
// de verdade, via canvas). Comportamento portado de
// github.com/ganwalk/ganwalkhorse, sem a tela de abertura nem o áudio
// reativo, que são específicos daquela peça e não fazem sentido aqui.
//
// Modo Boring não renderiza: é vitrine, não informação, mesmo critério do
// retrato animado da hero.

const COLS = 6;
const ROWS = 6;
const GAP = 1; // px CSS entre os quadros
const BOOST = 2.6; // quanto uma faixa cresce sob o ponteiro
const SIGMA = 0.16; // alcance da influência do ponteiro (fração do lado)
const EASE = 0.1; // suavização por quadro

interface InteractiveGridImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function InteractiveGridImage({
  src,
  alt,
  className = "",
}: InteractiveGridImageProps) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isBoringMode) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!container || !canvas || !ctx) return;

    const img = new Image();
    img.src = src;

    let W = 0;
    let H = 0;
    let dpr = 1;
    let raf = 0;

    const colW = new Array(COLS).fill(1);
    const rowW = new Array(ROWS).fill(1);
    const colT = new Array(COLS).fill(1);
    const rowT = new Array(ROWS).fill(1);
    const pointer = { x: 0, y: 0, active: false };

    function resize() {
      const rect = container!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
    }

    // converte pesos em posições acumuladas que somam o tamanho total
    function tracks(weights: number[], total: number) {
      let sum = 0;
      for (const w of weights) sum += w;
      const sizes = weights.map((w) => (w / sum) * total);
      const pos = [0];
      for (const s of sizes) pos.push(pos[pos.length - 1] + s);
      return { sizes, pos };
    }

    function updateTargets() {
      if (!pointer.active) {
        colT.fill(1);
        rowT.fill(1);
        return;
      }
      const { pos: cx } = tracks(colW, W);
      const { pos: cy } = tracks(rowW, H);
      const sx = SIGMA * W;
      const sy = SIGMA * H;
      for (let c = 0; c < COLS; c++) {
        const center = (cx[c] + cx[c + 1]) / 2;
        const d = (pointer.x - center) / sx;
        colT[c] = 1 + BOOST * Math.exp(-0.5 * d * d);
      }
      for (let r = 0; r < ROWS; r++) {
        const center = (cy[r] + cy[r + 1]) / 2;
        const d = (pointer.y - center) / sy;
        rowT[r] = 1 + BOOST * Math.exp(-0.5 * d * d);
      }
    }

    function ease() {
      for (let c = 0; c < COLS; c++) colW[c] += (colT[c] - colW[c]) * EASE;
      for (let r = 0; r < ROWS; r++) rowW[r] += (rowT[r] - rowW[r]) * EASE;
    }

    function draw() {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, W, H);

      const { sizes: cw, pos: cx } = tracks(colW, W);
      const { sizes: rh, pos: cy } = tracks(rowW, H);
      const srcW = img.naturalWidth / COLS;
      const srcH = img.naturalHeight / ROWS;

      let n = 1;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dx = cx[c] + GAP / 2;
          const dy = cy[r] + GAP / 2;
          const dw = Math.max(cw[c] - GAP, 0.5);
          const dh = Math.max(rh[r] - GAP, 0.5);

          ctx!.drawImage(img, c * srcW, r * srcH, srcW, srcH, dx, dy, dw, dh);

          const fs = Math.max(8, Math.min(dw, dh) * 0.16);
          const label = String(n);
          const pad = fs * 0.4;
          if (fs * 1.6 < dw - pad * 2 && fs * 1.6 < dh - pad * 2) {
            ctx!.fillStyle = "#ffffff";
            ctx!.textAlign = "right";
            ctx!.textBaseline = "top";
            ctx!.font = `600 ${fs}px "Helvetica Neue", Arial, sans-serif`;
            ctx!.fillText(label, dx + dw - pad, dy + pad);
          }
          n++;
        }
      }
    }

    function frame() {
      updateTargets();
      ease();
      draw();
      raf = requestAnimationFrame(frame);
    }

    function setPointer(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active =
        pointer.x >= 0 && pointer.x <= W && pointer.y >= 0 && pointer.y <= H;
    }

    function clearPointer() {
      pointer.active = false;
    }

    const observer = new ResizeObserver(() => {
      if (img.complete) resize();
    });
    observer.observe(container);

    canvas.addEventListener("pointermove", setPointer);
    canvas.addEventListener("pointerdown", setPointer);
    canvas.addEventListener("pointerleave", clearPointer);
    canvas.addEventListener("pointercancel", clearPointer);

    img.onload = () => {
      resize();
      raf = requestAnimationFrame(frame);
    };

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      canvas.removeEventListener("pointermove", setPointer);
      canvas.removeEventListener("pointerdown", setPointer);
      canvas.removeEventListener("pointerleave", clearPointer);
      canvas.removeEventListener("pointercancel", clearPointer);
    };
  }, [src, isBoringMode]);

  if (isBoringMode) return null;

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={alt}
      className={`relative touch-none ${className}`}
    >
      {/* absolute: um canvas em fluxo normal, com o próprio tamanho lido de
          volta do container a cada quadro (dpr, resize), realimenta o
          cálculo de "auto height" do container mesmo com aspect-square
          fixando a proporção, e os dois crescem juntos sem parar, uns
          pixels por vez. Fora do fluxo, o canvas nunca contribui para o
          tamanho do próprio pai. */}
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
