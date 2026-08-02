import type { CaseStudy } from "./types";

// Lineup de lançamento: 2 cases de Banking + 4 de Música. Os três artistas
// (Ganwalk, Dezert Horse, Pink Opala) são projetos individuais, cada um com
// a própria página e o próprio lugar no carrossel da home, não um case
// guarda chuva só.
// Métricas com value "+XX%" são placeholders explícitos até calibração com números reais.
// Telas dos cases de Banking serão recriadas/anonimizadas até autorização formal de uso.
//
// Capas: todas em vídeo (nenhuma foto estática), placeholders do Pexels
// escolhidos pelo clima de cada case. Para trocar pela mídia real, basta
// substituir src (e poster) no bloco cover.

export const cases: CaseStudy[] = [
  {
    slug: "intranet-auvp",
    area: "banking",
    year: "2024/2026",
    title: {
      pt: "Intranet completa",
      en: "Complete intranet",
      es: "Intranet completa",
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
      src: "https://videos.pexels.com/video-files/7101965/7101965-uhd_1440_2190_25fps.mp4",
      poster:
        "https://images.pexels.com/videos/7101965/abstract-abstract-background-background-gradient-7101965.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Gradiente abstrato colorido em movimento",
        en: "Colorful abstract gradient in motion",
        es: "Degradado abstracto colorido en movimiento",
      },
    },
    comingSoon: true,
  },
  {
    slug: "ecossistema-auvp",
    area: "banking",
    year: "2023/2026",
    title: {
      pt: "Sites AUVP",
      en: "AUVP websites",
      es: "Sitios AUVP",
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
      src: "https://videos.pexels.com/video-files/8333185/8333185-hd_1080_1080_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/8333185/abstract-art-artistic-background-8333185.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Fundo abstrato colorido com gradientes em movimento",
        en: "Abstract colorful background with moving gradients",
        es: "Fondo abstracto colorido con degradados en movimiento",
      },
    },
    comingSoon: true,
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
    },
    statement: {
      pt: "Criei a experiência interativa do Ganwalk, onde a identidade visual do artista ganha vida na tela.",
      en: "I created Ganwalk's interactive experience, where the artist's visual identity comes alive on screen.",
      es: "Creé la experiencia interactiva de Ganwalk, donde la identidad visual del artista cobra vida en la pantalla.",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "tempo de sessão",
          en: "session time",
          es: "tiempo de sesión",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio do artista tocando ao fundo.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/35340079/14973729_1080_1920_60fps.mp4",
      poster:
        "https://images.pexels.com/videos/35340079/pexels-photo-35340079.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Multidão vibrante numa apresentação, luzes de celular acesas",
        en: "Vibrant crowd at a performance, cellphone lights on",
        es: "Multitud vibrante en una presentación, luces de celular encendidas",
      },
    },
    comingSoon: true,
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
    },
    statement: {
      pt: "Projetei a experiência interativa do Dezert Horse, um universo visual construído em torno do som da banda.",
      en: "I designed Dezert Horse's interactive experience, a visual universe built around the band's sound.",
      es: "Diseñé la experiencia interactiva de Dezert Horse, un universo visual construido alrededor del sonido de la banda.",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "engajamento",
          en: "engagement",
          es: "interacción",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio da banda tocando ao fundo.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/9145177/9145177-uhd_2560_1440_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/9145177/3d-rendering-abstract-art-backdrop-9145177.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Curvas de neon abstratas em movimento",
        en: "Abstract neon curves in motion",
        es: "Curvas de neón abstractas en movimiento",
      },
    },
    comingSoon: true,
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
    },
    statement: {
      pt: "Desenvolvi a experiência interativa do Pink Opala, em que cada rolagem responde ao clima sonoro do artista.",
      en: "I developed Pink Opala's interactive experience, where every scroll responds to the artist's sonic mood.",
      es: "Desarrollé la experiencia interactiva de Pink Opala, donde cada desplazamiento responde al clima sonoro del artista.",
    },
    tags: {
      pt: ["Música", "Webapp", "Direção de arte", "Interatividade"],
      en: ["Music", "Webapp", "Art direction", "Interactivity"],
      es: ["Música", "Webapp", "Dirección de arte", "Interactividad"],
    },
    metrics: [
      {
        value: "+XX%",
        label: {
          pt: "retenção",
          en: "retention",
          es: "retención",
        },
        illustrative: true,
      },
    ],
    // Sugestão de mídia real: screencast navegando pela experiência, com o
    // áudio do artista tocando ao fundo.
    cover: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/30636173/13112850_1080_1920_30fps.mp4",
      poster:
        "https://images.pexels.com/videos/30636173/pexels-photo-30636173.jpeg?auto=compress&w=1280",
      alt: {
        pt: "Show energético num clube, luzes dinâmicas e coloridas",
        en: "Energetic club performance, dynamic colorful lighting",
        es: "Show enérgico en un club, luces dinámicas y coloridas",
      },
    },
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
