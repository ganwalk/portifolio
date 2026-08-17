"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { profile } from "@/data/profile";
import { moonPath, MOON_CENTER, MOON_R } from "@/lib/moon-path";
import { MODE_TRANSITION_MS } from "./ModeTransitionOverlay";

// Tela de entrada do próprio portfólio: cobre a página até as fontes
// carregarem e uma folga mínima passar, e SÓ ENTÃO revela o site.
// document.fonts.ready é o único critério de verdade: sem isso, o
// primeiro quadro visível troca de fonte embaixo do visitante. A folga
// mínima (MIN_MS) garante que a entrada nunca pareça um pisca instantâneo
// em conexões rápidas, mesmo quando as fontes já estavam em cache.
//
// Estética: o mesmo tratamento da hero (nome em Whyte Inktrap, grão de
// filme animado por baixo) em vez de um texto pequeno solto. O indicador
// de progresso é a própria lua do cabeçalho do site (ver MoonPhase.tsx),
// repetida 5 vezes logo abaixo do nome: cada uma surge conforme o
// progresso avança (a 15/30/45/60/75%, a última com folga até 100% pra
// dar tempo de girar antes do site aparecer) e, assim que surge, entra
// num ciclo de fases próprio regido pelo mesmo `progress`. Como cada lua
// começa a girar num instante diferente, a qualquer momento elas estão em
// fases diferentes umas das outras: é isso que dá a impressão de "andar".
//
// No instante em que o site aparece (ready), dispara o mesmo tipo de
// entrada que a troca Boring/Criativo usa: uma tela branca cobrindo tudo,
// que se dissolve na mesma duração da animação real de troca de modo
// (MODE_TRANSITION_MS, ver ModeTransitionOverlay.tsx) em vez de inventar
// um tempo à parte.
//
// Sem tela em Modo Boring (mesmo critério de "informação, não vitrine" do
// resto do modo) nem pra quem pede menos movimento (troca instantânea,
// sem fade, sem luas, sem flash).
const MIN_MS = 900;
const MAX_MS = 3000;
const FADE_MS = 400;
const PROGRESS_CAP = 92;
// Maior das duas durações de saída: garante que nem a cortina (FADE_MS)
// nem o flash branco (MODE_TRANSITION_MS, bem mais longo) sejam cortados
// no meio do próprio fade ao desmontar o componente.
const UNMOUNT_MS = Math.max(FADE_MS, MODE_TRANSITION_MS);

const MOON_THRESHOLDS = [15, 30, 45, 60, 75];
// Progresso por volta completa de fase, depois que a lua surge. Precisa
// ser BEM maior que o espaçamento entre limiares (15 pontos): com um
// valor perto disso (ex.: 18), o deslocamento de fase entre duas luas
// vizinhas bate quase uma volta inteira (15/18 ≈ 0,83 de 1), e luas quase
// opostas no ciclo parecem posições aleatórias, não uma "andando" atrás
// da outra. Com 120, o deslocamento fica pequeno (15/120 = 0,125 de
// volta, um oitavo de fase), a diferença de uma lua pra próxima vira só
// mais um passo da mesma caminhada.
const MOON_CYCLE_SPAN = 120;

function moonPhaseAt(progress: number, threshold: number): number {
  const elapsed = progress - threshold;
  if (elapsed <= 0) return 0;
  return (elapsed / MOON_CYCLE_SPAN) % 1;
}

function LoaderMoons({ progress }: { progress: number }) {
  return (
    <div className="flex items-center gap-3 sm:gap-4" aria-hidden>
      {MOON_THRESHOLDS.map((threshold, i) => {
        const visible = progress >= threshold;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className="h-4 w-4 transition-opacity duration-300 sm:h-5 sm:w-5"
            style={{ opacity: visible ? 1 : 0 }}
          >
            <circle
              cx={MOON_CENTER}
              cy={MOON_CENTER}
              r={MOON_R}
              className="fill-transparent stroke-line"
              strokeWidth={1}
            />
            <path
              d={moonPath(visible ? moonPhaseAt(progress, threshold) : 0)}
              className="fill-foreground"
            />
          </svg>
        );
      })}
    </div>
  );
}

export function SiteLoader() {
  const { isBoringMode } = useBoringMode();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [flashOut, setFlashOut] = useState(false);
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

  // Dispara o flash branco só depois que o navegador já pintou um quadro
  // com ele a opacidade 1: sem esse atraso de um frame, montar e já
  // escrever opacity 0 no mesmo render não deixa nada pra transicionar,
  // o flash nunca aparece de verdade.
  useEffect(() => {
    if (!ready || reduceMotion) return;
    const raf = requestAnimationFrame(() => setFlashOut(true));
    return () => cancelAnimationFrame(raf);
  }, [ready, reduceMotion]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : UNMOUNT_MS);
    return () => window.clearTimeout(timeout);
  }, [ready, reduceMotion]);

  if (isBoringMode || !mounted) return null;

  return (
    <>
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
        {!reduceMotion && <LoaderMoons progress={progress} />}
      </div>
      {!reduceMotion && ready && (
        <div
          aria-hidden
          className="fixed inset-0 z-[301] bg-white transition-opacity"
          style={{
            transitionDuration: `${MODE_TRANSITION_MS}ms`,
            opacity: flashOut ? 0 : 1,
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}
