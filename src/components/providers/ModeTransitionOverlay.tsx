"use client";

import { useEffect, useRef, useState } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { CURTAIN_CYCLE_MS, StripeCurtain } from "./StripeCurtain";

// Cortina que cobre a tela por um instante ao alternar entre Modo Criativo e
// Modo Boring, e revela o novo modo por baixo, em vez do corte seco de uma
// troca instantânea de página inteira. O desenho da cortina em si (réguas
// verticais) e o motor de animação moram em StripeCurtain.tsx, reaproveitado
// também pela entrada no site (ver SiteLoader.tsx): aqui só decide QUANDO
// disparar um ciclo (a cada troca de isBoringMode) e O QUE fazer no instante
// coberto.
//
// A troca também sempre leva a página de volta ao topo: os dois modos têm
// alturas e seções completamente diferentes, então continuar no mesmo
// scrollY de um pra outro quase sempre cai em lugar nenhum, no meio de uma
// seção sem relação com a anterior. Com a cortina ativa, o salto acontece no
// instante em que a tela está totalmente coberta (onCovered, ver
// StripeCurtain.tsx), não se vê.
//
// Quem pediu menos movimento no sistema não vê a cortina (StripeCurtain
// resolve isso sozinho), só a troca direta.

export const MODE_TRANSITION_MS = CURTAIN_CYCLE_MS;

export function ModeTransitionOverlay() {
  const { isBoringMode } = useBoringMode();
  const prevRef = useRef(isBoringMode);
  const [triggerKey, setTriggerKey] = useState(0);

  useEffect(() => {
    if (prevRef.current === isBoringMode) return;
    prevRef.current = isBoringMode;
    setTriggerKey((k) => k + 1);
  }, [isBoringMode]);

  return (
    <StripeCurtain
      triggerKey={triggerKey}
      onCovered={() => window.scrollTo({ top: 0, behavior: "instant" })}
    />
  );
}
