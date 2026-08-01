// Dados públicos de contato e perfil.
// TODO(Armando): confirmar/completar os campos marcados, LinkedIn, Instagram, cidade.

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
    linkedin: "", // TODO(Armando): URL do LinkedIn
    instagram: "", // TODO(Armando): URL do Instagram
    whatsapp: `https://wa.me/5562992174047?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
  },
  languages: [
    { code: "pt", level: { pt: "Nativo", en: "Native", es: "Nativo" } },
    { code: "en", level: { pt: "Fluente", en: "Fluent", es: "Fluido" } },
    {
      code: "es",
      level: {
        pt: "Compreensão",
        en: "Reading/listening",
        es: "Comprensión",
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
  experience: [
    {
      company: "AUVP",
      role: {
        pt: "Design Engineer, responsável pelo design digital do ecossistema (webpages, produto e marca)",
        en: "Design Engineer, responsible for the ecosystem's digital design (webpages, product and brand)",
        es: "Design Engineer, responsable del diseño digital del ecosistema (webpages, producto y marca)",
      },
      period: "20XX até hoje", // TODO(Armando): ano de início
    },
  ],
} as const;
