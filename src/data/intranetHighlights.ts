import type { Localized } from "./types";

/**
 * Vitrine curada de componentes do case "Intranet completa"
 * (IntranetShowcase.tsx), no lugar do iframe cheio do Design System que o
 * LiveEmbed genérico mostraria (ver `demoUrl` em cases.ts). Cada item é um
 * still capturado do próprio site publicado, recortado exatamente na caixa
 * do componente na página real (scripts/capture-intranet-highlights.mjs),
 * não um mockup: o link de cada card aponta pra âncora certa do site de
 * verdade, pra quem quiser ver com os próprios olhos.
 */
export interface IntranetHighlight {
  id: string;
  /** "design-system" | "tom-e-voz" | "solucoes": agrupa os cards em três blocos. */
  group: "design-system" | "tom-e-voz" | "solucoes";
  title: Localized;
  description: Localized;
  image: string;
  /** Âncora exata no site publicado (mesmo id usado no recorte do still). */
  href: string;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const demo = "https://ganwalk.github.io/intranet";

export const intranetHighlights: IntranetHighlight[] = [
  {
    id: "marca",
    group: "design-system",
    title: {
      pt: "Marca & Logos",
      en: "Brand & Logos",
      es: "Marca y Logos",
      zh: "品牌与标志",
    },
    description: {
      pt: "Um monograma só (o S com uma nota musical em negativo) atende as duas marcas do ecossistema, a diferença entre elas é só a cor primária, nunca a forma. Cada aplicação sai pronta em três variações (preto, branco e acento), prontas pra baixar em SVG, PNG ou PDF.",
      en: "A single monogram (the S with a music note in negative space) serves both brands in the ecosystem, the difference between them is only the primary color, never the shape. Every application ships ready in three variants (black, white and accent), downloadable as SVG, PNG or PDF.",
      es: "Un solo monograma (la S con una nota musical en negativo) atiende a las dos marcas del ecosistema, la diferencia entre ellas es solo el color primario, nunca la forma. Cada aplicación sale lista en tres variantes (negro, blanco y acento), listas para descargar en SVG, PNG o PDF.",
      zh: "同一个字母标志（负空间里嵌着音符的字母 S）同时服务于生态系统里的两个品牌，两者的区别只在主色，从不在形状。每种应用都备好三种版本（黑、白、强调色），可下载 SVG、PNG 或 PDF。",
    },
    image: `${basePath}/photos/intranet/marca.webp`,
    href: `${demo}/design-system#marca`,
  },
  {
    id: "cores",
    group: "design-system",
    title: {
      pt: "Paleta de Cores",
      en: "Color Palette",
      es: "Paleta de Colores",
      zh: "色彩系统",
    },
    description: {
      pt: "Tokens semânticos (fundo, texto, destrutivo) e uma paleta categórica de oito cores para gráficos e tabelas, todos adaptados automaticamente entre as duas marcas e entre claro e escuro. Nenhuma cor é escolhida na hora, tudo sai de uma variável.",
      en: "Semantic tokens (background, text, destructive) and an eight color categorical palette for charts and tables, all adapting automatically between both brands and between light and dark. No color is ever picked on the spot, everything comes from a variable.",
      es: "Tokens semánticos (fondo, texto, destructivo) y una paleta categórica de ocho colores para gráficos y tablas, todos adaptados automáticamente entre las dos marcas y entre claro y oscuro. Ningún color se elige en el momento, todo sale de una variable.",
      zh: "语义化的颜色令牌（背景、文本、警示色），以及一套八色的图表分类色板，两者都会在两个品牌之间、明暗主题之间自动切换。没有任何颜色是临时挑选的，全部来自变量。",
    },
    image: `${basePath}/photos/intranet/cores.webp`,
    href: `${demo}/design-system#colors`,
  },
  {
    id: "roadmap",
    group: "design-system",
    title: {
      pt: "Trilha do Roadmap",
      en: "Roadmap Trail",
      es: "Trilha del Roadmap",
      zh: "路线图轨道",
    },
    description: {
      pt: "Os marcos do produto numa trilha em onda, navegável por arraste, setas ou teclado. Cada marco carrega status (entregue, em andamento, adiado) e detalhamento próprio, sem precisar de uma página à parte.",
      en: "Product milestones laid out on a wavy trail, navigable by drag, arrows or keyboard. Each milestone carries its own status (delivered, in progress, postponed) and detail, no separate page required.",
      es: "Los hitos del producto en una trilha ondulada, navegable arrastrando, con flechas o teclado. Cada hito lleva su propio estado (entregado, en curso, aplazado) y detalle, sin necesitar una página aparte.",
      zh: "产品里程碑排列在一条波浪形轨道上，可通过拖拽、箭头键或键盘导航。每个里程碑都带有自己的状态（已交付、进行中、延期）和详情，无需单独的页面。",
    },
    image: `${basePath}/photos/intranet/roadmap.webp`,
    href: `${demo}/design-system#roadmap-timeline`,
  },
  {
    id: "novidades",
    group: "design-system",
    title: {
      pt: "Mural de Novidades",
      en: "Updates Board",
      es: "Mural de Novedades",
      zh: "动态公告墙",
    },
    description: {
      pt: "Cada entrega vira um card com blocos opcionais de antes e depois, resultado alcançado e quem esteve envolvido. O mesmo formato serve tanto pro mural quanto pra qualquer lugar que precise anunciar uma mudança.",
      en: "Every release becomes a card with optional before and after blocks, the result achieved and who was involved. The same format serves the board and anywhere else a change needs announcing.",
      es: "Cada entrega se convierte en una tarjeta con bloques opcionales de antes y después, el resultado alcanzado y quién estuvo involucrado. El mismo formato sirve tanto para el mural como para cualquier lugar que necesite anunciar un cambio.",
      zh: "每次发布都会生成一张卡片，可选展示前后对比、达成的成果以及参与者。这个格式既用于公告墙，也可用在任何需要宣布变更的地方。",
    },
    image: `${basePath}/photos/intranet/novidades.webp`,
    href: `${demo}/design-system#mural-novidades`,
  },
  {
    id: "lideranca",
    group: "tom-e-voz",
    title: {
      pt: "Manual de Tom e Voz",
      en: "Tone of Voice Manual",
      es: "Manual de Tono y Voz",
      zh: "语气语调手册",
    },
    description: {
      pt: "Guia de comunicação por área da empresa (dez ao todo, do atendimento ao jurídico) e por produto, com exemplos reais de erro e correção lado a lado. A voz da liderança tem capítulo próprio, com os avatares do time gerados por iniciais (o template não usa fotos).",
      en: "A communication guide broken down by company area (ten in total, from support to legal) and by product, with real error and correction examples side by side. Leadership's voice gets its own chapter, with the team's avatars generated from initials (the template uses no photos).",
      es: "Guía de comunicación por área de la empresa (diez en total, de atención al cliente a jurídico) y por producto, con ejemplos reales de error y corrección lado a lado. La voz del liderazgo tiene capítulo propio, con los avatares del equipo generados por iniciales (el template no usa fotos).",
      zh: "按公司部门（共十个，从客服到法务）和产品划分的沟通指南，附有真实的错误与修正对照示例。领导层的语气单独成章，团队头像由姓名缩写生成（该模板不使用照片）。",
    },
    image: `${basePath}/photos/intranet/lideranca.webp`,
    href: `${demo}/tom-e-voz#fundador`,
  },
  {
    id: "solucoes",
    group: "solucoes",
    title: {
      pt: "Nossas Soluções",
      en: "Our Solutions",
      es: "Nuestras Soluciones",
      zh: "我们的解决方案",
    },
    description: {
      pt: "Guia dos cinco produtos do ecossistema, cada um com sua própria seção (o que é, recursos, condições) e exportação em PDF. Termina numa tabela comparativa que resume investimento, público e acesso lado a lado.",
      en: "A guide to the ecosystem's five products, each with its own section (what it is, features, terms) and PDF export. It closes with a comparison table summarizing investment, audience and access side by side.",
      es: "Guía de los cinco productos del ecosistema, cada uno con su propia sección (qué es, recursos, condiciones) y exportación en PDF. Termina en una tabla comparativa que resume inversión, público y acceso lado a lado.",
      zh: "生态系统五款产品的指南，每款都有自己的章节（是什么、功能、条件），并支持导出 PDF。最后以一张对比表收尾，并排汇总投入、受众与权限。",
    },
    image: `${basePath}/photos/intranet/solucoes.webp`,
    href: `${demo}/solucoes#resumo`,
  },
];
