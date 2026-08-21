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
// Não pode depender de CSS transition/animation declaradas em classe: a
// regra global em globals.css que zera todo movimento quando
// `data-boring="true"` mata literalmente qualquer transition/animation do
// documento inteiro no instante em que o atributo muda, incluindo indo PARA
// o Boring (é uma regra de CSS, então alcança qualquer elemento do DOM). Por
// isso a cortina anima via Web Animations API (`el.animate(...)`), não CSS:
// uma Animation criada por script não é regida pela propriedade CSS
// `animation`, então aquela regra global não enxerga nem cancela isso.
//
// E não é um requestAnimationFrame escrevendo `transform` a cada quadro na
// mão (a primeira versão disto): num celular, hidratando a página real por
// baixo (WebGL/Canvas/Framer Motion dos cases), o fio principal pode ficar
// ocupado por centenas de ms bem no instante em que a cortina deveria estar
// animando. Um laço de rAF só roda quando o fio principal está livre pra
// chamar o callback: sob esse tipo de engasgo, ou os quadros vinham tarde
// demais e a pessoa via só um pedaço do gesto antes dele saltar pro final
// (o relógio é por tempo real decorrido, não por quadro), ou o próprio
// primeiro quadro atrasava tanto que o ciclo inteiro colapsava num
// `elapsed` já maior que a duração toda, sem nenhum quadro visível no meio:
// "a transição não disparou". Animação criada via Web Animations API em
// `transform`/`opacity` roda no compositor, fora do fio principal: continua
// pintando quadro a quadro ainda que o JavaScript esteja ocupado montando o
// resto da página, então o gesto sempre termina de tocar por inteiro, fio
// principal livre ou não.
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

// Aproximações em cubic-bezier dos mesmos easeOutCubic/easeInCubic de
// sempre (1-(1-t)³ e t³): as curvas padrão do easings.net pro par, e o
// formato que a Web Animations API entende por quadro.
const EASE_OUT_CUBIC = "cubic-bezier(0.33, 1, 0.68, 1)";
const EASE_IN_CUBIC = "cubic-bezier(0.32, 0, 0.67, 0)";

// Quadros-chave de UMA régua, com o atraso dela (posição na fileira) já
// embutido nos offsets em vez de um `delay` separado: como todas as réguas
// compartilham a MESMA duração total (CURTAIN_CYCLE_MS), dá pra descrever a
// timeline inteira de cada uma (parada, fecha, segura, abre, parada) como
// frações de 0 a 1 dessa duração. offset() satura em 1 pra régua de maior
// atraso (índice mais alto), cujo fim do "abre" cai bem em CURTAIN_CYCLE_MS.
function stripeKeyframes(index: number): Keyframe[] {
  const coverStart = index * STAGGER_MS;
  const coverEnd = coverStart + STRIPE_MS;
  const revealStart = COVER_MS + HOLD_MS + coverStart;
  const revealEnd = revealStart + STRIPE_MS;
  const offset = (ms: number) => Math.min(1, ms / CURTAIN_CYCLE_MS);

  return [
    { transform: "scaleY(0)", offset: offset(0) },
    { transform: "scaleY(0)", offset: offset(coverStart), easing: EASE_OUT_CUBIC },
    { transform: "scaleY(1)", offset: offset(coverEnd) },
    { transform: "scaleY(1)", offset: offset(revealStart), easing: EASE_IN_CUBIC },
    { transform: "scaleY(0)", offset: offset(revealEnd) },
    { transform: "scaleY(0)", offset: 1 },
  ];
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
   *  baixo sem que a troca se veja. Via setTimeout (não um evento da
   *  Animation): não precisa de precisão de quadro, a tela já está coberta
   *  de qualquer jeito nessa janela, só não pode nunca ATRASAR além dela. */
  onCovered?: () => void;
  /** Chamado no instante exato em que o ciclo termina de verdade (todas as
   *  réguas já resolvidas de volta a scaleY(0)), via Promise.all das
   *  próprias Animation.finished: quem precisa desmontar algo só depois que
   *  a cortina termina (ver SiteLoader.tsx) espera por este callback, não
   *  reimplementa a mesma duração num setTimeout à parte. Um setTimeout
   *  independente conta a partir de um instante diferente do que a Animation
   *  de fato usa internamente e pode se desalinhar; esperar pela conclusão
   *  real elimina esse desalinhamento por completo. */
  onDone?: () => void;
  colorClassName?: string;
  zIndexClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stripeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevKeyRef = useRef(triggerKey);
  const animationsRef = useRef<Animation[]>([]);

  // Refs pros callbacks, não dependências do efeito abaixo: onCovered e
  // onDone chegam como função nova a cada render de quem usa a cortina (ex.:
  // SiteLoader recria as duas toda vez que ready/contentHidden/mounted
  // mudam). Se estivessem no array de dependências, cada uma dessas
  // recriações reexecutaria o efeito, cuja função de limpeza cancelaria as
  // animações em andamento — e o corpo do efeito, ao rodar de novo, esbarra
  // direto no early return de `prevKeyRef.current === triggerKey` (ele já
  // foi atualizado na primeira vez) e nunca recomeça o ciclo. As refs
  // guardam sempre a versão mais recente sem disparar o efeito de novo.
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

    animationsRef.current.forEach((anim) => anim.cancel());

    container.style.pointerEvents = "auto";

    // Os 8 elementos já foram garantidos não-nulos pelo guard acima
    // (`stripes.some((s) => !s)`): o índice de cada um aqui é literalmente a
    // posição na fileira que stripeKeyframes() espera, então mapear direto
    // (sem filter) é o que preserva essa correspondência.
    const animations = stripes.map((el, i) =>
      el!.animate(stripeKeyframes(i), {
        duration: CURTAIN_CYCLE_MS,
        fill: "forwards",
      }),
    );
    animationsRef.current = animations;

    const coveredTimeout = window.setTimeout(() => {
      onCoveredRef.current?.();
    }, COVER_MS);

    let cancelled = false;
    Promise.all(animations.map((anim) => anim.finished)).then(() => {
      if (cancelled) return;
      container.style.pointerEvents = "none";
      onDoneRef.current?.();
    });

    return () => {
      cancelled = true;
      window.clearTimeout(coveredTimeout);
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
          className={`h-full flex-1 will-change-transform ${colorClassName} ${
            i % 2 === 0 ? "origin-top" : "origin-bottom"
          }`}
          // O repouso é "transform: scaleY(0)" via style inline, não a
          // utilitária scale-y-0 do Tailwind: aquela utilitária escreve na
          // propriedade CSS `scale`, separada de `transform`, e as duas se
          // compõem multiplicando uma pela outra na hora de renderizar. Uma
          // Animation via Web Animations API só escreve em `transform`
          // enquanto está tocando (fill: forwards mantém o último quadro
          // depois de terminar, mas ainda em `transform`); um `scale-y-0`
          // deixado para trás travaria a régua em altura zero pra sempre,
          // não importa o que a Animation diga.
          style={{ transform: "scaleY(0)" }}
        />
      ))}
    </div>
  );
}
