import { Reveal } from "./Reveal";
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
  pt: "Seis componentes do Design System, portados de verdade (código real adaptado, não uma cópia visual nem uma descrição): arraste a trilha do roadmap, clique nas estrelas, troque o plano entre individual e pacote, passe o mouse no gráfico.",
  en: "Six Design System components, genuinely ported (real code adapted, not a visual copy or a description): drag the roadmap trail, click the stars, switch the plan between individual and bundle, hover the chart.",
  es: "Seis componentes del Design System, portados de verdad (código real adaptado, no una copia visual ni una descripción): arrastra la trilha del roadmap, haz clic en las estrellas, cambia el plan entre individual y paquete, pasa el mouse por el gráfico.",
  zh: "六个真正移植的设计系统组件（改编的真实代码，而非视觉复制或文字描述）：拖动路线图轨道、点击星标、在单项与套餐之间切换、悬停查看图表。",
};

const rateLabel: Localized = {
  pt: "Avaliação por estrelas",
  en: "Star rating",
  es: "Valoración por estrellas",
  zh: "星级评分",
};

const countdownLabel: Localized = {
  pt: "Contagem regressiva",
  en: "Countdown",
  es: "Cuenta regresiva",
  zh: "倒计时",
};

const pricingLabel: Localized = {
  pt: "Tabela de preços",
  en: "Pricing table",
  es: "Tabla de precios",
  zh: "价目表",
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
  pt: "Um Design System que só cobre componentes visuais resolve metade do problema: a outra metade é o que a empresa diz, e como. Por isso o manual de tom e voz e o guia de soluções moram no mesmo sistema que os tokens e os componentes, não em documentos soltos. Três ganhos concretos disso: a voz da marca vira tão consistente quanto a cor do botão, com diretrizes versionadas e revisáveis do mesmo jeito que qualquer outro token; quem escreve descrição de produto usa o mesmo vocabulário e a mesma régua de tom que quem desenha a tela, então o discurso comercial nunca destoa da experiência real; e cada seção de produto no guia de soluções herda o acento de cor, a tipografia e os componentes documentados no Design System, então a página de vendas parece parte do mesmo produto, não um material paralelo montado por outro time com outras regras.",
  en: "A Design System that only covers visual components solves half the problem: the other half is what the company says, and how. That is why the tone of voice manual and the solutions guide live inside the same system as the tokens and the components, not in loose documents. Three concrete gains from that: the brand voice becomes as consistent as a button's color, with guidelines versioned and reviewed the same way as any other token; whoever writes a product description uses the same vocabulary and the same tone scale as whoever designs the screen, so the sales pitch never drifts from the real experience; and every product section in the solutions guide inherits the color accent, typography and documented components from the Design System, so the sales page reads as part of the same product, not a parallel piece of collateral built by another team under different rules.",
  es: "Un Design System que solo cubre componentes visuales resuelve la mitad del problema: la otra mitad es lo que la empresa dice, y cómo. Por eso el manual de tono y voz y la guía de soluciones viven dentro del mismo sistema que los tokens y los componentes, no en documentos sueltos. Tres ganancias concretas de eso: la voz de la marca se vuelve tan consistente como el color de un botón, con directrices versionadas y revisadas de la misma forma que cualquier otro token; quien escribe una descripción de producto usa el mismo vocabulario y la misma escala de tono que quien diseña la pantalla, así el discurso comercial nunca se aleja de la experiencia real; y cada sección de producto en la guía de soluciones hereda el acento de color, la tipografía y los componentes documentados en el Design System, así la página de ventas se siente parte del mismo producto, no un material paralelo armado por otro equipo con otras reglas.",
  zh: "一个只涵盖视觉组件的设计系统只解决了一半的问题：另一半是公司说什么，以及怎么说。这就是为什么语气语调手册和解决方案指南与令牌和组件生活在同一个系统里，而不是散落的文档中。由此带来三个具体收益：品牌语气变得像按钮颜色一样一致，准则像任何其他令牌一样被版本化和审查；撰写产品描述的人使用与设计界面的人相同的词汇和语气尺度，因此销售话术永远不会偏离真实体验；解决方案指南中的每个产品板块都继承了设计系统中记录的强调色、排版和组件，因此销售页面读起来像是同一产品的一部分，而不是另一个团队按不同规则拼出来的平行材料。",
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
          <DonutChart />
          <div>
            <p className="mb-2 text-sm font-semibold text-[hsl(var(--foreground))]">{rateLabel[locale]}</p>
            <RateDemo />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[hsl(var(--foreground))]">{countdownLabel[locale]}</p>
            <CountdownDemo />
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold text-[hsl(var(--foreground))]">{pricingLabel[locale]}</p>
            <PricingTable />
          </div>
        </div>
      </Reveal>

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
