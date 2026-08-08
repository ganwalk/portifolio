"use client";

import { useEffect, useState } from "react";

// Digita o texto caractere por caractere enquanto `active` for verdadeiro.
// O chamador remonta o componente (key trocando junto do estado de hover)
// sempre que `active` muda, então o `count` nasce zerado a cada nova rodada
// sem precisar zerá-lo de volta num efeito.
export function TypewriterText({
  text,
  active,
  speedMs = 18,
}: {
  text: string;
  active: boolean;
  speedMs?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let timer: number;
    let i = 0;
    const step = () => {
      i += 1;
      setCount(i);
      if (i < text.length) timer = window.setTimeout(step, speedMs);
    };
    timer = window.setTimeout(step, speedMs);
    return () => window.clearTimeout(timer);
  }, [active, text, speedMs]);

  return <>{text.slice(0, count)}</>;
}
