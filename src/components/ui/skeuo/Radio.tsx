"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { SkeuoCaption } from "@/components/ui/skeuo/SkeuoCaption";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useNearViewport } from "@/lib/use-near-viewport";

// Substitui o ExperimentCard só no desktop (ver Playground.tsx) para o
// experimento sem `gallery` nem `process` (produção musical): um rádio
// vintage, em WebGL de verdade (ver three/RadioScene.tsx), parado por
// padrão. O play só liga um balanço leve nele e um equalizador de barras ao
// lado (o modelo não tem carretel nem tela pra animar de verdade). Import
// disparado só perto da viewport (ver mesmo comentário em VinylCrate.tsx).
const RadioScene = dynamic(() => import("@/components/ui/skeuo/three/RadioScene"), {
  ssr: false,
});

export function Radio({
  experiment,
  locale,
  dict,
}: {
  experiment: Experiment;
  locale: Locale;
  dict: Dictionary;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(stageRef);

  return (
    // Sem moldura (nem borda, nem fundo): o objeto em si é o card, não um
    // retrato contido numa caixa.
    <div className="group relative flex flex-col items-center">
      <div ref={stageRef} className="relative aspect-[4/5] w-full border-b border-line">
        {isNear && <RadioScene isPlaying={isPlaying} />}

        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? dict.playground.pause : dict.playground.play}
          className="absolute bottom-0 right-0 z-20 flex h-8 w-8 items-center justify-center text-muted transition-colors hover:text-foreground"
        >
          {isPlaying ? (
            <span aria-hidden className="flex gap-[3px]">
              <span className="h-3 w-1 bg-current" />
              <span className="h-3 w-1 bg-current" />
            </span>
          ) : (
            <span
              aria-hidden
              className="ml-0.5 h-0 w-0 border-y-[6px] border-l-[9px] border-y-transparent border-l-current"
            />
          )}
        </button>
      </div>

      <SkeuoCaption experiment={experiment} locale={locale} />
    </div>
  );
}
