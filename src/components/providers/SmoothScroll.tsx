"use client";

import { useEffect, useState } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useBoringMode } from "@/contexts/BoringModeContext";

// Rolagem suave da página inteira, via Lenis.
//
// Roda de mouse, toque (deixado nativo, ver syncTouch abaixo) e barra de
// rolagem convivem com o mesmo amortecimento por trás de um único motor,
// testado em produção, em vez do rAF escrito à mão que cuidava só da roda.
// A ideia continua a mesma que já regia CasesGrid e a versão anterior deste
// arquivo: damping exponencial por constante de tempo (aqui, `lerp`), não
// duração fixa nem overshoot.
//
// Lenis roda POR CIMA do scroll de verdade (window.scrollTo, comportamento
// "instant" por baixo, para não brigar com o scroll-behavior: smooth do
// CSS), não troca o documento por um contêiner próprio: position sticky,
// teclado, barra, leitor de tela e o "encontrar na página" continuam
// exatamente como sempre foram. useScroll do Framer Motion (CasesGrid,
// MoonPhase) e o listener nativo de scroll (SiteFrame, ModeTransitionOverlay)
// não precisam saber que Lenis existe: todos leem window.scrollY, que
// continua sendo a fonte de verdade.
//
// syncTouch fica desligado (padrão da biblioteca): o momentum nativo do
// sistema em touch já é bom, e sincronizar com ele é o ponto mais instável
// da biblioteca em iOS mais antigo. Só a roda do mouse recebe o
// amortecimento extra, mesmo critério do arquivo anterior.
//
// Elemento com scroll próprio (o overlay de case em tela cheia de
// CasesGrid) não fica de fora deste amortecimento: em vez de um
// data-lenis-prevent excluindo-o, ele ganha a PRÓPRIA instância de Lenis,
// presa nele em vez de na janela (ver ExpandedCase em CasesGrid.tsx). As
// duas cooperam sozinhas, sem configuração extra: Lenis já resolve isso
// internamente (o wheel que a instância do overlay consome não chega à
// instância da página, via um sinalizador no próprio evento), então o
// overlay rola com o mesmo amortecimento do resto do site, em vez de cair
// pro scroll nativo só por morar num contêiner à parte.
//
// Desliga por completo (nem a instância chega a existir) em Modo Boring e
// para quem pede menos movimento no sistema, voltando ao scroll cru do
// navegador nos dois casos: Lenis também respeita prefers-reduced-motion
// sozinho, mas aqui o corte é total, coerente com o resto do Modo Boring,
// que mata toda interceptação, não só a suaviza.
const LERP = 0.11;

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

  useEffect(() => {
    if (disabled) return;

    const lenis = new Lenis({ lerp: LERP, syncTouch: false });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [disabled]);

  return null;
}
