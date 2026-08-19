import type { Localized } from "./types";

/**
 * Vitrine curada de componentes do case "Intranet completa"
 * (IntranetShowcase.tsx), numa bento grid, no lugar do iframe cheio do
 * Design System que o LiveEmbed genérico mostraria (ver `demoUrl` em
 * cases.ts). Cada card é o componente AO VIVO, embutido e recortado na
 * página real (ver IntranetLiveEmbed.tsx), arrastável/clicável/navegável
 * por teclado de verdade quando a mesma origem permite (produção); o
 * `image` é o still de fallback, sempre por baixo, único visível fora
 * desse cenário (ver o próprio componente pra mais contexto).
 */
export interface IntranetHighlight {
  id: string;
  /** "design-system" | "tom-e-voz" | "solucoes": agrupa os cards em três blocos
   *  e decide a página de origem do embed (ver PAGE_PATH em IntranetShowcase.tsx). */
  group: "design-system" | "tom-e-voz" | "solucoes";
  title: Localized;
  description: Localized;
  image: string;
  /** Âncora exata no site publicado (mesmo id usado no recorte do still),
   *  sem o "#": vira tanto o seletor de scroll do embed ao vivo quanto o
   *  hash do link "abrir em nova aba". */
  anchor: string;
  /** Classes de span da célula na bento grid (ver IntranetShowcase.tsx). */
  span: string;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const intranetHighlights: IntranetHighlight[] = [
  {
    id: "roadmap",
    group: "design-system",
    span: "col-span-2 row-span-2",
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
    anchor: "roadmap-timeline",
  },
  {
    id: "cores",
    group: "design-system",
    span: "col-span-2 row-span-1",
    title: {
      pt: "Paleta de Cores",
      en: "Color Palette",
      es: "Paleta de Colores",
      zh: "色彩系统",
    },
    description: {
      pt: "Tokens semânticos (fundo, texto, destrutivo) e uma paleta categórica de oito cores para gráficos e tabelas, todos adaptados automaticamente entre as duas marcas e entre claro e escuro.",
      en: "Semantic tokens (background, text, destructive) and an eight color categorical palette for charts and tables, all adapting automatically between both brands and between light and dark.",
      es: "Tokens semánticos (fondo, texto, destructivo) y una paleta categórica de ocho colores para gráficos y tablas, todos adaptados automáticamente entre las dos marcas y entre claro y oscuro.",
      zh: "语义化的颜色令牌（背景、文本、警示色），以及一套八色的图表分类色板，两者都会在两个品牌之间、明暗主题之间自动切换。",
    },
    image: `${basePath}/photos/intranet/cores.webp`,
    anchor: "colors",
  },
  {
    id: "marca",
    group: "design-system",
    span: "col-span-1 row-span-1",
    title: {
      pt: "Marca & Logos",
      en: "Brand & Logos",
      es: "Marca y Logos",
      zh: "品牌与标志",
    },
    description: {
      pt: "Um monograma só, três variações (preto, branco e acento), prontas pra baixar em SVG, PNG ou PDF.",
      en: "A single monogram, three variants (black, white and accent), downloadable as SVG, PNG or PDF.",
      es: "Un solo monograma, tres variantes (negro, blanco y acento), listas para descargar en SVG, PNG o PDF.",
      zh: "同一个字母标志，三种版本（黑、白、强调色），可下载 SVG、PNG 或 PDF。",
    },
    image: `${basePath}/photos/intranet/marca.webp`,
    anchor: "marca",
  },
  {
    id: "novidades",
    group: "design-system",
    span: "col-span-1 row-span-1",
    title: {
      pt: "Mural de Novidades",
      en: "Updates Board",
      es: "Mural de Novedades",
      zh: "动态公告墙",
    },
    description: {
      pt: "Cada entrega vira um card com blocos opcionais de antes e depois, resultado e envolvidos.",
      en: "Every release becomes a card with optional before and after blocks, results and who was involved.",
      es: "Cada entrega se convierte en una tarjeta con bloques opcionales de antes y después, resultado e involucrados.",
      zh: "每次发布都会生成一张卡片，可选展示前后对比、成果和参与者。",
    },
    image: `${basePath}/photos/intranet/novidades.webp`,
    anchor: "mural-novidades",
  },
  {
    id: "lideranca",
    group: "tom-e-voz",
    span: "col-span-2 row-span-1",
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
    anchor: "fundador",
  },
  {
    id: "solucoes",
    group: "solucoes",
    span: "col-span-2 row-span-1",
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
    anchor: "resumo",
  },
];
