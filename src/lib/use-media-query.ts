"use client";

import { useSyncExternalStore } from "react";

// Snapshot do servidor é sempre false (mobile first): o HTML previsto no
// build nunca diverge do primeiro paint no cliente, e o valor real chega
// assim que o React sincroniza com matchMedia, igual ao padrão de
// use-hydrated.ts.
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}
