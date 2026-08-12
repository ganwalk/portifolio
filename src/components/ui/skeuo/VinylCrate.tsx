"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { SkeuoCaption } from "@/components/ui/skeuo/SkeuoCaption";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useNearViewport } from "@/lib/use-near-viewport";

// Substitui o ExperimentCard só no desktop (ver Playground.tsx) para o
// experimento com `gallery`: em vez de uma vitrine plana ciclando sozinha, as
// oito peças viram discos de verdade numa cena WebGL (ver
// three/VinylCrateScene.tsx), um disco ativo de frente com os vizinhos em
// leque atrás dele. O gesto mora aqui, em HTML comum: arrastar ou os dois
// botões trocam o disco ativo, a cena só lê o índice e anima até lá.
//
// next/dynamic com ssr:false: Canvas exige WebGL/DOM de verdade, que não
// existem no Node do build estático. O resto do card (moldura, legenda,
// botões) é HTML comum e pode nascer no build igual a qualquer outro card.
// O import só é DISPARADO quando o card entra perto da viewport
// (useNearViewport, mesmo critério que já rege autoplay de vídeo em
// CasesGrid): three.js é pesado, ninguém que não rolar até o Playground
// deveria pagar esse download.
const VinylCrateScene = dynamic(() => import("@/components/ui/skeuo/three/VinylCrateScene"), {
  ssr: false,
});

const SWIPE_THRESHOLD = 60;

function wrap(i: number, length: number) {
  return ((i % length) + length) % length;
}

export function VinylCrate({
  experiment,
  locale,
  dict,
}: {
  experiment: Experiment;
  locale: Locale;
  dict: Dictionary;
}) {
  const gallery = experiment.gallery ?? [];
  const [active, setActive] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(stageRef);

  if (gallery.length === 0) return null;

  function go(delta: number) {
    setActive((i) => wrap(i + delta, gallery.length));
  }

  function onPointerDownDrag(event: React.PointerEvent<HTMLDivElement>) {
    const startX = event.clientX;
    let done = false;
    function onMove(moveEvent: PointerEvent) {
      if (done) return;
      const dx = moveEvent.clientX - startX;
      if (dx <= -SWIPE_THRESHOLD) {
        done = true;
        go(1);
        cleanup();
      } else if (dx >= SWIPE_THRESHOLD) {
        done = true;
        go(-1);
        cleanup();
      }
    }
    function cleanup() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", cleanup);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", cleanup);
  }

  return (
    // Sem moldura (nem borda, nem fundo): o objeto em si é o card, não um
    // retrato contido numa caixa. aspect-[4/5], não aspect-square: dá
    // respiro vertical de sobra pra caixa e os discos que sobem acima dela
    // não rasparem no teto do card.
    <div className="group relative flex flex-col items-center">
      <div
        ref={stageRef}
        className="relative aspect-[4/5] w-full cursor-grab touch-pan-y border-b border-line active:cursor-grabbing"
        onPointerDown={onPointerDownDrag}
      >
        {isNear && <VinylCrateScene frames={gallery} active={active} />}

        <span className="type-mono pointer-events-none absolute left-0 top-0 z-20 text-xs text-muted">
          {gallery[active].asciiArt}
        </span>

        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={dict.playground.prevRecord}
          className="type-mono absolute bottom-0 left-0 z-20 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={dict.playground.nextRecord}
          className="type-mono absolute bottom-0 right-0 z-20 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground"
        >
          ›
        </button>
      </div>

      <SkeuoCaption experiment={experiment} locale={locale} />
    </div>
  );
}
