"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Reconstrução do efeito de verdade da Experiência II do Ganwalk (ver
// App2.draw e Nav.goToExperience2 no código-fonte publicado): um vídeo
// vira arte de partículas amostrando o brilho de cada célula de uma
// grade e desenhando ali uma letra de "ganwalk", tamanho e cor proporcionais
// ao brilho amostrado (mesmo algoritmo, mesma palavra ciclando como
// conjunto de caracteres).
//
// O vídeo é o mesmo "clipe original" que a própria Experiência II carrega
// por padrão (this.ORIGINAL_CLIP no código-fonte, o que o botão "Clipe"
// do site real usa: github.com/ganwalk/ganwalkascii). Recortado (15s de
// um trecho com fundo escuro, o mais favorável ao efeito: a amostragem só
// desenha onde o brilho passa de THRESHOLD) e recomprimido bem pequeno
// (480x360, sem áudio, WebM/VP9 como fonte principal e MP4/H.264 como
// fallback, os dois bem abaixo de 500 KB) só pra alimentar a amostragem:
// ninguém assiste esse vídeo de verdade, ele nunca aparece por baixo do
// efeito.
const CHARS = "ganwalk";
const GRID_RES = 26;
const THRESHOLD = 40;
const AMBER = { r: 255, g: 200, b: 0 };

export function GanwalkAsciiVideo({ className = "" }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hiddenRef = useRef<HTMLCanvasElement | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!video || !canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (!hiddenRef.current) hiddenRef.current = document.createElement("canvas");
    const hidden = hiddenRef.current;
    const hiddenCtx = hidden.getContext("2d", { willReadFrequently: true });
    if (!hiddenCtx) return;

    let raf: number | null = null;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function resize() {
      const rect = container!.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function draw() {
      if (!video!.videoWidth) return;
      const aspect = width / height;
      const gw = aspect >= 1 ? Math.floor(GRID_RES * 2 * aspect) : Math.floor(GRID_RES * 2);
      const gh = aspect >= 1 ? Math.floor(GRID_RES * 2) : Math.floor((GRID_RES * 2) / aspect);
      if (hidden.width !== gw || hidden.height !== gh) {
        hidden.width = gw;
        hidden.height = gh;
      }
      const sW = video!.videoWidth;
      const sH = video!.videoHeight;
      const sa = sW / sH;
      const ga = gw / gh;
      let sx = 0;
      let sy = 0;
      let sw = sW;
      let sh = sH;
      if (sa > ga) {
        sw = sH * ga;
        sx = (sW - sw) / 2;
      } else {
        sh = sW / ga;
        sy = (sH - sh) / 2;
      }
      hiddenCtx!.drawImage(video!, sx, sy, sw, sh, 0, 0, gw, gh);
      const data = hiddenCtx!.getImageData(0, 0, gw, gh).data;

      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = "#000000";
      ctx!.fillRect(0, 0, width, height);
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";

      const cw = width / gw;
      const chH = height / gh;
      let ci = 0;
      for (let y = 0; y < gh; y++) {
        for (let x = 0; x < gw; x++) {
          const i = (y * gw + x) * 4;
          const v = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          if (v < THRESHOLD) continue;
          const char = CHARS[ci % CHARS.length];
          ci++;
          const t = v / 255;
          ctx!.fillStyle = `rgb(${Math.floor(AMBER.r * t)}, ${Math.floor(AMBER.g * t)}, ${Math.floor(AMBER.b * t)})`;
          const size = Math.max(1, Math.floor(t * chH * 1.4));
          ctx!.font = `${size}px monospace`;
          ctx!.fillText(char, x * cw + cw / 2, y * chH + chH / 2);
        }
      }
    }

    function frame() {
      if (!visible) {
        raf = null;
        return;
      }
      draw();
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      const onLoaded = () => {
        video.currentTime = 2;
      };
      const onSeeked = () => {
        draw();
        video.pause();
      };
      video.addEventListener("loadedmetadata", onLoaded);
      video.addEventListener("seeked", onSeeked);
      return () => {
        resizeObserver.disconnect();
        video.removeEventListener("loadedmetadata", onLoaded);
        video.removeEventListener("seeked", onSeeked);
      };
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) {
          video.play().catch(() => {});
          if (raf === null) raf = requestAnimationFrame(frame);
        } else {
          video.pause();
        }
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(container);
    video.play().catch(() => {});
    raf = requestAnimationFrame(frame);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden bg-black ${className}`}>
      {/* display:none faz alguns navegadores pausarem a decodificação de
          quadro, e o drawImage do vídeo pro canvas passa a desenhar preto:
          precisa continuar "renderizado" de verdade, só invisível. */}
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        autoPlay
        preload="auto"
        className="pointer-events-none absolute h-px w-px opacity-0"
        aria-hidden
      >
        <source src={`${basePath}/videos/ganwalk-exp2-loop.webm`} type="video/webm" />
        <source src={`${basePath}/videos/ganwalk-exp2-loop.mp4`} type="video/mp4" />
      </video>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
