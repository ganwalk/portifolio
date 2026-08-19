"use client";

import { useEffect, useRef, useState } from "react";

const FEEDBACK_MS = 1400;

// Copiar pro clipboard com um retorno visual curto (o chamador decide o
// quê: um rótulo que troca, um check que aparece), usado pelos swatches e
// tags da vitrine de tokens: clicar copia o valor de verdade, não só ilustra
// a cor. `copiedId` identifica QUAL item copiado por último, pra várias
// instâncias na mesma tela não acenderem o feedback todas juntas.

export function useCopyFeedback() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setCopiedId(null), FEEDBACK_MS);
  };

  return { copiedId, copy };
}
