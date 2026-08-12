"use client";

import { useEffect } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { BoringView } from "@/components/boring/BoringView";
import { Hero } from "@/components/sections/Hero";
import { CasesGrid } from "@/components/sections/CasesGrid";
import { Playground } from "@/components/sections/Playground";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { scrollToPosition } from "@/components/providers/SmoothScroll";
import { consumeHomeScrollPosition } from "@/lib/home-scroll-position";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// O interruptor que separa as duas experiências. Mesmo conteúdo, duas leituras:
// a criativa, com mídia e movimento, e a utilitária, que também é o currículo.

export function HomeView({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { isBoringMode } = useBoringMode();

  // Volta da página de um projeto (/work/[slug], botão "voltar" em
  // CaseDetail): salto instantâneo, sem animação, pra posição de rolagem
  // salva antes de sair da home (ver saveHomeScrollPosition em CasesGrid,
  // no botão "ver caso" mobile). Sem posição salva (visita direta à home,
  // ou vinda de qualquer outro lugar), não faz nada. Só faz sentido no Modo
  // Criativo: é onde esse botão mora.
  useEffect(() => {
    if (isBoringMode) return;
    const savedY = consumeHomeScrollPosition();
    if (savedY === null) return;
    scrollToPosition(savedY);
  }, [isBoringMode]);

  if (isBoringMode) {
    return <BoringView locale={locale} dict={dict} />;
  }

  return (
    <>
      <Hero dict={dict} />
      <CasesGrid locale={locale} dict={dict} />
      <About locale={locale} dict={dict} />
      <Playground locale={locale} dict={dict} />
      <Contact dict={dict} />
    </>
  );
}
