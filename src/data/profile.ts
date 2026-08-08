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
  experience: [
    {
      company: "AUVP",
      role: {
        pt: "Design Engineer, responsável pelo design digital do ecossistema (webpages, produto e marca)",
        en: "Design Engineer, responsible for the ecosystem's digital design (webpages, product and brand)",
        es: "Design Engineer, responsable del diseño digital del ecosistema (webpages, producto y marca)",
        zh: "Design Engineer，负责生态系统的数字设计（网页、产品与品牌）",
      },
      period: "20XX até hoje", // TODO(Armando): ano de início
    },
  ],
} as const;
