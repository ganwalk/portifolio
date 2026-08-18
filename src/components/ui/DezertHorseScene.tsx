"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Prévia leve, local, do Dezert Horse: sem o deserto em Three.js (pesado
// demais pra um card sempre montado), uma evocação do mesmo tema com o
// elemento que não podia faltar, o cavalo galopando no deserto. Silhueta
// desenhada em Canvas 2D (elipses e curvas simples, não uma foto nem um
// modelo 3D) com um ciclo de galope nas quatro pernas, parado no lugar
// (a câmera do site real também não reage ao cursor, só anima sozinha) com
// o gradiente de duna e a poeira à deriva por baixo sugerindo o avanço.

const GRAIN_COUNT = 40;

interface Grain {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
}

// Perna com dois segmentos (coxa/canela), pivô em (px,py). `swing` em
// [-1,1] varre o galope: positivo estende a perna pra frente, negativo
// pra trás, e a dobra do joelho acompanha a extensão.
function drawLeg(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  swing: number,
  len1: number,
  len2: number,
  width: number,
) {
  const a1 = Math.PI / 2 - swing * 0.55;
  const a2 = 0.5 + Math.max(0, swing) * 0.7;
  const kx = px + Math.cos(a1) * len1;
  const ky = py + Math.sin(a1) * len1;
  const a3 = a1 + a2;
  const fx = kx + Math.cos(a3) * len2;
  const fy = ky + Math.sin(a3) * len2;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(kx, ky);
  ctx.lineTo(fx, fy);
  ctx.stroke();
}

function drawHorse(ctx: CanvasRenderingContext2D, ox: number, oy: number, scale: number, phase: number) {
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);

  const t = phase * Math.PI * 2;
  ctx.translate(0, -Math.abs(Math.sin(t)) * 3);
  ctx.fillStyle = "#1a0d05";
  ctx.strokeStyle = "#1a0d05";

  const frontSwing = Math.sin(t);
  const backSwing = Math.sin(t + Math.PI);

  drawLeg(ctx, -40, 10, backSwing, 26, 24, 7);
  drawLeg(ctx, -32, 9, -backSwing, 26, 24, 7);
  drawLeg(ctx, 38, 4, frontSwing, 25, 23, 7);
  drawLeg(ctx, 30, 3, -frontSwing, 25, 23, 7);

  // Cauda
  ctx.beginPath();
  ctx.moveTo(-48, -10);
  ctx.quadraticCurveTo(-78, -18 - Math.sin(t) * 5, -88, 6);
  ctx.quadraticCurveTo(-92, 24, -74, 34);
  ctx.quadraticCurveTo(-82, 14, -68, 8);
  ctx.quadraticCurveTo(-58, 4, -48, -10);
  ctx.closePath();
  ctx.fill();

  // Corpo
  ctx.save();
  ctx.translate(-2, -2);
  ctx.rotate(-0.08);
  ctx.beginPath();
  ctx.ellipse(0, 0, 46, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Pescoço
  ctx.beginPath();
  ctx.moveTo(26, -10);
  ctx.quadraticCurveTo(44, -32, 55, -47);
  ctx.lineTo(68, -37);
  ctx.quadraticCurveTo(58, -14, 50, 8);
  ctx.quadraticCurveTo(38, 2, 26, -10);
  ctx.closePath();
  ctx.fill();

  // Cabeça
  ctx.save();
  ctx.translate(56, -46);
  ctx.rotate(0.35);
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(4, -6);
  ctx.quadraticCurveTo(20, -6, 24, 0);
  ctx.quadraticCurveTo(21, 9, 4, 9);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-6, -7);
  ctx.lineTo(-2, -20);
  ctx.lineTo(2, -6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

const HORSE_CYCLE_MS = 1400;

export function DezertHorseScene({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const grainsRef = useRef<Grain[]>([]);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

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
      grainsRef.current = Array.from({ length: GRAIN_COUNT }, () => ({
        x: Math.random() * width,
        y: height * 0.45 + Math.random() * height * 0.55,
        size: Math.random() * 1.6 + 0.6,
        speed: Math.random() * 0.15 + 0.05,
        wobble: Math.random() * 0.4,
      }));
    }
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function paint(horsePhase: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const gradient = ctx!.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, "#2a1408");
      gradient.addColorStop(0.55, "#7a3418");
      gradient.addColorStop(1, "#e08a3e");
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, width, height);

      ctx!.fillStyle = "rgba(255, 224, 189, 0.55)";
      for (const g of grainsRef.current) {
        ctx!.fillRect(g.x, g.y, g.size, g.size);
      }

      // O cavalo ocupa uma faixa em unidades locais de ~200 de largura
      // (x de -88 a 112) por ~80 de altura: a escala mira uns 55% da
      // largura do card, não uma fração arbitrária do menor lado (o card
      // do trio é bem mais alto que largo, min(width,height) media pela
      // altura e deixava o cavalo gigante, cortado nas bordas).
      const scale = (width * 0.55) / 200;
      drawHorse(ctx!, width * 0.55, height * 0.62, scale, horsePhase);
    }

    function frame(now: number) {
      if (!visible) {
        raf = null;
        return;
      }
      for (const g of grainsRef.current) {
        g.x += g.speed;
        g.y += Math.sin(g.x * 0.01) * g.wobble * 0.05;
        if (g.x > width) g.x = -4;
      }
      paint((now % HORSE_CYCLE_MS) / HORSE_CYCLE_MS);
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      paint(0.2);
      return () => resizeObserver.disconnect();
    }

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && raf === null) raf = requestAnimationFrame(frame);
      },
      { threshold: 0.01 },
    );
    intersectionObserver.observe(container);
    raf = requestAnimationFrame(frame);

    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [reduceMotion]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
