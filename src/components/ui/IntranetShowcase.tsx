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

// Corpo do case da Intranet, no lugar do LiveEmbed genérico (iframe do
// Design System inteiro) e, também, no lugar de qualquer outra forma de
// carregar o site publicado embutido: os tokens de cor e dois componentes
// (Trilha do Roadmap, card do Mural de Novidades) são código real, portado
// de ganwalk/intranet (ver src/components/ui/intranet/), rodando nativamente
// aqui, sem imagem nem iframe. Manual de Tom e Voz e Nossas Soluções, mais
// difíceis de isolar num componente único, vivem no índice (ver Catalog.tsx
// e o grupo "Conteúdo" em catalog.ts), mais duas entradas entre as outras
// 20, sem tratamento de destaque à parte: tinham cada uma o próprio still
// com imagem e link antes, um bloco separado do índice, pedido explícito
// pra não ter mais esse destaque.

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

const seeFullSite: Localized = {
  pt: "Ver o site completo",
  en: "See the full site",
  es: "Ver el sitio completo",
  zh: "查看完整网站",
};

export function IntranetShowcase({
  locale,
  demoUrl,
  className = "",
}: {
  locale: Locale;
  demoUrl: string;
  className?: string;
}) {
  return (
    <div className={`intranet-scope ${className}`}>
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
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
