// Dados públicos de contato e perfil.

// Mensagem pronta do WhatsApp: preenche o campo de texto assim que o link
// abre, quem visita só precisa apertar enviar. Sem travessão nem sublinhado,
// mesma regra do resto do texto visível (ver docs/tom-de-voz.md).
const WHATSAPP_MESSAGE = "Oi, Armando! Vi seu portfólio e queria conversar sobre um projeto.";

export const profile = {
  name: "Armando Custodio",
  role: "Design Engineer",
  email: "armandocustodio0@gmail.com",
  location: "Goiânia, Brasil",
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
  // Nomes próprios (linguagens, produtos) ficam iguais nos quatro idiomas de
  // propósito: HTML, React e Figma não se traduzem. O resto segue a mesma
  // forma { pt, en, es, zh } do resto do arquivo (ver languages acima).
  skills: {
    core: [
      { pt: "UX/UI Design", en: "UX/UI Design", es: "UX/UI Design", zh: "UX/UI Design" },
      {
        pt: "Protótipos de alta fidelidade",
        en: "High-fidelity prototypes",
        es: "Prototipos de alta fidelidad",
        zh: "高保真原型",
      },
      { pt: "Design Systems", en: "Design Systems", es: "Sistemas de diseño", zh: "设计系统" },
      { pt: "HTML", en: "HTML", es: "HTML", zh: "HTML" },
      { pt: "React", en: "React", es: "React", zh: "React" },
      { pt: "TypeScript", en: "TypeScript", es: "TypeScript", zh: "TypeScript" },
    ],
    tools: [
      { pt: "Figma", en: "Figma", es: "Figma", zh: "Figma" },
      { pt: "Adobe CC", en: "Adobe CC", es: "Adobe CC", zh: "Adobe CC" },
      { pt: "Canva", en: "Canva", es: "Canva", zh: "Canva" },
      {
        pt: "Microsoft Clarity",
        en: "Microsoft Clarity",
        es: "Microsoft Clarity",
        zh: "Microsoft Clarity",
      },
      {
        pt: "Google Analytics",
        en: "Google Analytics",
        es: "Google Analytics",
        zh: "Google Analytics",
      },
    ],
    secondary: [
      { pt: "Animação", en: "Animation", es: "Animación", zh: "动画" },
      {
        pt: "Ilustração & colagem",
        en: "Illustration & collage",
        es: "Ilustración & collage",
        zh: "插画与拼贴",
      },
      {
        pt: "Produção musical",
        en: "Music production",
        es: "Producción musical",
        zh: "音乐制作",
      },
      {
        pt: "Edição de vídeo",
        en: "Video editing",
        es: "Edición de video",
        zh: "视频剪辑",
      },
    ],
  },
  // Mais recente primeiro (ordem de currículo padrão): AUVP é o cargo
  // atual, os três anteriores entram abaixo dele, do mais recente ao mais
  // antigo.
  experience: [
    {
      company: "AUVP",
      role: {
        pt: "Design Engineer, responsável pelo design digital do ecossistema (webpages, produto e marca)",
        en: "Design Engineer, responsible for the ecosystem's digital design (webpages, product and brand)",
        es: "Design Engineer, responsable del diseño digital del ecosistema (webpages, producto y marca)",
        zh: "Design Engineer，负责生态系统的数字设计（网页、产品与品牌）",
      },
      period: "2023 até hoje",
    },
    {
      company: "Defensoria Pública do Estado de Goiás",
      role: {
        pt: "Estágio em design gráfico",
        en: "Graphic design internship",
        es: "Prácticas en diseño gráfico",
        zh: "平面设计实习",
      },
      period: "2021-2022",
    },
    {
      company: "Prime Mais",
      role: {
        pt: "Web designer pleno",
        en: "Mid-level web designer",
        es: "Diseñador web de nivel intermedio",
        zh: "中级网页设计师",
      },
      period: "2020-2021",
    },
    {
      company: "AS Web",
      role: {
        pt: "Designer gráfico com foco em social media",
        en: "Graphic designer focused on social media",
        es: "Diseñador gráfico enfocado en redes sociales",
        zh: "专注社交媒体的平面设计师",
      },
      period: "2019-2020",
    },
  ],
} as const;
