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
    menu: "Menu",
    close: "Fechar",
    skipToContent: "Pular para o conteúdo",
  },
  controls: {
    boringOn: "Vá direto ao ponto!",
    boringOff: "Me surpreenda",
    boringHint: "Pra você que gosta das coisas direto ao ponto ;)",
    boringTooltip: "eu ODEIO animações!",
    theme: "Alternar tema",
    sound: "Som da interface",
    language: "Idioma",
  },
  hero: {
    // O título é o nome (vem de profile.name). Aqui vive o subtítulo: um
    // prefixo fixo mais uma roleta de palavras (a primeira é o estado de
    // descanso, a lista gira e volta pra ela).
    subtitlePrefix: "Designer de",
    subtitleWords: [
      "produtos",
      "experiências",
      "aplicativos",
      "interfaces",
      "sistemas",
      "músicas",
      "sonhos",
      "embalagens",
      "sites",
    ],
    facts: [
      "UX/UI · Webapps · Design Systems",
      "Do institucional ao lúdico, e tudo entre as duas coisas!",
    ],
    // O único emoji autorizado do site inteiro é este globo.
    availability:
      "Baseado no Brasil · Disponível para projetos no mundo todo 🌍",
    cta: "Veja meu trabalho",
    portraitAlt: "Retrato animado de Armando Custodio, em traço preto e branco",
  },
  cases: {
    title: "Projetos em destaque",
    subtitle: "Do banking à música, projetos que peguei do problema ao resultado.",
    viewCase: "Ver case",
    comingSoon: "Case completo em breve",
    metricsDisclaimer:
      "Métricas ilustrativas, números finais em fase de consolidação.",
    fullCase: "Ver página completa",
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
    imageAlt: "Imagem interativa, em grade, que reage ao movimento do mouse",
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
