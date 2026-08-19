import { Reveal } from "./Reveal";
import { DesignTokens } from "./intranet/DesignTokens";
import { RoadmapTimeline } from "./intranet/RoadmapTimeline";
import { NovidadeCard } from "./intranet/NovidadeCard";
import { novidadesSample } from "./intranet/novidadesSample";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet, no lugar do LiveEmbed genérico (iframe do
// Design System inteiro) e, também, no lugar de qualquer outra forma de
// carregar o site publicado embutido: os tokens de cor e dois componentes
// (Trilha do Roadmap, card do Mural de Novidades) são código real, portado
// de ganwalk/intranet (ver src/components/ui/intranet/), rodando nativamente
// aqui, sem imagem nem iframe. Manual de Tom e Voz e Nossas Soluções, mais
// difíceis de isolar num componente único, seguem como still com link para
// a página real.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const stillCards: {
  id: string;
  title: Localized;
  description: Localized;
  image: string;
  path: string;
}[] = [
  {
    id: "lideranca",
    title: {
      pt: "Manual de Tom e Voz",
      en: "Tone of Voice Manual",
      es: "Manual de Tono y Voz",
      zh: "语气语调手册",
    },
    description: {
      pt: "Guia de comunicação por área da empresa (dez ao todo, do atendimento ao jurídico) e por produto, com exemplos reais de erro e correção lado a lado.",
      en: "A communication guide broken down by company area (ten in total, from support to legal) and by product, with real error and correction examples side by side.",
      es: "Guía de comunicación por área de la empresa (diez en total, de atención al cliente a jurídico) y por producto, con ejemplos reales de error y corrección lado a lado.",
      zh: "按公司部门（共十个，从客服到法务）和产品划分的沟通指南，附有真实的错误与修正对照示例。",
    },
    image: `${basePath}/photos/intranet/lideranca.webp`,
    path: "/tom-e-voz#fundador",
  },
  {
    id: "solucoes",
    title: {
      pt: "Nossas Soluções",
      en: "Our Solutions",
      es: "Nuestras Soluciones",
      zh: "我们的解决方案",
    },
    description: {
      pt: "Guia dos cinco produtos do ecossistema, cada um com sua própria seção, terminando numa tabela comparativa.",
      en: "A guide to the ecosystem's five products, each with its own section, closing with a comparison table.",
      es: "Guía de los cinco productos del ecosistema, cada uno con su propia sección, terminando en una tabla comparativa.",
      zh: "生态系统五款产品的指南，每款都有自己的章节，最后以对比表收尾。",
    },
    image: `${basePath}/photos/intranet/solucoes.webp`,
    path: "/solucoes#resumo",
  },
];

const componentsHeading: Localized = {
  pt: "Componentes",
  en: "Components",
  es: "Componentes",
  zh: "组件",
};

const componentsIntro: Localized = {
  pt: "Dois componentes do Design System, portados de verdade (código real adaptado, não uma cópia visual): a trilha de roadmap arrastável, navegável por setas e teclado, e o card do Mural de Novidades, com os dados reais dessas duas entregas.",
  en: "Two Design System components, genuinely ported (real code adapted, not a visual copy): the drag and keyboard navigable roadmap trail, and the Updates Board card, with the real data from those two releases.",
  es: "Dos componentes del Design System, portados de verdad (código real adaptado, no una copia visual): la trilha de roadmap arrastrable y navegable por flechas y teclado, y la tarjeta del Mural de Novedades, con los datos reales de esas dos entregas.",
  zh: "两个真正移植的设计系统组件（改编的真实代码，而非视觉复制）：可拖拽、可通过箭头和键盘导航的路线图轨道，以及动态公告墙卡片，均使用这两次发布的真实数据。",
};

const stillHeading: Localized = {
  pt: "Manual de Tom e Voz & Nossas Soluções",
  en: "Tone of Voice Manual & Our Solutions",
  es: "Manual de Tono y Voz y Nuestras Soluciones",
  zh: "语气语调手册与我们的解决方案",
};

const seeFullSite: Localized = {
  pt: "Ver o site completo",
  en: "See the full site",
  es: "Ver el sitio completo",
  zh: "查看完整网站",
};

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
  const origin = demoUrl.replace(/\/$/, "");
  return (
    <div className={className}>
      <Reveal>
        <DesignTokens locale={locale} />
      </Reveal>

      <Reveal delay={0.06} className="mt-14">
        <p className="type-mono text-muted">{componentsHeading[locale]}</p>
        <p className="mt-3 text-lg text-muted">{componentsIntro[locale]}</p>
        <div className="intranet-scope mt-6 space-y-4">
          <RoadmapTimeline />
          <div className="grid gap-3 sm:grid-cols-2">
            {novidadesSample.map((item) => (
              <NovidadeCard key={item.titulo} item={item} />
            ))}
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-14">
        <p className="type-mono text-muted">{stillHeading[locale]}</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {stillCards.map((card) => (
            <a
              key={card.id}
              href={`${origin}${card.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group border border-line"
            >
              <div className="relative aspect-video overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.image}
                  alt={card.title[locale]}
                  className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="border-t border-line bg-surface p-3">
                <p className="text-sm font-bold">{card.title[locale]}</p>
                <p className="mt-1 text-xs text-muted">{card.description[locale]}</p>
                <span className="type-mono mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted transition-colors group-hover:text-foreground">
                  {dict.cases.openDemo}
                  <span aria-hidden>↗</span>
                </span>
              </div>
            </a>
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
