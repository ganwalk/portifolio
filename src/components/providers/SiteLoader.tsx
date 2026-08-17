"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { profile } from "@/data/profile";

// Tela de entrada do próprio portfólio: cobre a página até as fontes
// carregarem e uma folga mínima passar, e SÓ ENTÃO revela o site. Existe
// por causa dos cartões de projeto que embutem os sites dos artistas ao
// vivo (Ganwalk, Dezert Horse, Pink Opala, ver CardLivePreview.tsx): eles
// montam de cara, mesmo fora de tela, então essa cortina inicial é o que
// dá a eles a folga de carregar em paralelo, por trás da tela de entrada,
// em vez de aparecerem pela metade conforme o visitante rola até ali.
//
// Não trava a página esperando os três iframes terminarem: não dá pra
// saber quando "terminaram" de verdade (sites de terceiros, cada um com
// o próprio ritmo de carregamento, um deles poderia travar a entrada
// inteira do portfólio por um problema de rede que não é nem daqui). A
// folga mínima (MIN_MS) já dá a eles um empurrão sem virar refém de
// nenhum. document.fonts.ready é o único critério de verdade: sem isso,
// o primeiro quadro visível troca de fonte embaixo do visitante.
//
// Estética: o mesmo tratamento da hero (nome em Whyte Inktrap, grão de
// filme animado por baixo) em vez de um texto pequeno solto — é a
// primeira coisa que o visitante vê, então vale carregar a mesma
// assinatura visual, não uma tela genérica à parte. O número embaixo é
// progresso PERCEBIDO, não medido de verdade (não tem como cronometrar
// "quanto falta" pra fontes carregarem): sobe rápido até uns 90% e só
// fecha em 100 quando `ready` vira true de verdade, o mesmo truque que a
// barra de carregamento do próprio Dezert Horse usa (ver
// artist-preview-cleanup.ts) — aqui por coincidência de gosto, não
// cópia; é o jeito padrão de dar feedback de progresso sem ter o dado
// real pra mostrar.
//
// Sem tela em Modo Boring (mesmo critério de "informação, não vitrine" do
// resto do modo) nem pra quem pede menos movimento (troca instantânea,
// sem o fade nem a contagem).
const MIN_MS = 900;
const MAX_MS = 3000;
const FADE_MS = 400;
const PROGRESS_CAP = 92;

export function SiteLoader() {
  const { isBoringMode } = useBoringMode();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (isBoringMode || reduceMotion) return;
    let cancelled = false;
    const start = performance.now();

    function tick(now: number) {
      if (cancelled) return;
      const elapsed = now - start;
      // easeOutCubic até o teto: sobe rápido no início, desacelera sem
      // nunca fechar sozinho (só `ready` fecha em 100, ver useEffect
      // seguinte).
      const t = Math.min(elapsed / MIN_MS, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.min(PROGRESS_CAP, Math.round(eased * PROGRESS_CAP)));
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isBoringMode, reduceMotion]);

  useEffect(() => {
    if (isBoringMode) return;
    let cancelled = false;
    const start = performance.now();

    function finish() {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      window.setTimeout(() => {
        setProgress(100);
        setReady(true);
      }, Math.max(0, MIN_MS - elapsed));
    }

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(finish);
    const fallback = window.setTimeout(finish, MAX_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [isBoringMode]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [ready, reduceMotion]);

  if (isBoringMode || !mounted) return null;

  return (
    <div
      aria-hidden
      className={`fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-background ${
        reduceMotion ? "" : "transition-opacity"
      }`}
      style={{
        transitionDuration: `${FADE_MS}ms`,
        opacity: ready ? 0 : 1,
        pointerEvents: ready ? "none" : "auto",
      }}
    >
      {/* .texture-noise define position: relative como CSS sem layer, que
          sempre vence qualquer utility de posicionamento do Tailwind
          (layered) na mesma tag, mesmo "absolute": ou colapsa o wrapper
          fixed pra altura do conteúdo, ou zera o tamanho desta div (sem
          conteúdo próprio, relative não estica sozinha). O inline style
          abaixo é a única coisa que bate um unlayered: garante absolute de
          verdade, com o grão só como classe. */}
      <div
        className="texture-noise texture-noise-animate"
        style={{ position: "absolute", inset: 0 }}
      />
      <span className="type-display type-inktrap text-[9vw] leading-none sm:text-[4vw]">
        {profile.name}
      </span>
      <div className="flex w-40 flex-col items-center gap-2 sm:w-56">
        <div className="h-px w-full bg-line">
          <div
            className="h-full bg-foreground"
            style={{
              width: `${reduceMotion ? 100 : progress}%`,
              transition: reduceMotion ? undefined : "width 0.15s linear",
            }}
          />
        </div>
        <span className="type-mono text-xs text-muted">
          {String(reduceMotion ? 100 : progress).padStart(3, "0")}%
        </span>
      </div>
    </div>
  );
}
