import type { CaseStudy } from "./types";

// Lineup de lançamento: 2 cases de Banking + 2 de Música.
// Métricas com value "+XX%" são placeholders explícitos até calibração com números reais.
// Telas dos cases de Banking serão recriadas/anonimizadas até autorização formal de uso.
//
// Capas: vídeos e fotos do Pexels como placeholder, escolhidos pelo clima de cada
// case. Para trocar pela mídia real, basta substituir src (e poster) no bloco cover.

export const cases: CaseStudy[] = [
  {
    slug: "intranet-auvp",
    area: "banking",
    year: "2024/2026",
    title: {
      pt: "Intranet AUVP",
      en: "AUVP Intranet",
      es: "Intranet AUVP",
    },
    statement: {
      pt: "Construí uma intranet robusta com Design System completo e manual de tom e voz para todo o ecossistema.",
      en: "I built a robust intranet with a complete Design System and tone of voice manual for the whole ecosystem.",
      es: "Construí una intranet robusta con un Design System completo y manual de tono y voz para todo el ecosistema.",
    },
    tags: {
      pt: ["Design System", "Intranet", "Tom e voz", "Banking"],
      en: ["Design System", "Intranet", "Tone of voice", "Banking"],
      es: ["Design System", "Intranet", "Tono y voz", "Banking"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "adoção interna",
          en: "internal adoption",
          es: "adopción interna",
        },
        illustrative: true,
      },
      {
        value: "XX",
        label: {
          pt: "componentes documentados",
          en: "documented components",
          es: "componentes documentados",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela intranet, ou motion
    // reveal dos componentes do Design System em grid.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&w=1280",
      alt: {
        pt: "Projeção digital de linhas geométricas abstratas",
        en: "Digital projection of abstract geometric lines",
        es: "Proyección digital de líneas geométricas abstractas",
      },
    },
    comingSoon: true,
  },
  {
    slug: "ecossistema-auvp",
    area: "banking",
    year: "2023/2026",
    title: {
      pt: "Ecossistema de sites AUVP Capital",
      en: "AUVP Capital web ecosystem",
      es: "Ecosistema web AUVP Capital",
    },
    statement: {
      pt: "Desenho e mantenho o ecossistema de webpages da AUVP Capital, guiado por métricas, SEO e performance.",
      en: "I design and maintain AUVP Capital's webpage ecosystem, guided by metrics, SEO and performance.",
      es: "Diseño y mantengo el ecosistema de webpages de AUVP Capital, guiado por métricas, SEO y performance.",
    },
    tags: {
      pt: ["Webpages", "SEO", "Conversão", "Clarity & GA"],
      en: ["Webpages", "SEO", "Conversion", "Clarity & GA"],
      es: ["Webpages", "SEO", "Conversión", "Clarity & GA"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "conversão",
          en: "conversion",
          es: "conversión",
        },
        illustrative: true,
      },
      {
        value: "-XXs",
        label: {
          pt: "tempo de carregamento",
          en: "loading time",
          es: "tiempo de carga",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: timelapse dos sites do ecossistema em telas
    // diferentes, ou zoom out de um dashboard do Clarity/GA com dados reais.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/3141210/3141210-hd_1920_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/3141210/free-video-3141210.jpg?auto=compress&w=1280",
      alt: {
        pt: "Cálculo digital em simetria geométrica",
        en: "Digital calculation in geometric symmetry",
        es: "Cálculo digital en simetría geométrica",
      },
    },
    comingSoon: true,
  },
  {
    slug: "experiencias-artistas",
    area: "music",
    year: "2022/2026",
    title: {
      pt: "Experiências interativas para artistas",
      en: "Interactive experiences for artists",
      es: "Experiencias interactivas para artistas",
    },
    statement: {
      pt: "Criei experiências interativas para Ganwalk, Dezert Horse e Pink Opala, onde o design encontra o som.",
      en: "I created interactive experiences for Ganwalk, Dezert Horse and Pink Opala, where design meets sound.",
      es: "Creé experiencias interactivas para Ganwalk, Dezert Horse y Pink Opala, donde el diseño encuentra el sonido.",
    },
    tags: {
      pt: ["Música", "Webapps", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapps", "Art direction", "Interactivity"],
      es: ["Música", "Webapps", "Dirección de arte", "Interactividad"],
    },
    metrics: [
      {
        value: "3",
        label: {
          pt: "artistas, três universos visuais",
          en: "artists, three visual universes",
          es: "artistas, tres universos visuales",
        },
        illustrative: false,
      },
    ],
    // Sugestão de mídia real: montagem curta alternando as três experiências
    // (Ganwalk, Dezert Horse, Pink Opala) com o áudio de cada artista.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/3941289/3941289-hd_1920_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=1280",
      alt: {
        pt: "Multidão em um show, luzes de palco ao fundo",
        en: "Crowd at a concert, stage lights in the background",
        es: "Multitud en un concierto, luces de escenario al fondo",
      },
    },
    // Um campo por artista, lado a lado no corpo do case. Placeholder
    // seguindo a mesma convenção de picsum.photos com seed usada no resto do
    // site (Contact, SiteMenu); troca é só apontar src pra mídia real de
    // cada projeto.
    subProjects: [
      {
        name: "Ganwalk",
        media: {
          kind: "image",
          src: "https://picsum.photos/seed/ganwalk-armando/800/1000",
          alt: {
            pt: "Identidade visual do projeto Ganwalk",
            en: "Ganwalk project visual identity",
            es: "Identidad visual del proyecto Ganwalk",
          },
        },
      },
      {
        name: "Dezert Horse",
        media: {
          kind: "image",
          src: "https://picsum.photos/seed/dezert-horse-armando/800/1000",
          alt: {
            pt: "Identidade visual do projeto Dezert Horse",
            en: "Dezert Horse project visual identity",
            es: "Identidad visual del proyecto Dezert Horse",
          },
        },
      },
      {
        name: "Pink Opala",
        media: {
          kind: "image",
          src: "https://picsum.photos/seed/pink-opala-armando/800/1000",
          alt: {
            pt: "Identidade visual do projeto Pink Opala",
            en: "Pink Opala project visual identity",
            es: "Identidad visual del proyecto Pink Opala",
          },
        },
      },
    ],
    comingSoon: true,
  },
  {
    slug: "guia-da-musica-2026",
    area: "music",
    year: "2026",
    title: {
      pt: "Guia da Música 2026",
      en: "Music Guide 2026",
      es: "Guía de la Música 2026",
    },
    statement: {
      pt: "Projetei o Guia da Música 2026, uma experiência editorial e interativa para navegar o ano da música.",
      en: "I designed the Music Guide 2026, an editorial, interactive experience for navigating the year in music.",
      es: "Diseñé la Guía de la Música 2026, una experiencia editorial e interactiva para navegar el año de la música.",
    },
    tags: {
      pt: ["Editorial", "Interatividade", "Música"],
      en: ["Editorial", "Interactivity", "Music"],
      es: ["Editorial", "Interactividad", "Música"],
    },
    metrics: [
      {
        value: "+XX",
        label: {
          pt: "mil leituras",
          en: "thousand reads",
          es: "mil lecturas",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: scroll gravado do próprio Guia, mostrando as
    // interações editoriais, ou animação da capa da edição 2026.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/4380097/4380097-hd_1920_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=1280",
      alt: {
        pt: "Disco de vinil girando em uma vitrola",
        en: "Vinyl record spinning on a turntable",
        es: "Disco de vinilo girando en un tocadiscos",
      },
    },
    comingSoon: true,
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
