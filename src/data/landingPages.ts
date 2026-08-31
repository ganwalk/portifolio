import type { Localized } from "./types";

// Landing pages reais do ecossistema, linkadas uma a uma conforme ficam
// prontas (ver LandingPagesShowcase.tsx, que renderiza cada entrada numa
// simulação de janela de navegador: barra de endereço, still da própria
// página e link direto pra abrir ela de verdade).
//
// `image`: still real da própria LP (screenshot da página publicada), não
// uma ilustração. `url`: link direto, abre em nova aba a partir do card.
//
// `client`: opcional, de propósito. O case (slug "ecossistema-auvp") é a
// AUVP de verdade (métricas e statement do case são dela), mas a lista
// abaixo não é exclusiva de um cliente só: quando uma LP aqui for de outro
// projeto, `client` identifica de quem é ela no card (ver
// LandingPagesShowcase.tsx); sem o campo, o card não presume nenhum
// cliente específico.
//
// As onze abaixo são a mesma lista de "Soluções Digitais" da Central do
// Time de Produto AUVP (produtosauvp/central, público, src/pages/Hub.tsx):
// nome, descrição e URL copiados de lá, na mesma ordem. Fora daqui fica só
// "AUVP Experience", que a própria Central já lista como "ainda sem link
// publicado". As capturas (`image`) são as mesmas versões já otimizadas
// (WebP, 640px de largura, página inteira, sem crop) que a Central usa em
// src/assets/lps/, copiadas tal como estão pra public/photos/landing-pages/
// deste site: mesma fonte de verdade, sem recapturar nada.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const lpImage = (file: string) => `${basePath}/photos/landing-pages/${file}`;

export interface LandingPage {
  title: Localized;
  description: Localized;
  url: string;
  image: string;
  client?: Localized;
}

export const landingPages: LandingPage[] = [
  {
    title: { pt: "AUVP Capital", en: "AUVP Capital", es: "AUVP Capital", zh: "AUVP Capital" },
    description: {
      pt: "Plataforma de investimentos",
      en: "Investment platform",
      es: "Plataforma de inversiones",
      zh: "投资平台",
    },
    url: "https://auvpcapital.com.br/",
    image: lpImage("capital.webp"),
  },
  {
    title: { pt: "AUVP Escola", en: "AUVP Escola", es: "AUVP Escola", zh: "AUVP Escola" },
    description: {
      pt: "Plataforma de educação financeira",
      en: "Financial education platform",
      es: "Plataforma de educación financiera",
      zh: "金融教育平台",
    },
    url: "https://auvp.com.br/",
    image: lpImage("escola.webp"),
  },
  {
    title: { pt: "AUVP Sempre", en: "AUVP Sempre", es: "AUVP Sempre", zh: "AUVP Sempre" },
    description: {
      pt: "Assinatura de evolução contínua",
      en: "Continuous-growth subscription",
      es: "Suscripción de evolución continua",
      zh: "持续进阶订阅",
    },
    url: "https://www.auvp.com.br/auvp-sempre/",
    image: lpImage("sempre.webp"),
  },
  {
    title: { pt: "AUVP ETFs", en: "AUVP ETFs", es: "AUVP ETFs", zh: "AUVP ETFs" },
    description: {
      pt: "Os ETFs próprios da AUVP",
      en: "AUVP's own ETFs",
      es: "Los ETFs propios de AUVP",
      zh: "AUVP 自有 ETF",
    },
    url: "https://www.auvpetfs.com.br/",
    image: lpImage("etfs.webp"),
  },
  {
    title: { pt: "AUVP Wealth", en: "AUVP Wealth", es: "AUVP Wealth", zh: "AUVP Wealth" },
    description: {
      pt: "Gestão de grandes patrimônios",
      en: "High-net-worth wealth management",
      es: "Gestión de grandes patrimonios",
      zh: "高净值财富管理",
    },
    url: "https://auvpcapital.com.br/wealth/",
    image: lpImage("wealth.webp"),
  },
  {
    title: { pt: "Private Day", en: "Private Day", es: "Private Day", zh: "Private Day" },
    description: {
      pt: "O evento anual da AUVP",
      en: "AUVP's yearly event",
      es: "El evento anual de AUVP",
      zh: "AUVP 年度活动",
    },
    url: "https://privateday.auvp.com.br/",
    image: lpImage("private-day.webp"),
  },
  {
    title: {
      pt: "Giro da Bolsa Itinerante",
      en: "Giro da Bolsa Itinerante",
      es: "Giro da Bolsa Itinerante",
      zh: "Giro da Bolsa Itinerante",
    },
    description: {
      pt: "O Giro da Bolsa ao vivo, cidade a cidade",
      en: "Giro da Bolsa live, touring city to city",
      es: "El Giro da Bolsa en vivo, ciudad a ciudad",
      zh: "巡回城市的股市直播节目",
    },
    url: "https://auvpcapital.com.br/giro-da-bolsa-itinerante/",
    image: lpImage("giro-itinerante.webp"),
  },
  {
    title: { pt: "AUVP Agro", en: "AUVP Agro", es: "AUVP Agro", zh: "AUVP Agro" },
    description: {
      pt: "Produtos do agronegócio",
      en: "Agribusiness products",
      es: "Productos del agronegocio",
      zh: "农业综合产品",
    },
    url: "https://auvpagro.com.br/",
    image: lpImage("agro.webp"),
  },
  {
    title: { pt: "AUVP Câmbio", en: "AUVP Câmbio", es: "AUVP Câmbio", zh: "AUVP Câmbio" },
    description: {
      pt: "Operações de câmbio",
      en: "Foreign exchange",
      es: "Operaciones de cambio",
      zh: "外汇业务",
    },
    url: "https://auvpcapital.com.br/cambio/",
    image: lpImage("cambio.webp"),
  },
  {
    title: { pt: "AUVP Crédito", en: "AUVP Crédito", es: "AUVP Crédito", zh: "AUVP Crédito" },
    description: {
      pt: "Soluções de crédito",
      en: "Credit solutions",
      es: "Soluciones de crédito",
      zh: "信贷解决方案",
    },
    url: "https://auvpcapital.com.br/credito/",
    image: lpImage("credito.webp"),
  },
  {
    title: { pt: "AUVP Seguros", en: "AUVP Seguros", es: "AUVP Seguros", zh: "AUVP Seguros" },
    description: {
      pt: "Produtos de seguro",
      en: "Insurance products",
      es: "Productos de seguro",
      zh: "保险产品",
    },
    url: "https://auvpcapital.com.br/seguros/",
    image: lpImage("seguros.webp"),
  },
];
