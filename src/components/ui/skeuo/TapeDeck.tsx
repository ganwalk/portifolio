"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { ExperimentCaption } from "@/components/ui/ExperimentCaption";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useNearViewport } from "@/lib/use-near-viewport";

// Substitui o ExperimentCard só no desktop (ver Playground.tsx) para o
// experimento sem `gallery` nem `process` (produção musical, um vídeo só):
// um gravador de rolo, em WebGL de verdade (ver three/TapeDeckScene.tsx),
// parado por padrão. O play liga o mesmo vídeo de estúdio de sempre (mudo)
// numa telinha do console, e só então os rolos giram. Import disparado só
// perto da viewport (ver mesmo comentário em VinylCrate.tsx).
const TapeDeckScene = dynamic(() => import("@/components/ui/skeuo/three/TapeDeckScene"), {
  ssr: false,
});

export function TapeDeck({
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
    <figure className="group relative border border-line bg-background">
      <div ref={stageRef} className="relative aspect-square overflow-hidden bg-surface">
        {isNear && (
          <TapeDeckScene
            src={experiment.media.src}
            poster={experiment.media.poster ?? ""}
            isPlaying={isPlaying}
          />
        )}

        <button
          type="button"
          onClick={() => setIsPlaying((p) => !p)}
          aria-label={isPlaying ? dict.playground.pause : dict.playground.play}
          className="absolute bottom-3 right-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-background/80 backdrop-blur-sm transition-colors hover:bg-surface"
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

      <ExperimentCaption experiment={experiment} locale={locale} />
    </figure>
  );
}
