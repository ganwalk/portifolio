// Dados públicos de contato e perfil.
// TODO(Armando): confirmar/completar os campos marcados, cidade.

// Mensagem pronta do WhatsApp: preenche o campo de texto assim que o link
// abre, quem visita só precisa apertar enviar. Sem travessão nem sublinhado,
// mesma regra do resto do texto visível (ver docs/tom-de-voz.md).
const WHATSAPP_MESSAGE = "Oi, Armando! Vi seu portfólio e queria conversar sobre um projeto.";

export const profile = {
  name: "Armando Custodio",
  role: "Design Engineer",
  email: "armandocustodio0@gmail.com",
  location: "Brasil", // TODO(Armando): cidade/UF, se quiser expor
  links: {
    github: "https://github.com/ganwalk",
    linkedin: "https://br.linkedin.com/in/armando-custodio-00080320a",
    instagram: "https://www.instagram.com/ganwalk",
    whatsapp: `https://wa.me/5562992174047?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  },
  languages: [
    {
      code: "pt",
      level: { pt: "Nativo", en: "Native", es: "Nativo", zh: "母语" },
    },
    {
      code: "en",
      level: { pt: "Fluente", en: "Fluent", es: "Fluido", zh: "流利" },
    },
    {
      code: "es",
      level: {
        pt: "Compreensão",
        en: "Reading/listening",
        es: "Comprensión",
        zh: "理解",
      },
    },
  ],
  skills: {
    core: [
      "UX/UI Design",
      "Protótipos de alta fidelidade",
      "Design Systems",
      "HTML",
      "React",
      "TypeScript",
    ],
    tools: [
      "Figma",
      "Adobe CC",
      "Canva",
      "Microsoft Clarity",
      "Google Analytics",
    ],
    secondary: [
      "Animação",
      "Ilustração & colagem",
      "Produção musical",
      "Edição de vídeo",
    ],
  },
  // `title` fica sem tradução, mesmo critério de `role` acima (Design
  // Engineer, Product Designer etc. circulam em inglês nos três idiomas).
  // `mock: true` marca as entradas de baixo pra cima como fictícias: só
  // existem pra desenhar a timeline (ver About.tsx), não são histórico real.
  // Some junto com o rodapé de aviso assim que forem substituídas por
  // experiência de verdade, mesmo critério das métricas ilustrativas dos
  // cases (ver docs/tom-de-voz.md).
  experience: [
    {
      company: "AUVP",
      title: "Design Engineer",
      role: {
        pt: "Design Engineer, responsável pelo design digital do ecossistema (webpages, produto e marca)",
        en: "Design Engineer, responsible for the ecosystem's digital design (webpages, product and brand)",
        es: "Design Engineer, responsable del diseño digital del ecosistema (webpages, producto y marca)",
        zh: "Design Engineer，负责生态系统的数字设计（网页、产品与品牌）",
      },
      period: {
        pt: "20XX até hoje", // TODO(Armando): ano de início
        en: "20XX to now",
        es: "20XX hasta hoy",
        zh: "20XX年至今",
      },
      mock: false,
    },
    {
      company: "Traço Coletivo",
      title: "Product Designer",
      role: {
        pt: "Design de produto e front end para clientes de música e varejo.",
        en: "Product design and front end for music and retail clients.",
        es: "Diseño de producto y front end para clientes de música y retail.",
        zh: "为音乐与零售客户提供产品设计与前端开发。",
      },
      period: { pt: "2021/2024", en: "2021/2024", es: "2021/2024", zh: "2021/2024" },
      mock: true,
    },
    {
      company: "Estúdio Alameda",
      title: "Designer visual",
      role: {
        pt: "Identidade visual e social media para marcas independentes de música.",
        en: "Visual identity and social media for independent music brands.",
        es: "Identidad visual y social media para marcas independientes de música.",
        zh: "为独立音乐品牌提供视觉识别与社交媒体设计。",
      },
      period: { pt: "2019/2021", en: "2019/2021", es: "2019/2021", zh: "2019/2021" },
      mock: true,
    },
  ],
} as const;
