"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { BoringModeProvider, useBoringMode } from "@/contexts/BoringModeContext";
import { SoundProvider } from "@/contexts/SoundContext";

// Ordem importa: BoringMode envolve tudo, pois som e animação dependem dele.
// MotionConfig com reducedMotion="user" respeita prefers-reduced-motion do sistema;
// no Modo Boring, força "always", nenhum componente Framer Motion anima.

function MotionGate({ children }: { children: ReactNode }) {
  const { isBoringMode } = useBoringMode();
  return (
    <MotionConfig reducedMotion={isBoringMode ? "always" : "user"}>
      {children}
    </MotionConfig>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <BoringModeProvider>
        <MotionGate>
          <SoundProvider>{children}</SoundProvider>
        </MotionGate>
      </BoringModeProvider>
    </ThemeProvider>
  );
}
