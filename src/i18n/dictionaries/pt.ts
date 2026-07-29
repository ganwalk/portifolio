// Dicionário PT BR, fonte da verdade do tipo `Dictionary`.
// Os demais idiomas (en, es) devem espelhar exatamente esta estrutura.
// Regra de copy: nada de travessão nem sublinhado nos textos visíveis.

export const pt = {
  meta: {
    title: "Armando Custodio, Design Engineer",
    description:
      "Experiências interativas do banking à música, fundamentadas em métricas, SEO e performance.",
  },
  nav: {
    work: "Projetos",
    about: "Sobre",
    contact: "Contato",
    skipToContent: "Pular para o conteúdo",
  },
  controls: {
    boringOn: "Modo sem graça",
    boringOff: "Modo criativo",
    boringHint: "Sem animações, sem texturas. Só a informação.",
    theme: "Alternar tema",
    sound: "Som da interface",
    language: "Idioma",
  },
  hero: {
    role: "Design Engineer",
    headline: ["Do banking", "à música,", "e tudo no meio."],
    tagline:
      "Experiências interativas que se adaptam às necessidades reais de quem usa, fundamentadas em métricas, SEO e performance.",
    availability: "Baseado no Brasil · Disponível para projetos",
    marquee: [
      "UX/UI",
      "Protótipos de alta fidelidade",
      "Webapps funcionais",
      "Design Systems",
      "Banking",
      "Música",
      "Análise de dados",
    ],
  },
  cases: {
    title: "Projetos em destaque",
    viewCase: "Ver case",
    comingSoon: "Case completo em breve",
    metricsDisclaimer:
      "Métricas ilustrativas, números finais em fase de consolidação.",
  },
  playground: {
    title: "Fora do expediente",
    subtitle:
      "Ilustração, animação e produção musical, os experimentos que alimentam o trabalho.",
  },
  about: {
    title: "Sobre",
    bio: [
      "Tento ser um pouco de tudo: apaixonado por música, nerd de tipografia, ilustrador de colagens, produtor nas horas vagas, entusiasta de tecnologia, editor de vídeo e curioso em tempo integral.",
      "Amo criar, e sinto que nunca há tempo suficiente para experimentar tudo que quero. Há uma década faço do design profissão, mas a história começa bem antes: numa mania constante de transformar tudo que passa pela minha mão em objeto de expressão própria. Já foi quase todo tipo de mídia, do banking ao mercado da música e tudo que aparece no meio. Fazer coisas é o que me completa.",
      "Hoje, na AUVP, sou responsável por experiências interativas que se adaptam às necessidades reais de quem as usa, sempre fundamentadas em métricas, SEO e performance. Amo o que faço, tenho sorte de fazer o que amo, e talvez a gente ainda faça algo juntos.",
    ],
    skillsTitle: "Ferramentas e habilidades",
    languagesTitle: "Idiomas",
  },
  contact: {
    title: "Vamos conversar?",
    subtitle: "Aberto a projetos, colaborações e boas ideias.",
    emailLabel: "Email",
    copied: "Copiado!",
  },
  boring: {
    experienceTitle: "Experiência",
    projectsTitle: "Projetos e resultados",
    printHint: "Esta página está otimizada para impressão (Ctrl/Cmd + P).",
    tableHeaders: {
      project: "Projeto",
      area: "Área",
      role: "Papel",
      result: "Resultado",
    },
  },
  footer: {
    rights: "Feito à mão, com ajuda de máquinas.",
    backToTop: "Voltar ao topo",
  },
} as const;

type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends readonly string[]
      ? readonly string[]
      : DeepStringify<T[K]>;
};

export type Dictionary = DeepStringify<typeof pt>;
