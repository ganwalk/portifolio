"use client";

import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { BoringModeProvider, useBoringMode } from "@/contexts/BoringModeContext";
import { PageLoadingProvider } from "@/contexts/PageLoadingContext";
import { ModeTransitionOverlay } from "@/components/providers/ModeTransitionOverlay";
import { SiteLoader } from "@/components/providers/SiteLoader";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

// Ordem importa: BoringMode envolve tudo, pois a animação depende dele.
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
        <PageLoadingProvider>
          <SiteLoader />
          <ModeTransitionOverlay />
          <SmoothScroll />
          <MotionGate>{children}</MotionGate>
        </PageLoadingProvider>
      </BoringModeProvider>
    </ThemeProvider>
  );
}
