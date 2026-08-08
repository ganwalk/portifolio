"use client";

import { useCallback, useSyncExternalStore } from "react";

// matchMedia com hidratação segura, mesmo padrão de use-hydrated.ts:
// useState + useEffect exigiria dois passes (falso na primeira renderização
// do cliente, corrigido só depois do efeito), tarde demais para quem lê o
// valor no MESMO passe pra decidir o estado inicial de uma animação (ver
// Hero.tsx). useSyncExternalStore já entrega o valor real do cliente desde a
// primeira renderização, sem o falso positivo de servidor vazando pro
// primeiro quadro pintado.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
