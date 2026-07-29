"use client";

import {
  createContext,
  useCallback,
  useContext,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createClientFlag } from "@/lib/client-flag";
import { BORING_ATTRIBUTE, BORING_STORAGE_KEY } from "@/lib/storage-keys";

// O Modo Boring é o interruptor global da experiência: desliga animações,
// texturas e som, e troca a home lúdica por uma página utilitária que também
// serve de currículo imprimível.
//
// O estado vive num store fora do React, espelhado em <html data-boring>,
// para que o CSS reaja sem depender de renderização.

const boringFlag = createClientFlag(BORING_STORAGE_KEY, BORING_ATTRIBUTE);

interface BoringModeValue {
  isBoringMode: boolean;
  toggleBoringMode: () => void;
}

const BoringModeContext = createContext<BoringModeValue | null>(null);

export function BoringModeProvider({ children }: { children: ReactNode }) {
  const isBoringMode = useSyncExternalStore(
    boringFlag.subscribe,
    boringFlag.getSnapshot,
    boringFlag.getServerSnapshot,
  );

  const toggleBoringMode = useCallback(() => {
    boringFlag.set(!boringFlag.getSnapshot());
  }, []);

  return (
    <BoringModeContext value={{ isBoringMode, toggleBoringMode }}>
      {children}
    </BoringModeContext>
  );
}

export function useBoringMode(): BoringModeValue {
  const ctx = useContext(BoringModeContext);
  if (!ctx) {
    throw new Error("useBoringMode deve ser usado dentro de BoringModeProvider");
  }
  return ctx;
}
