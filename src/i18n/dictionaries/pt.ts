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
    home: "Início",
    work: "Projetos",
    about: "Sobre",
    contact: "Contato",
    menu: "Menu",
    close: "Fechar",
    skipToContent: "Pular para o conteúdo",
    // Uma frase curta por item do menu, revelada ao lado do rótulo em
    // destaque (ver SiteMenu.tsx). Chaves batem com os `id` de cada item.
    menuDescriptions: {
      home: "Você adorou me ver girando.",
      work: "Interfaces que resolvem problema de verdade, do banking à música.",
      playground:
        "Ilustração, animação e produção musical, os experimentos que alimentam o trabalho.",
      about:
        "Música, tipografia, colagem e tecnologia, um pouco de tudo, o tempo todo.",
      contact: "Aberto a projetos, colaborações e boas ideias.",
    },
  },
  controls: {
    // Duas maneiras de descrever a mesma ação (o Modo Boring também é o
    // currículo, ver docs/architecture.md), alternando no botão em vez de
    // fixar uma só (ver BoringToggle.tsx).
    boringOn: ["Vá direto ao ponto", "Veja meu currículo"],
    boringOff: "Me surpreenda",
    boringHint: "Pra você que gosta das coisas direto ao ponto ;)",
    boringTooltip: "eu ODEIO animações!",
    theme: "Alternar tema",
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
    scrollHint: "Role para navegar",
    viewCase: "Ver case",
    comingSoon: "Case completo em breve",
    repo: "Repositório",
    openDemo: "Abrir em nova aba",
    livePreview: "Ativar som",
    metricsDisclaimer:
      "Métricas ilustrativas, números finais em fase de consolidação.",
  },
  brands: {
    title: "Acreditam no meu trabalho",
  },
  playground: {
    title: "Extras",
    subtitle:
      "Ilustração, animação e produção musical, os experimentos que alimentam o trabalho.",
  },
  about: {
    title: "Sobre",
    bio: [
      "Curioso em tempo integral, sou um pouco de tudo: apaixonado por música, ilustrador, entusiasta de tecnologia e nerd de assuntos aleatórios, e já há uma década transformei minha vontade de criar em profissão.",
      "Atualmente, estou em um banco (você consegue descobrir qual se for curioso) e atendo clientes no mundo todo criando experiências interativas focadas nas necessidades reais dos usuários, sempre guiadas por dados, SEO, performance e um ótimo bom gosto (o meu!).",
      "Adoro o que faço, tenho sorte de fazer o que amo, e talvez a gente ainda faça algo juntos.",
    ],
    skillsTitle: "Ferramentas e habilidades",
    // Aparece por dois gatilhos (ver SkillsOrbit.tsx): 5s depois que a
    // primeira tag entra na corrente presa ao cursor, ou assim que a
    // última entra, o que vier primeiro. Mesmo estilo de selo do "Case
    // completo em breve" do CasesGrid.
    skillsOrbitMessage: "Se eu não sei fazer, eu fuço até aprender!",
    languagesTitle: "Idiomas",
  },
  contact: {
    title: "Vamos conversar?",
    subtitle: "Aberto a projetos, colaborações e boas ideias.",
    emailLabel: "Email",
    copied: "Copiado!",
    imageAlt: "Imagem interativa, em grade, que reage ao movimento do mouse",
    // Escrita em cada quadro da grade interativa, uma palavra por linha,
    // alinhada à direita (ver InteractiveGridImage). Mesmo padrão de
    // hero.subtitleWords: array pronto, cada idioma decide a própria quebra.
    // Os quatro idiomas aparecem juntos, ciclando quadro a quadro (ver
    // Contact.tsx): esta chave é só a versão em português da frase.
    gridWords: ["Fale", "comigo!"],
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
