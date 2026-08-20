"use client";

import { useEffect, useRef } from "react";

// Cortina de réguas verticais reaproveitada tanto pela troca de Modo Criativo/
// Boring (ver ModeTransitionOverlay.tsx) quanto pela entrada no site (ver
// SiteLoader.tsx): mesmo desenho (réguas alternando a dobradiça entre topo e
// base, fechando em leque da esquerda para a direita até cobrir a tela por
// completo, segurando um instante, e abrindo no mesmo padrão) e o mesmo motor
// de animação, pra que "entrar no site" e "trocar de modo" sejam literalmente
// o mesmo gesto, não dois efeitos parecidos por coincidência.
//
// Não pode depender de CSS transition nem de Framer Motion: a regra global em
// globals.css que zera todo movimento quando `data-boring="true"` mata
// literalmente qualquer transition do documento inteiro no instante em que o
// atributo muda, incluindo indo PARA o Boring (é uma regra de CSS, então
// alcança qualquer elemento do DOM). Por isso a cortina anima via
// requestAnimationFrame, escrevendo transform a cada quadro na mão: nenhuma
// regra de CSS intercepta uma mutação de estilo feita assim.
//
// Disparo: incrementar (ou trocar) `triggerKey` roda um ciclo completo
// (cobre, segura, revela). O valor de montagem nunca dispara sozinho, só uma
// mudança de verdade depois disso.

export const STRIPE_COUNT = 8;
export const STRIPE_MS = 200;
export const STAGGER_MS = 26;
export const HOLD_MS = 90;
export const COVER_MS = STRIPE_MS + (STRIPE_COUNT - 1) * STAGGER_MS;
export const REVEAL_MS = COVER_MS;
export const CURTAIN_CYCLE_MS = COVER_MS + HOLD_MS + REVEAL_MS;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

// Progresso (0 a 1) de uma régua num dado instante, considerando o atraso
// que a régua carrega por causa da posição dela na fileira.
function stripeProgress(elapsedInPhase: number, index: number): number {
  const local = elapsedInPhase - index * STAGGER_MS;
  if (local <= 0) return 0;
  if (local >= STRIPE_MS) return 1;
  return local / STRIPE_MS;
}

export function StripeCurtain({
  triggerKey,
  onCovered,
  onDone,
  colorClassName = "bg-foreground",
  zIndexClassName = "z-[100]",
}: {
  /** Incrementar (ou trocar) este valor dispara um ciclo completo. O valor
   *  de montagem nunca dispara sozinho. */
  triggerKey: number;
  /** Chamado no instante exato em que a tela fica totalmente coberta, antes
   *  da cortina abrir de novo: o momento certo pra trocar o que está por
   *  baixo sem que a troca se veja. */
  onCovered?: () => void;
  /** Chamado no instante exato em que o ciclo termina de verdade (réguas já
   *  de volta a scaleY(0)), pelo relógio de quem realmente anima (o próprio
   *  requestAnimationFrame). Quem precisa desmontar algo só depois que a
   *  cortina termina (ver SiteLoader.tsx) deve esperar por este callback, não
   *  reimplementar a mesma duração num setTimeout à parte: um setTimeout
   *  independente conta a partir do instante em que o efeito rodou, não do
   *  instante em que o primeiro quadro do rAF de fato começou a animar (que
   *  vem sempre um pouco depois, e pode vir bem mais depois se o fio
   *  principal estiver ocupado montando o site por baixo), então os dois
   *  relógios podem se desalinhar. Nesse desalinhamento, quem desmonta cedo
   *  demais arranca a cortina do DOM no meio do gesto, ainda cobrindo parte
   *  da tela, revelando de golpe o que estiver por baixo (às vezes uma tela
   *  sólida, o site ainda não pintado) em vez da abertura terminar de
   *  verdade. */
  onDone?: () => void;
  colorClassName?: string;
  zIndexClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevKeyRef = useRef(triggerKey);
  const rafRef = useRef<number | null>(null);

  // Refs pros callbacks, não dependências do efeito abaixo: onCovered e
  // onDone chegam como função nova a cada render de quem usa a cortina (ex.:
  // SiteLoader recria as duas toda vez que ready/contentHidden/mounted
  // mudam). Se estivessem no array de dependências, cada uma dessas
  // recriações reexecutaria o efeito, cuja função de limpeza cancela o
  // requestAnimationFrame em andamento — e o corpo do efeito, ao rodar de
  // novo, esbarra direto no early return de `prevKeyRef.current ===
  // triggerKey` (ele já foi atualizado na primeira vez) e nunca reagenda um
  // novo quadro. Resultado: a cortina cancela a própria animação no meio do
  // ciclo e trava ali, coberta pra sempre, exatamente o "tela sólida que não
  // some" que este componente existe pra evitar. As refs guardam sempre a
  // versão mais recente sem disparar o efeito de novo.
  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onCoveredRef.current = onCovered;
    onDoneRef.current = onDone;
  });

  useEffect(() => {
    if (prevKeyRef.current === triggerKey) return;
    prevKeyRef.current = triggerKey;

    const container = containerRef.current;
    const stripes = stripeRefs.current;
    if (!container || stripes.some((s) => !s)) {
      onCoveredRef.current?.();
      onDoneRef.current?.();
      return;
    }

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      onCoveredRef.current?.();
      onDoneRef.current?.();
      return;
    }

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const start = performance.now();
    // Reatribuído a uma const própria: dentro do closure de frame() o TS não
    // conserva o estreitamento de null feito acima, mesmo sendo const.
    const overlayEl = container;
    overlayEl.style.pointerEvents = "auto";
    let covered = false;

    function frame(now: number) {
      const elapsed = now - start;

      // A tela já está totalmente coberta assim que o cover termina: é o
      // único instante em que trocar o conteúdo por baixo não se vê.
      if (!covered && elapsed >= COVER_MS) {
        onCoveredRef.current?.();
        covered = true;
      }

      stripes.forEach((el, i) => {
        if (!el) return;
        let scale: number;

        if (elapsed < COVER_MS) {
          scale = easeOutCubic(stripeProgress(elapsed, i));
        } else if (elapsed < COVER_MS + HOLD_MS) {
          scale = 1;
        } else if (elapsed < CURTAIN_CYCLE_MS) {
          const t = stripeProgress(elapsed - COVER_MS - HOLD_MS, i);
          scale = 1 - easeInCubic(t);
        } else {
          scale = 0;
        }

        el.style.transform = `scaleY(${scale})`;
      });

      if (elapsed < CURTAIN_CYCLE_MS) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        overlayEl.style.pointerEvents = "none";
        rafRef.current = null;
        onDoneRef.current?.();
      }
    }

    rafRef.current = requestAnimationFrame(frame);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [triggerKey]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={`pointer-events-none fixed inset-0 flex ${zIndexClassName}`}
    >
      {Array.from({ length: STRIPE_COUNT }).map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            stripeRefs.current[i] = el;
          }}
          className={`h-full flex-1 ${colorClassName} ${
            i % 2 === 0 ? "origin-top" : "origin-bottom"
          }`}
          // O repouso é "transform: scaleY(0)" via style inline, não a
          // utilitária scale-y-0 do Tailwind: aquela utilitária escreve na
          // propriedade CSS `scale`, separada de `transform`, e as duas se
          // compõem multiplicando uma pela outra na hora de renderizar. Como
          // o rAF só escreve em `transform`, um `scale-y-0` deixado para trás
          // travaria a régua em altura zero para sempre, não importa o que
          // `transform` diga.
          style={{ transform: "scaleY(0)" }}
        />
      ))}
    </div>
  );
}
