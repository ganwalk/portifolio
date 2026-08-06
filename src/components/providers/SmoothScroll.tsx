"use client";

import { useEffect, useRef, useState } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Ease-in sutil na rolagem da roda do mouse, para uma navegação mais premium.
//
// Intercepta o wheel e desloca o scroll de verdade (window.scrollTo) por
// amortecimento com constante de tempo, o mesmo raciocínio da mola de
// CasesGrid, só que aplicado à rolagem em si, não a uma animação por cima
// dela. Continua sendo window.scrollY quem muda: useScroll (CasesGrid,
// MoonPhase), o scroll do teclado, da barra e do toque continuam nativos e
// sem mudança nenhuma, porque nenhum contêiner novo entra no lugar do
// documento.
//
// Ctrl/Cmd+wheel (zoom), gesto predominantemente horizontal e qualquer alvo
// com scroll próprio (o overlay de case em CasesGrid, por exemplo) passam
// direto, sem interceptação.
const TIME_CONSTANT = 0.09;

function isVerticallyScrollable(el: Element): boolean {
  const style = getComputedStyle(el);
  const scrolls = style.overflowY === "auto" || style.overflowY === "scroll";
  return scrolls && el.scrollHeight > el.clientHeight;
}

function hasScrollableAncestor(node: EventTarget | null): boolean {
  let el = node instanceof Element ? node : null;
  while (el && el !== document.body) {
    if (isVerticallyScrollable(el)) return true;
    el = el.parentElement;
  }
  return false;
}

export function SmoothScroll() {
  const { isBoringMode } = useBoringMode();
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const disabled = isBoringMode || prefersReduced;

  const targetRef = useRef(0);
  const animatingRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (disabled) return;

    // behavior: "instant" é obrigatório aqui: o html tem scroll-behavior:
    // smooth (globals.css), que faria cada chamada abaixo abrir a própria
    // animação suave do navegador, competindo com esta interpolação a cada
    // quadro e produzindo uma posição instável, em vez de um salto exato.
    let lastTime = performance.now();

    const step = () => {
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const current = window.scrollY;
      const diff = targetRef.current - current;
      if (Math.abs(diff) < 0.5) {
        window.scrollTo({ top: targetRef.current, behavior: "instant" });
        animatingRef.current = false;
        return;
      }

      const factor = 1 - Math.exp(-dt / TIME_CONSTANT);
      window.scrollTo({ top: current + diff * factor, behavior: "instant" });
      rafRef.current = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (hasScrollableAncestor(event.target)) return;
      if (getComputedStyle(document.documentElement).overflowY === "hidden") return;

      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (max <= 0) return;

      const lineHeight = 16;
      const delta =
        event.deltaMode === 1
          ? event.deltaY * lineHeight
          : event.deltaMode === 2
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      if (!animatingRef.current) targetRef.current = window.scrollY;
      targetRef.current = Math.min(Math.max(targetRef.current + delta, 0), max);
      event.preventDefault();

      if (!animatingRef.current) {
        animatingRef.current = true;
        lastTime = performance.now();
        rafRef.current = requestAnimationFrame(step);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      animatingRef.current = false;
    };
  }, [disabled]);

  return null;
}
