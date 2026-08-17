"use client";

import { useEffect, useState } from "react";
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
// Sem tela em Modo Boring (mesmo critério de "informação, não vitrine" do
// resto do modo) nem pra quem pede menos movimento (troca instantânea, sem
// o fade).
const MIN_MS = 600;
const MAX_MS = 3000;
const FADE_MS = 400;

export function SiteLoader() {
  const { isBoringMode } = useBoringMode();
  const reduceMotion = useReducedMotion();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (isBoringMode) return;
    let cancelled = false;
    const start = performance.now();

    function finish() {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      window.setTimeout(() => setReady(true), Math.max(0, MIN_MS - elapsed));
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
      className={`fixed inset-0 z-[300] flex items-center justify-center bg-background ${
        reduceMotion ? "" : "transition-opacity"
      }`}
      style={{
        transitionDuration: `${FADE_MS}ms`,
        opacity: ready ? 0 : 1,
        pointerEvents: ready ? "none" : "auto",
      }}
    >
      <span className="type-mono text-sm tracking-widest text-muted">
        {profile.name.toUpperCase()}
      </span>
    </div>
  );
}
