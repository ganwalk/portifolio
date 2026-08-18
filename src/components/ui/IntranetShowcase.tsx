import { Reveal } from "./Reveal";
import { intranetHighlights, type IntranetHighlight } from "@/data/intranetHighlights";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet, no lugar do LiveEmbed genérico (iframe do
// Design System inteiro): uma vitrine curada de componentes reais,
// capturados em still do próprio site publicado
// (scripts/capture-intranet-highlights.mjs), cada um com uma frase
// explicando como funciona, no lugar de deixar quem visita descobrir
// sozinho navegando um site inteiro dentro de um iframe pequeno. Cada
// card ainda linka pra âncora exata do componente no site de verdade,
// pra quem quiser ver ao vivo.

const introText: Localized = {
  pt: "Alguns componentes em destaque do Design System, cada um com o próprio still e uma frase de como funciona:",
  en: "A few components from the Design System, each with its own still and a line on how it works:",
  es: "Algunos componentes destacados del Design System, cada uno con su propio still y una frase de cómo funciona:",
  zh: "设计系统中的几个精选组件，各配有实拍图和一句说明它是如何运作的：",
};

const seeFullSite: Localized = {
  pt: "Ver o site completo",
  en: "See the full site",
  es: "Ver el sitio completo",
  zh: "查看完整网站",
};

function HighlightCard({
  item,
  locale,
  dict,
}: {
  item: IntranetHighlight;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <a
      href={item.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block border border-line"
    >
      <div className="overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt=""
          aria-hidden
          loading="lazy"
          className="h-auto w-full transition-opacity duration-300 group-hover:opacity-90"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="font-bold">{item.title[locale]}</p>
        <p className="mt-2 text-sm text-muted">{item.description[locale]}</p>
        <span className="type-mono mt-4 inline-flex items-center gap-2 text-muted transition-colors group-hover:text-foreground">
          {dict.cases.openDemo}
          <span aria-hidden>↗</span>
        </span>
      </div>
    </a>
  );
}

export function IntranetShowcase({
  locale,
  dict,
  demoUrl,
  className = "",
}: {
  locale: Locale;
  dict: Dictionary;
  demoUrl: string;
  className?: string;
}) {
  const designSystemItems = intranetHighlights.filter((h) => h.group === "design-system");
  const otherItems = intranetHighlights.filter((h) => h.group !== "design-system");

  return (
    <div className={className}>
      <Reveal>
        <p className="text-lg text-muted">{introText[locale]}</p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {designSystemItems.map((item) => (
            <HighlightCard key={item.id} item={item} locale={locale} dict={dict} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {otherItems.map((item) => (
            <HighlightCard key={item.id} item={item} locale={locale} dict={dict} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.14} className="mt-10">
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="type-mono inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground"
        >
          {seeFullSite[locale]}
          <span aria-hidden>↗</span>
        </a>
      </Reveal>
    </div>
  );
}
