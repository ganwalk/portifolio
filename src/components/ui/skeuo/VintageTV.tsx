"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ExperimentCaption } from "@/components/ui/ExperimentCaption";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useNearViewport } from "@/lib/use-near-viewport";

// Substitui o ExperimentCard só no desktop (ver Playground.tsx) para o
// experimento com `process`: uma tevê de tubo, em WebGL de verdade (ver
// three/VintageTVScene.tsx), mostra o vídeo final e os stills do processo
// como canais. O botão giratório avança um canal por clique, com um flash de
// estática entre as trocas. Import disparado só perto da viewport (ver
// mesmo comentário em VinylCrate.tsx).
const VintageTVScene = dynamic(() => import("@/components/ui/skeuo/three/VintageTVScene"), {
  ssr: false,
});

export function VintageTV({
  experiment,
  locale,
  dict,
}: {
  experiment: Experiment;
  locale: Locale;
  dict: Dictionary;
}) {
  const reduceMotion = useReducedMotion();
  const process = experiment.process ?? [];
  const channels = [
    { kind: "video" as const, src: experiment.media.src, poster: experiment.media.poster ?? "" },
    ...process.map((frame) => ({ kind: "image" as const, src: frame.src })),
  ];

  const [channel, setChannel] = useState(0);
  const [knobTurns, setKnobTurns] = useState(0);
  const [showStatic, setShowStatic] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(stageRef);

  function nextChannel() {
    setChannel((c) => (c + 1) % channels.length);
    setKnobTurns((t) => t + 1);
    if (!reduceMotion) {
      setShowStatic(true);
      window.setTimeout(() => setShowStatic(false), 220);
    }
  }

  return (
    <figure className="group relative border border-line bg-background">
      <div ref={stageRef} className="relative aspect-square overflow-hidden bg-surface">
        {isNear && (
          <VintageTVScene channel={channels[channel]} knobAngle={knobTurns * -0.9} />
        )}

        {showStatic && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0.95 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="skeuo-static pointer-events-none absolute left-[10%] top-[16%] z-10 h-[46%] w-[46%]"
          />
        )}

        <span className="type-mono pointer-events-none absolute bottom-3 left-[12%] z-10 border border-white/30 bg-black/60 px-1.5 py-0.5 text-[10px] text-white/80">
          {dict.playground.channelLabel} {channel + 1}/{channels.length}
        </span>

        <button
          type="button"
          onClick={nextChannel}
          aria-label={dict.playground.changeChannel}
          className="absolute inset-0 z-20 cursor-pointer"
        />
      </div>

      <ExperimentCaption experiment={experiment} locale={locale} />
    </figure>
  );
}
