import { Reveal } from "./Reveal";
import { IntranetLiveEmbed } from "./IntranetLiveEmbed";
import { intranetHighlights, type IntranetHighlight } from "@/data/intranetHighlights";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet, no lugar do LiveEmbed genérico (iframe do
// Design System inteiro): uma bento grid de componentes AO VIVO (ver
// IntranetLiveEmbed.tsx), cada um recortado exatamente na parte certa da
// página real, arrastável/clicável/navegável por teclado de verdade em
// produção (mesma origem que ganwalk.github.io/intranet), com uma frase
// de como cada um funciona. Fora desse cenário (dev local, preview),
// cada célula mostra o still de fallback, nunca um recorte errado.

const PAGE_PATH: Record<IntranetHighlight["group"], string> = {
  "design-system": "/design-system",
  "tom-e-voz": "/tom-e-voz",
  solucoes: "/solucoes",
};

const DEMO_ORIGIN = "https://ganwalk.github.io/intranet";

const introText: Localized = {
  pt: "Alguns componentes em destaque do Design System, ao vivo (arraste, clique, use o teclado), cada um com uma frase de como funciona:",
  en: "A few components from the Design System, live (drag, click, use the keyboard), each with a line on how it works:",
  es: "Algunos componentes destacados del Design System, en vivo (arrastra, haz clic, usa el teclado), cada uno con una frase de cómo funciona:",
  zh: "设计系统中的几个精选组件，实时可交互（拖拽、点击、键盘操作），各配一句说明它是如何运作的：",
};

const seeFullSite: Localized = {
  pt: "Ver o site completo",
  en: "See the full site",
  es: "Ver el sitio completo",
  zh: "查看完整网站",
};

function HighlightCell({
  item,
  locale,
  dict,
}: {
  item: IntranetHighlight;
  locale: Locale;
  dict: Dictionary;
}) {
  const demoUrl = `${DEMO_ORIGIN}${PAGE_PATH[item.group]}#${item.anchor}`;
  return (
    <div className={`relative flex flex-col border border-line ${item.span}`}>
      <div className="relative min-h-0 flex-1">
        <IntranetLiveEmbed
          demoUrl={demoUrl}
          scrollToSelector={`#${item.anchor}`}
          poster={item.image}
          title={item.title[locale]}
          className="absolute inset-0"
        />
      </div>
      <div className="border-t border-line bg-surface p-3">
        <p className="text-sm font-bold">{item.title[locale]}</p>
        <p className="mt-1 text-xs text-muted">{item.description[locale]}</p>
        <a
          href={demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="type-mono mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors hover:text-foreground"
        >
          {dict.cases.openDemo}
          <span aria-hidden>↗</span>
        </a>
      </div>
    </div>
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
  return (
    <div className={className}>
      <Reveal>
        <p className="text-lg text-muted">{introText[locale]}</p>
        <div className="mt-6 grid auto-rows-[170px] grid-cols-2 gap-3 sm:auto-rows-[200px] sm:gap-4 md:grid-cols-4 md:auto-rows-[220px]">
          {intranetHighlights.map((item) => (
            <HighlightCell key={item.id} item={item} locale={locale} dict={dict} />
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-10">
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
