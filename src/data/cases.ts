import type { CaseStudy } from "./types";

// Lineup de lançamento: 2 cases de Banking + 3 de Música. Os três artistas
// (Ganwalk, Dezert Horse, Pink Opala) são projetos individuais, cada um com
// a própria página e o próprio lugar no carrossel da home, não um case
// guarda chuva só.
// Métricas com value "+XX%" são placeholders explícitos até calibração com números reais.
// Telas dos cases de Banking serão recriadas/anonimizadas até autorização formal de uso.
//
// Capas: todas em vídeo (nenhuma foto estática), placeholders do Pexels
// escolhidos pelo clima de cada case. Para trocar pela mídia real, basta
// substituir src (e poster) no bloco cover.
//
// Critério de cor: colorido sim, saturado não. A primeira leva de
// placeholders era de gradiente neon e show de clube com luz roxa estourada,
// e brigava com o site inteiro: aqui a única cor vem justamente da mídia, e
// se ela chega em magenta e ciano puros, é ela que passa a mandar na página
// em vez do trabalho. A leva atual é toda de cor natural (concreto, telhado,
// areia, luz âmbar de estúdio, nuvem de fim de tarde, papel), que convive
// com o preto e branco em vez de gritar por cima dele.

export const cases: CaseStudy[] = [
  {
    slug: "intranet-auvp",
    area: "banking",
    year: "2024/2026",
    title: {
      pt: "Intranet completa",
      en: "Complete intranet",
      es: "Intranet completa",
      zh: "完整内网系统",
    },
    statement: {
      pt: "Construí uma intranet robusta com Design System completo e manual de tom e voz para todo o ecossistema.",
      en: "I built a robust intranet with a complete Design System and tone of voice manual for the whole ecosystem.",
      es: "Construí una intranet robusta con un Design System completo y manual de tono y voz para todo el ecosistema.",
      zh: "为整个生态系统搭建了一套完善的内部网站，包含完整的设计系统和语气语调手册。",
    },
    tags: {
      pt: ["Design System", "Intranet", "Tom e voz", "Banking"],
      en: ["Design System", "Intranet", "Tone of voice", "Banking"],
      es: ["Design System", "Intranet", "Tono y voz", "Banking"],
      zh: ["Design System", "内网系统", "语气语调", "Banking"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "adoção interna",
          en: "internal adoption",
          es: "adopción interna",
          zh: "内部采用率",
        },
        illustrative: true,
      },
      {
        value: "XX",
        label: {
          pt: "componentes documentados",
          en: "documented components",
          es: "componentes documentados",
          zh: "已归档组件数",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela intranet, ou motion
    // reveal dos componentes do Design System em grid.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/37116270/15723407_1080_1920_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/37116270/app-application-checkmark-concept-37116270.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Mão desenhando componentes de interface com caneta digital em um tablet",
        en: "Hand sketching interface components with a digital pen on a tablet",
        es: "Mano dibujando componentes de interfaz con lápiz digital en una tablet",
        zh: "手持数位笔在平板上绘制界面组件",
      },
    },
    comingSoon: true,
    repoUrl: "#", // placeholder até a URL real do repositório: só pra testar o botão "ver repositório" aparecendo, troque por um link de verdade antes de publicar.
  },
  {
    slug: "ecossistema-auvp",
    area: "banking",
    year: "2023/2026",
    // "Landing Pages", não "Landing Pages AUVP": a lista vai crescer com
    // páginas fora da AUVP, o rótulo não pode ficar preso a um cliente só.
    title: {
      pt: "Landing Pages",
      en: "Landing Pages",
      es: "Landing Pages",
      zh: "落地页",
    },
    statement: {
      pt: "Desenho e mantenho o ecossistema de webpages da AUVP Capital: todas as LPs com no mínimo 90/100 de performance, alta conversão e bom rankeamento nos mecanismos de busca e em IA.",
      en: "I design and maintain AUVP Capital's webpage ecosystem: every LP scores at least 90/100 on performance, with high conversion and strong ranking on search engines and AI.",
      es: "Diseño y mantengo el ecosistema de webpages de AUVP Capital: todas las LPs con al menos 90/100 de rendimiento, alta conversión y buen posicionamiento en buscadores y en IA.",
      zh: "设计并维护 AUVP Capital 的网页生态系统：所有落地页性能评分至少 90/100，转化率高，且在搜索引擎和人工智能中排名良好。",
    },
    tags: {
      pt: ["Webpages", "SEO", "Conversão", "Clarity & GA"],
      en: ["Webpages", "SEO", "Conversion", "Clarity & GA"],
      es: ["Webpages", "SEO", "Conversión", "Clarity & GA"],
      zh: ["Webpages", "SEO", "转化率", "Clarity & GA"],
    },
    // Acessos e performance são números reais (não placeholder): a conversão
    // ainda não tem um percentual calibrado, então continua ilustrativa até
    // a métrica exata chegar.
    metrics: [
      {
        value: "20 mil+",
        label: {
          pt: "acessos diários",
          en: "daily visits",
          es: "visitas diarias",
          zh: "每日访问量",
        },
        illustrative: false,
      },
      {
        value: "90+/100",
        label: {
          pt: "performance mínima",
          en: "minimum performance",
          es: "rendimiento mínimo",
          zh: "最低性能",
        },
        illustrative: false,
      },
      {
        value: "+XX%",
        label: {
          pt: "conversão",
          en: "conversion",
          es: "conversión",
          zh: "转化率",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: timelapse dos sites do ecossistema em telas
    // diferentes, ou zoom out de um dashboard do Clarity/GA com dados reais.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/7872722/7872722-uhd_1440_2732_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/7872722/decorative-plants-laptop-pexels-photos-7872722.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Mãos rolando a tela de um site em um laptop",
        en: "Hands scrolling through a website on a laptop",
        es: "Manos desplazándose por un sitio web en una laptop",
        zh: "双手在笔记本电脑上滚动浏览网站",
      },
    },
    comingSoon: true,
    repoUrl: "#", // placeholder até a URL real do repositório: só pra testar o botão "ver repositório" aparecendo, troque por um link de verdade antes de publicar.
  },
  {
    slug: "ganwalk",
    area: "music",
    // Os três artistas ficam lado a lado no carrossel da home (desktop),
    // ver CasesGrid: mesmo group, adjacentes no array.
    group: "artistas",
    year: "2022/2026",
    title: {
      pt: "Ganwalk",
      en: "Ganwalk",
      es: "Ganwalk",
      zh: "Ganwalk",
    },
    statement: {
      pt: "Criei a experiência interativa do Ganwalk, onde a identidade visual do artista ganha vida na tela.",
      en: "I created Ganwalk's interactive experience, where the artist's visual identity comes alive on screen.",
      es: "Creé la experiencia interactiva de Ganwalk, donde la identidad visual del artista cobra vida en la pantalla.",
      zh: "打造了 Ganwalk 的互动体验，让这位音乐人的视觉形象在屏幕上活了起来。",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
      zh: ["音乐", "Webapp", "艺术指导", "互动设计"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "tempo de sessão",
          en: "session time",
          es: "tiempo de sesión",
          zh: "会话时长",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio do artista tocando ao fundo. O placeholder antigo (estúdio de
    // gravação) foi pro case de produção musical (ver experiments.ts), que
    // combina melhor com ele; este aqui é código/terminal rolando na tela,
    // mais afinado com o "a identidade visual do artista ganha vida na
    // tela" do statement acima.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/852292/852292-hd_1728_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/852292/free-video-852292.jpg?auto=compress&w=1260&h=750&dpr=1",
      alt: {
        pt: "Código rolando em tela escura, como um terminal em execução",
        en: "Code scrolling on a dark screen, like a running terminal",
        es: "Código desplazándose en una pantalla oscura, como una terminal en ejecución",
        zh: "深色屏幕上滚动的代码，如同运行中的终端",
      },
    },
    comingSoon: true,
    repoUrl: "#", // placeholder até a URL real do repositório: só pra testar o botão "ver repositório" aparecendo, troque por um link de verdade antes de publicar.
  },
  {
    slug: "dezert-horse",
    area: "music",
    group: "artistas",
    year: "2022/2026",
    title: {
      pt: "Dezert Horse",
      en: "Dezert Horse",
      es: "Dezert Horse",
      zh: "Dezert Horse",
    },
    statement: {
      pt: "Projetei a experiência interativa do Dezert Horse, um universo visual construído em torno do som da banda.",
      en: "I designed Dezert Horse's interactive experience, a visual universe built around the band's sound.",
      es: "Diseñé la experiencia interactiva de Dezert Horse, un universo visual construido alrededor del sonido de la banda.",
      zh: "设计了 Dezert Horse 的互动体验，围绕乐队的音乐打造出一个完整的视觉世界。",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
      zh: ["音乐", "Webapp", "艺术指导", "互动设计"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "engajamento",
          en: "engagement",
          es: "interacción",
          zh: "互动参与度",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio da banda tocando ao fundo.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/5442713/5442713-hd_1920_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/5442713/brown-sand-desert-desert-adventure-desert-sand-5442713.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Ondulações de areia numa duna sob céu limpo",
        en: "Sand ripples on a dune under a clear sky",
        es: "Ondulaciones de arena en una duna bajo un cielo despejado",
        zh: "晴空下沙丘上的波纹",
      },
    },
    comingSoon: true,
    repoUrl: "#", // placeholder até a URL real do repositório: só pra testar o botão "ver repositório" aparecendo, troque por um link de verdade antes de publicar.
  },
  {
    slug: "pink-opala",
    area: "music",
    group: "artistas",
    year: "2022/2026",
    title: {
      pt: "Pink Opala",
      en: "Pink Opala",
      es: "Pink Opala",
      zh: "Pink Opala",
    },
    statement: {
      pt: "Desenvolvi a experiência interativa do Pink Opala, em que cada rolagem responde ao clima sonoro do artista.",
      en: "I developed Pink Opala's interactive experience, where every scroll responds to the artist's sonic mood.",
      es: "Desarrollé la experiencia interactiva de Pink Opala, donde cada desplazamiento responde al clima sonoro del artista.",
      zh: "开发了 Pink Opala 的互动体验，每一次滚动都呼应着音乐人的声音氛围。",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
      zh: ["音乐", "Webapp", "艺术指导", "互动设计"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "retenção",
          en: "retention",
          es: "retención",
          zh: "留存率",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio do artista tocando ao fundo.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/12137476/12137476-hd_1920_1080_50fps.mp4",
      poster:
        "https://images.pexels.com/videos/12137476/4k-above-clouds-canon-r6-dramatic-sky-12137476.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Nuvens rosadas sobre um céu de fim de tarde",
        en: "Pink clouds against a late afternoon sky",
        es: "Nubes rosadas sobre un cielo de atardecer",
        zh: "傍晚天空中的粉色云层",
      },
    },
    comingSoon: true,
    repoUrl: "#", // placeholder até a URL real do repositório: só pra testar o botão "ver repositório" aparecendo, troque por um link de verdade antes de publicar.
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
