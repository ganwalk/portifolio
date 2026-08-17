"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Prévia leve, local, do Dezert Horse: sem o deserto em Three.js (pesado
// demais pra um card sempre montado), uma evocação barata do mesmo tema,
// gradiente quente de duna ao entardecer com poeira de areia à deriva. Sem
// interatividade de propósito: a câmera do site real também não reage ao
// cursor, só anima sozinha (ver mouseMoveSelector ausente pro Dezert Horse
// nas notas de artist-preview-cleanup.ts, da versão anterior em iframe).

const GRAIN_COUNT = 46;

interface Grain {
  x: number;
  y: number;
  size: number;
  speed: number;
  wobble: number;
}

export function DuneDrift({ className = "" }: { className?: string }) {
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

    function paint() {
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
    }

    function frame() {
      if (!visible) {
        raf = null;
        return;
      }
      for (const g of grainsRef.current) {
        g.x += g.speed;
        g.y += Math.sin(g.x * 0.01) * g.wobble * 0.05;
        if (g.x > width) g.x = -4;
      }
      paint();
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      paint();
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
