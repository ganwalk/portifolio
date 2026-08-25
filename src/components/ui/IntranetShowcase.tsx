import { Reveal } from "./Reveal";
import { BentoCard } from "./intranet/BentoCard";
import { DesignTokens } from "./intranet/DesignTokens";
import { RoadmapTimeline } from "./intranet/RoadmapTimeline";
import { NovidadeCard } from "./intranet/NovidadeCard";
import { novidadesSample } from "./intranet/novidadesSample";
import { CountdownDemo } from "./intranet/CountdownDemo";
import { RateDemo } from "./intranet/RateDemo";
import { PricingTable } from "./intranet/PricingTable";
import { DonutChart } from "./intranet/DonutChart";
import { Catalog } from "./intranet/Catalog";
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
  pt: "Seis componentes do Design System, portados de verdade (código real adaptado, não uma cópia visual nem uma descrição). Cada caixa é interativa: arraste, clique, passe o mouse, teste à vontade.",
  en: "Six Design System components, genuinely ported (real code adapted, not a visual copy or a description). Every box is interactive: drag, click, hover, try it freely.",
  es: "Seis componentes del Design System, portados de verdad (código real adaptado, no una copia visual ni una descripción). Cada caja es interactiva: arrastra, haz clic, pasa el mouse, pruébala libremente.",
  zh: "六个真正移植的设计系统组件（改编的真实代码，而非视觉复制或文字描述）。每个卡片都可以互动：拖动、点击、悬停，随意尝试。",
};

const roadmapTitle: Localized = {
  pt: "Trilha do roadmap",
  en: "Roadmap trail",
  es: "Trilha del roadmap",
  zh: "路线图轨道",
};
const roadmapDesc: Localized = {
  pt: "Arraste a trilha ou navegue pelas setas e pelo teclado. O marco de \"hoje\" é calculado de verdade, na hora.",
  en: "Drag the trail or navigate with the arrows and the keyboard. The \"today\" marker is calculated for real, on the spot.",
  es: "Arrastra la trilha o navega con las flechas y el teclado. El marcador de \"hoy\" se calcula de verdad, al instante.",
  zh: "拖动轨道，或用箭头和键盘导航。「当前」标记是实时计算出来的。",
};

const novidadesTitle: Localized = {
  pt: "Mural de novidades",
  en: "Updates wall",
  es: "Mural de novedades",
  zh: "更新公告墙",
};
const novidadesDesc: Localized = {
  pt: "Dois cards reais do mural, com antes e depois lado a lado e os resultados de cada entrega.",
  en: "Two real cards from the wall, with before and after side by side and the results of each delivery.",
  es: "Dos tarjetas reales del mural, con antes y después lado a lado y los resultados de cada entrega.",
  zh: "公告墙上的两张真实卡片，前后对比并列展示，附带每次交付的成果。",
};

const donutTitle: Localized = {
  pt: "Gráfico de rosca",
  en: "Donut chart",
  es: "Gráfico de rosca",
  zh: "环形图",
};
const donutDesc: Localized = {
  pt: "Passe o mouse numa fatia ou na legenda: as duas se destacam juntas, sincronizadas.",
  en: "Hover a slice or the legend: the two highlight together, in sync.",
  es: "Pasa el mouse por una porción o la leyenda: las dos se destacan juntas, sincronizadas.",
  zh: "将鼠标悬停在扇区或图例上：两者会同步高亮。",
};

const rateLabel: Localized = {
  pt: "Avaliação por estrelas",
  en: "Star rating",
  es: "Valoración por estrellas",
  zh: "星级评分",
};
const rateDesc: Localized = {
  pt: "Clique para votar, passe o mouse para pré-visualizar. Suporta meia estrela e um modo somente leitura.",
  en: "Click to vote, hover to preview. Supports half stars and a read only mode.",
  es: "Haz clic para votar, pasa el mouse para previsualizar. Admite media estrella y un modo de solo lectura.",
  zh: "点击投票，悬停预览。支持半星和只读模式。",
};

const countdownLabel: Localized = {
  pt: "Contagem regressiva",
  en: "Countdown",
  es: "Cuenta regresiva",
  zh: "倒计时",
};
const countdownDesc: Localized = {
  pt: "Relógio de verdade, ticando a cada segundo. Sem GIF, sem imagem parada.",
  en: "A real clock, ticking every second. No GIF, no static image.",
  es: "Reloj de verdad, marcando cada segundo. Sin GIF, sin imagen estática.",
  zh: "真正的时钟，每秒跳动。没有 GIF，没有静态图片。",
};

const pricingLabel: Localized = {
  pt: "Tabela de preços",
  en: "Pricing table",
  es: "Tabla de precios",
  zh: "价目表",
};
const pricingDesc: Localized = {
  pt: "Alterne entre plano individual e pacote: a grade de planos troca de verdade, com estado React.",
  en: "Switch between the individual plan and the bundle: the plan grid actually swaps, with real React state.",
  es: "Alterna entre plan individual y paquete: la grilla de planes cambia de verdad, con estado de React.",
  zh: "在单项和套餐之间切换：方案网格会真实切换，由 React 状态驱动。",
};

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

const stillHeading: Localized = {
  pt: "Manual de Tom e Voz & Nossas Soluções",
  en: "Tone of Voice Manual & Our Solutions",
  es: "Manual de Tono y Voz y Nuestras Soluciones",
  zh: "语气语调手册与我们的解决方案",
};

const stillIntro: Localized = {
  pt: "Um Design System completo não cobre só componentes visuais, cobre também o que a empresa diz. Por isso o manual de tom e voz e o guia de soluções moram no mesmo sistema, herdando os mesmos tokens e componentes em vez de virarem material solto, fora de sincronia com o produto.",
  en: "A complete Design System does not cover only visual components, it also covers what the company says. That is why the tone of voice manual and the solutions guide live inside the same system, inheriting the same tokens and components instead of becoming loose material, out of sync with the product.",
  es: "Un Design System completo no cubre solo componentes visuales, también cubre lo que la empresa dice. Por eso el manual de tono y voz y la guía de soluciones viven dentro del mismo sistema, heredando los mismos tokens y componentes en vez de volverse material suelto, fuera de sincronía con el producto.",
  zh: "一个完整的设计系统不只涵盖视觉组件，也涵盖公司说的话。这就是为什么语气语调手册和解决方案指南生活在同一个系统里，继承相同的令牌和组件，而不是变成与产品脱节的散乱材料。",
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
      </Reveal>
      {/* Cada card tem o próprio Reveal (ver BentoCard.tsx), não a seção
          inteira: numa seção desta altura no mobile, um Reveal só nunca
          satisfazia o limiar de 25% visível de uma vez, deixando um vão de
          tela em branco até rolar bem além dela. */}
      {/* Larguras (lg:col-span-N) escolhidas pra somar 16 (4 linhas de 4
          colunas) sem sobra: Roadmap 4 + (Novidades 2 + Rosca 2) + (Rate 2 +
          Countdown 2) + Preços 4. O grid do CSS não reordena nem encolhe pra
          caber (mesmo com grid-flow-dense): um card de 4 colunas que não
          cabe no resto de uma linha pula pra próxima linha inteira, e o
          resto da linha anterior fica em branco pra sempre. Rosca e Rate
          eram col-span-1 antes, larguras que não fechavam conta com o resto
          (4+2+1+1+2+4=14, não múltiplo de 4) e deixavam um vão de 2 colunas
          vazio antes da Tabela de Preços.

          Sem items-start: o padrão do grid (stretch) é o que faz sentido
          aqui, já que BentoCard.tsx já nasce h-full pra isso. Rate e
          Countdown, lado a lado na mesma fileira, têm conteúdo de altura
          bem diferente (a lista de estrelas é bem mais baixa que o relógio);
          com items-start, cada caixa parava na própria altura de conteúdo,
          deixando as duas com bordas inferiores desencontradas, uma
          "escada" em vez de uma fileira. */}
      <div className="intranet-scope mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <BentoCard
          title={roadmapTitle[locale]}
          description={roadmapDesc[locale]}
          className="sm:col-span-2 lg:col-span-4"
        >
          <RoadmapTimeline />
        </BentoCard>
        <BentoCard
          title={novidadesTitle[locale]}
          description={novidadesDesc[locale]}
          delay={0.04}
          className="sm:col-span-2"
        >
          <div className="grid w-full gap-3 sm:grid-cols-2">
            {novidadesSample.map((item) => (
              <NovidadeCard key={item.titulo} item={item} />
            ))}
          </div>
        </BentoCard>
        <BentoCard title={donutTitle[locale]} description={donutDesc[locale]} delay={0.08} className="lg:col-span-2">
          <DonutChart />
        </BentoCard>
        <BentoCard title={rateLabel[locale]} description={rateDesc[locale]} delay={0.1} className="lg:col-span-2">
          <RateDemo />
        </BentoCard>
        <BentoCard
          title={countdownLabel[locale]}
          description={countdownDesc[locale]}
          delay={0.06}
          className="sm:col-span-2"
        >
          <CountdownDemo />
        </BentoCard>
        <BentoCard
          title={pricingLabel[locale]}
          description={pricingDesc[locale]}
          delay={0.1}
          className="sm:col-span-2 lg:col-span-4"
        >
          <PricingTable />
        </BentoCard>
      </div>

      <Reveal delay={0.08} className="mt-14">
        <p className="type-mono text-muted">{catalogHeading[locale]}</p>
        <div className="mt-3">
          <Catalog locale={locale} />
        </div>
      </Reveal>

      <Reveal delay={0.1} className="mt-14">
        <p className="type-mono text-muted">{stillHeading[locale]}</p>
        <p className="mt-3 text-lg text-muted">{stillIntro[locale]}</p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
