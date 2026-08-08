"use client";

import { useBoringMode } from "@/contexts/BoringModeContext";
import { BoringView } from "@/components/boring/BoringView";
import { Hero } from "@/components/sections/Hero";
import { CasesGrid } from "@/components/sections/CasesGrid";
import { Brands } from "@/components/sections/Brands";
import { Playground } from "@/components/sections/Playground";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
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

  if (isBoringMode) {
    return <BoringView locale={locale} dict={dict} />;
  }

  return (
    <>
      <Hero dict={dict} />
      <CasesGrid locale={locale} dict={dict} />
      <Brands locale={locale} dict={dict} />
      <About locale={locale} dict={dict} />
      <Playground locale={locale} dict={dict} />
      <Contact dict={dict} />
    </>
  );
}
