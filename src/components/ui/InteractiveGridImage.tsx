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
  /** Uma frase (um array de palavras, uma por linha, alinhada à direita) por
   *  idioma do site. Cada quadro da grade recebe uma frase por vez, na
   *  ordem, ciclando (quadro 0 = idioma 0, quadro 1 = idioma 1, ...): o
   *  convite "fale comigo" aparece em todos os idiomas ao mesmo tempo, não
   *  repetido igual em todo quadro. */
  phrases: readonly (readonly string[])[];
  className?: string;
}

export function InteractiveGridImage({
  src,
  alt,
  phrases,
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
    // Retângulo "cover" dentro da imagem original (crop centralizado, sem
    // esticar): recalculado a cada resize, porque a proporção do contêiner
    // muda entre mobile (aspect-[4/3]) e desktop (altura da coluna de
    // texto). Sem isso, dividir a imagem inteira em COLS×ROWS e desenhar
    // direto no retângulo do contêiner distorcia a foto pra proporção da
    // tela em vez de recortar.
    let cropX = 0;
    let cropY = 0;
    let cropW = 1;
    let cropH = 1;

    const colW = new Array(COLS).fill(1);
    const rowW = new Array(ROWS).fill(1);
    const colT = new Array(COLS).fill(1);
    const rowT = new Array(ROWS).fill(1);
    const pointer = { x: 0, y: 0, active: false };

    function updateCrop() {
      if (!img.naturalWidth || !img.naturalHeight || !W || !H) return;
      const containerAspect = W / H;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      if (imgAspect > containerAspect) {
        // Imagem relativamente mais larga: corta as laterais, mantém a
        // altura inteira.
        cropH = img.naturalHeight;
        cropW = cropH * containerAspect;
        cropX = (img.naturalWidth - cropW) / 2;
        cropY = 0;
      } else {
        // Imagem relativamente mais alta: corta topo/rodapé, mantém a
        // largura inteira.
        cropW = img.naturalWidth;
        cropH = cropW / containerAspect;
        cropX = 0;
        cropY = (img.naturalHeight - cropH) / 2;
      }
    }

    function resize() {
      const rect = container!.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(W * dpr);
      canvas!.height = Math.round(H * dpr);
      canvas!.style.width = `${W}px`;
      canvas!.style.height = `${H}px`;
      updateCrop();
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
      const srcW = cropW / COLS;
      const srcH = cropH / ROWS;

      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const dx = cx[c] + GAP / 2;
          const dy = cy[r] + GAP / 2;
          const dw = Math.max(cw[c] - GAP, 0.5);
          const dh = Math.max(rh[r] - GAP, 0.5);

          ctx!.drawImage(
            img,
            cropX + c * srcW,
            cropY + r * srcH,
            srcW,
            srcH,
            dx,
            dy,
            dw,
            dh,
          );

          // Um idioma por quadro, ciclando (ver comentário na prop
          // `phrases`): cada quadro é um convite num idioma diferente do
          // site, não um carimbo repetido. O ajuste ao tamanho segue o
          // mesmo raciocínio de antes (fonte proporcional ao lado menor do
          // quadro), mas medindo a largura de verdade de cada palavra
          // (measureText), já que o comprimento muda de idioma pra idioma, e
          // a altura precisa caber TODAS as linhas, não uma só.
          const words = phrases[(r * COLS + c) % phrases.length];
          const fs = Math.max(7, Math.min(dw, dh) * 0.1);
          const pad = fs * 0.4;
          const lineHeight = fs * 1.15;
          ctx!.font = `400 ${fs}px "Helvetica Neue", Arial, sans-serif`;
          const widestWord = Math.max(
            ...words.map((word) => ctx!.measureText(word).width),
          );
          const blockHeight = lineHeight * words.length;
          if (widestWord < dw - pad * 2 && blockHeight < dh - pad * 2) {
            ctx!.fillStyle = "#ffffff";
            ctx!.textAlign = "right";
            ctx!.textBaseline = "top";
            words.forEach((word, i) => {
              ctx!.fillText(word, dx + dw - pad, dy + pad + i * lineHeight);
            });
          }
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
  }, [src, phrases, isBoringMode]);

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
