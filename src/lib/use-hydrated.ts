"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

// Diz se o React já hidratou. Serve para adiar rótulos que dependem de
// preferência guardada no navegador, sem cair no setState dentro de efeito.
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
