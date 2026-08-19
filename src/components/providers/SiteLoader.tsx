"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { usePageLoadingPendingCount } from "@/contexts/PageLoadingContext";
import { profile } from "@/data/profile";
import { moonPath, MOON_CENTER, MOON_R } from "@/lib/moon-path";
import { CURTAIN_CYCLE_MS, StripeCurtain } from "./StripeCurtain";

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
// repetida 5 vezes logo abaixo do nome: cada uma surge num instante real
// escalonado depois do mount (MOON_REVEAL_DELAYS_MS) e, assim que surge,
// entra num ciclo de fases contínuo regido pelo tempo real decorrido, não
// por uma porcentagem de progresso. Isso importa porque a espera hoje não
// tem duração fixa (pode travar bem além de MIN_MS esperando telas de
// carregamento aninhadas, ver NESTED_LOADING_MAX_MS): um progresso falso
// que sobe rápido e capa continuaria girando as luas só até o teto, depois
// congeladas enquanto a espera de verdade seguia por trás. Presas ao
// relógio, elas giram pelo tempo que a espera de fato durar, curta ou
// longa. Como cada lua começa a girar num instante diferente, a qualquer
// momento elas estão em fases diferentes umas das outras: é isso que dá a
// impressão de "andar".
//
// No instante em que o site aparece (ready), dispara literalmente a mesma
// cortina que a troca Boring/Criativo usa (StripeCurtain.tsx): as réguas
// fecham sobre a tela de entrada (nome + luas), escondem a troca por um
// instante (onCovered), e abrem revelando o site de verdade por baixo. Não é
// mais um flash branco imitando a mesma duração, é o mesmo componente, o
// mesmo gesto.
//
// Sem tela em Modo Boring (mesmo critério de "informação, não vitrine" do
// resto do modo) nem pra quem pede menos movimento (troca instantânea,
// sem cortina, sem luas).
const MIN_MS = 900;
const MAX_MS = 3000;
// Teto absoluto pra esperar telas de carregamento aninhadas (hoje, só a
// prévia ao vivo do Dezert Horse, ver PageLoadingContext.tsx) terminarem
// antes de revelar o site de qualquer jeito: bem maior que MAX_MS (o teto
// só das fontes) porque uma prévia embutida pode legitimamente levar mais
// alguns segundos, mas ainda finito, pra nunca prender a entrada do site
// esperando por uma prévia que nunca chega perto da viewport.
const NESTED_LOADING_MAX_MS = 6000;

// Instante real (ms desde o mount) em que cada lua surge: escalonado, não
// uma fração de progresso, pra continuar fazendo sentido não importa
// quanto a espera de verdade acabar durando. O giro em si (fase contínua,
// infinita) e o aparecimento (opacidade) são @keyframes CSS estáticos —
// ver globals.css, seção "Luas da tela de entrada" — não algo montado por
// este componente: o giro roda no compositor, fora do fio principal, e
// continua girando mesmo com a página de verdade ocupada montando por
// baixo do loader (WebGL/Three.js/Canvas dos cases), em vez de engasgar
// bem no instante em que a entrada está prestes a terminar (lia como
// "trava no final" quando isso rodava em JS, via requestAnimationFrame).
// Só o atraso de cada lua (--moon-delay) é passado daqui.
const MOON_REVEAL_DELAYS_MS = [0, 220, 440, 660, 880];

function LoaderMoons() {
  return (
    <div className="flex items-center gap-3 sm:gap-4" aria-hidden>
      {MOON_REVEAL_DELAYS_MS.map((delay, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className="site-loader-moon h-4 w-4 sm:h-5 sm:w-5"
          style={{ "--moon-delay": `${delay}ms` } as CSSProperties}
        >
          <circle
            cx={MOON_CENTER}
            cy={MOON_CENTER}
            r={MOON_R}
            className="fill-transparent stroke-line"
            strokeWidth={1}
          />
          <path
            d={moonPath(0)}
            className="site-loader-moon-path fill-foreground"
            style={{ "--moon-delay": `${delay}ms` } as CSSProperties}
          />
        </svg>
      ))}
    </div>
  );
}

export function SiteLoader() {
  const { isBoringMode } = useBoringMode();
  const reduceMotion = useReducedMotion();
  const pendingNestedLoaders = usePageLoadingPendingCount();
  const [ready, setReady] = useState(false);
  const [mounted, setMounted] = useState(true);
  const [curtainKey, setCurtainKey] = useState(0);
  const [contentHidden, setContentHidden] = useState(false);
  const [fontsSettled, setFontsSettled] = useState(false);
  // Só pode ler performance.now() dentro de efeito (chamar função impura
  // durante a renderização quebra a regra de pureza dos hooks): nasce nulo
  // e ganha o instante real no primeiro efeito abaixo, que roda antes de
  // qualquer um dos outros que dependem dele (ordem de declaração é ordem
  // de execução no mount).
  const startRef = useRef<number | null>(null);
  const finishScheduledRef = useRef(false);
  const readyRef = useRef(false);

  useEffect(() => {
    startRef.current = performance.now();
  }, []);

  // Fontes carregadas (ou o teto MAX_MS, o que vier primeiro) é só metade
  // do critério agora: vira estado (fontsSettled) em vez de chamar `finish`
  // direto, porque a decisão de revelar o site também depende de quantas
  // telas de carregamento aninhadas ainda estão pendentes (ver o efeito
  // seguinte), e só um valor em estado consegue disparar aquele efeito de
  // novo quando o resto do critério muda.
  useEffect(() => {
    if (isBoringMode) return;
    let cancelled = false;

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    fontsReady.then(() => {
      if (!cancelled) setFontsSettled(true);
    });
    const fallback = window.setTimeout(() => setFontsSettled(true), MAX_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
  }, [isBoringMode]);

  // O site só se dá como pronto quando as fontes tiverem chegado E toda
  // tela de carregamento aninhada (usePageLoadingRegistration, ver
  // PageLoadingContext.tsx) tiver terminado, sem exceção, respeitando o
  // piso MIN_MS de qualquer jeito (contra `startRef`, o mesmo instante nos
  // dois efeitos). NESTED_LOADING_MAX_MS é o teto absoluto contra esperar
  // pra sempre por uma tela aninhada que nunca resolve (uma prévia que
  // nunca chega perto da viewport, por exemplo): ancorado em `startRef`,
  // não estica a cada nova rodada do efeito, só força a entrada quando o
  // relógio bate, pendências ou não.
  useEffect(() => {
    if (isBoringMode || ready || !fontsSettled) return;

    // Sempre já setado a esta altura: fontsSettled só vira true depois do
    // efeito de mount (acima) já ter rodado, seja pela resolução real das
    // fontes, seja pelo teto MAX_MS (3s), ambos bem depois do mount em si.
    const start = startRef.current ?? performance.now();

    function finish() {
      if (finishScheduledRef.current) return;
      finishScheduledRef.current = true;
      const elapsed = performance.now() - start;
      window.setTimeout(() => {
        setReady(true);
      }, Math.max(0, MIN_MS - elapsed));
    }

    if (pendingNestedLoaders === 0) {
      finish();
      return;
    }

    const remaining = Math.max(0, start + NESTED_LOADING_MAX_MS - performance.now());
    const hardFallback = window.setTimeout(finish, remaining);
    return () => window.clearTimeout(hardFallback);
  }, [isBoringMode, ready, fontsSettled, pendingNestedLoaders]);

  // Assim que o site fica pronto, dispara um ciclo da cortina (fecha,
  // esconde a troca, abre) em vez de um fade de opacidade próprio. Sem
  // movimento reduzido, a cortina nem monta (ver a condição de render mais
  // abaixo, que já esconde o conteúdo direto nesse caso).
  useEffect(() => {
    if (!ready || reduceMotion || readyRef.current) return;
    readyRef.current = true;
    setCurtainKey((k) => k + 1);
  }, [ready, reduceMotion]);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setMounted(false), reduceMotion ? 0 : CURTAIN_CYCLE_MS);
    return () => window.clearTimeout(timeout);
  }, [ready, reduceMotion]);

  if (isBoringMode || !mounted) return null;

  const contentVisible = !contentHidden && !(reduceMotion && ready);

  return (
    <>
      {contentVisible && (
        <div
          aria-hidden
          className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 bg-background"
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
          <span className="type-display type-inktrap px-6 text-center text-[9vw] leading-none sm:text-[4vw]">
            {profile.name}
          </span>
          {!reduceMotion && <LoaderMoons />}
        </div>
      )}
      {!reduceMotion && (
        <StripeCurtain
          triggerKey={curtainKey}
          onCovered={() => setContentHidden(true)}
          // bg-background, não bg-foreground (o padrão, usado na troca de
          // modo): ali a cortina cobre um flash preto de propósito, um corte
          // dramático entre dois modos que podem até ter temas diferentes.
          // Aqui embaixo os dois lados já são a MESMA cor (a tela de entrada
          // já é bg-background, ver acima): cobrir com preto criava um
          // flash preto solto no meio de uma transição clara-pra-clara, sem
          // relação com nenhum dos dois lados, que lia como tela quebrada,
          // não como cortina. Com a mesma cor dos dois lados, fechar não se
          // vê (não tem o que ver, cor idêntica) e abrir revela o site de
          // verdade por baixo: a réguas continuam fazendo o gesto, só sem o
          // flash que não pertencia a lugar nenhum.
          colorClassName="bg-background"
          zIndexClassName="z-[301]"
        />
      )}
    </>
  );
}
