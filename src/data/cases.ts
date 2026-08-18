import type { CaseStudy } from "./types";

// basePath não é aplicado a src montado à mão em JS (só a next/image e links
// internos do próprio Next): o mesmo motivo de experiments.ts. Só entra em
// jogo pras mídias locais deste arquivo (hoje, as capas de Ganwalk e Pink
// Opala); o resto continua apontando pra URL externa (Pexels, ou o próprio
// GitHub do artista) sem precisar dele.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Lineup de lançamento: 2 cases de Banking + 3 de Música. Os três artistas
// (Ganwalk, Dezert Horse, Pink Opala) são projetos individuais, cada um com
// a própria página e o próprio lugar no carrossel da home, não um case
// guarda chuva só. Os três já estão no ar (site publicado, repositório
// público): `repoUrl` aponta pro código no GitHub e `demoUrl` pro site
// publicado, que aparece embutido em iframe de verdade no corpo do case
// (ver LiveEmbed.tsx), navegável ali mesmo dentro do portfólio.
// Métricas com value "+XX%" são placeholders explícitos até calibração com números reais.
// Telas dos cases de Banking serão recriadas/anonimizadas até autorização formal de uso.
//
// Capas: a maioria em vídeo. Dezert Horse ainda espera captura de tela real
// do próprio site (usa WebGL/Three.js, então até lá o clima visual mais
// próximo já escolhido, duna de areia, continua no lugar, placeholder do
// Pexels). Ganwalk e Pink Opala já usam preview real do próprio projeto,
// servido localmente (ver comentário no bloco cover de cada um). Para
// trocar pela mídia real, basta substituir src (e poster) no bloco cover.
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
      headline: {
        pt: "Construí uma intranet robusta para todo o ecossistema.",
        en: "I built a robust intranet for the whole ecosystem.",
        es: "Construí una intranet robusta para todo el ecosistema.",
        zh: "为整个生态系统搭建了一套完善的内部网站。",
      },
      detail: {
        pt: "Com Design System completo e manual de tom e voz.",
        en: "With a complete Design System and tone of voice manual.",
        es: "Con un Design System completo y manual de tono y voz.",
        zh: "包含完整的设计系统和语气语调手册。",
      },
    },
    hoverLabel: {
      pt: "Ver o Design System",
      en: "See the Design System",
      es: "Ver el Design System",
      zh: "查看设计系统",
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
      headline: {
        pt: "Desenhei a identidade visual interativa do Ganwalk.",
        en: "I designed Ganwalk's interactive visual identity.",
        es: "Diseñé la identidad visual interactiva de Ganwalk.",
        zh: "打造了 Ganwalk 的互动视觉形象。",
      },
      detail: {
        pt: "Um logotipo de partículas em WebGL que reage ao toque, e um painel de mixagem ao vivo, com looper e gravação, direto no navegador.",
        en: "A WebGL particle logo that reacts to touch, plus a live mixing panel with a looper and recording, straight in the browser.",
        es: "Un logotipo de partículas en WebGL que reacciona al toque, y un panel de mezcla en vivo, con looper y grabación, directo en el navegador.",
        zh: "一个会随触摸反应的 WebGL 粒子标志，还有一个内置循环采样和录音功能的实时混音面板，全部在浏览器里运行。",
      },
    },
    hoverLabel: {
      pt: "Tocar nas partículas",
      en: "Touch the particles",
      es: "Tocar las partículas",
      zh: "触碰粒子",
    },
    tags: {
      pt: ["Música", "WebGL", "Three.js", "Interatividade"],
      en: ["Music", "WebGL", "Three.js", "Interactivity"],
      es: ["Música", "WebGL", "Three.js", "Interactividad"],
      zh: ["音乐", "WebGL", "Three.js", "互动设计"],
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
    // Mídia real: vídeo de preview do próprio projeto (ver ganwalk-preview/
    // e scripts/build-ganwalk-preview.mjs), a palavra "ganwalk" repetida
    // formando um retrato em silhueta, âmbar sobre preto, no mesmo clima
    // "code editor" do site de verdade. Uma versão só (sem srcMobile): o
    // efeito é abstrato o bastante pra funcionar recortado em qualquer
    // proporção, ao contrário do still específico do Pink Opala.
    cover: {
      kind: "video",
      src: `${basePath}/videos/ganwalk-preview.mp4`,
      poster: `${basePath}/photos/ganwalk-preview.webp`,
      alt: {
        pt: "Retrato em silhueta formado pela palavra \"ganwalk\" repetida em âmbar sobre fundo preto",
        en: "Portrait silhouette formed by the word \"ganwalk\" repeated in amber over a black background",
        es: "Retrato en silueta formado por la palabra \"ganwalk\" repetida en ámbar sobre fondo negro",
        zh: "由 \"ganwalk\" 一词反复排列形成的琥珀色剪影肖像，黑色背景",
      },
    },
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/2026",
    demoUrl: "https://ganwalk.github.io/2026/",
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
      headline: {
        pt: "Projetei o universo interativo do Dezert Horse.",
        en: "I designed Dezert Horse's interactive universe.",
        es: "Diseñé el universo interactivo de Dezert Horse.",
        zh: "打造了 Dezert Horse 的互动世界。",
      },
      detail: {
        pt: "Um deserto em Three.js com um painel de controle retrô que toca o álbum inteiro, faixa a faixa, direto no site.",
        en: "A Three.js desert with a retro control panel that plays the whole album, track by track, right on the site.",
        es: "Un desierto en Three.js con un panel de control retro que reproduce el álbum entero, pista a pista, directo en el sitio.",
        zh: "一片用 Three.js 呈现的沙漠场景，配上一个复古控制面板，可以直接在网站上逐首播放整张专辑。",
      },
    },
    hoverLabel: {
      pt: "Ouvir o álbum",
      en: "Listen to the album",
      es: "Escuchar el álbum",
      zh: "聆听专辑",
    },
    tags: {
      pt: ["Música", "WebGL", "Three.js", "Player embutido"],
      en: ["Music", "WebGL", "Three.js", "Embedded player"],
      es: ["Música", "WebGL", "Three.js", "Reproductor integrado"],
      zh: ["音乐", "WebGL", "Three.js", "内置播放器"],
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
    // O site real já está no ar (ver demoUrl, embutido em LiveEmbed no
    // corpo do case), mas a CAPA aqui embaixo continua o placeholder de
    // vídeo: já batia com o tema (deserto de verdade em Three.js). Pendente:
    // trocar por uma captura de tela real do próprio site.
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
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/cavalo",
    demoUrl: "https://ganwalk.github.io/cavalo/",
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
      headline: {
        pt: "Desenvolvi o site oficial do Pink Opala, duo indie pop de Goiânia.",
        en: "I built Pink Opala's official site, an indie pop duo from Goiânia, Brazil.",
        es: "Desarrollé el sitio oficial de Pink Opala, dúo de indie pop de Goiânia.",
        zh: "打造了巴西戈亚尼亚独立流行二人组 Pink Opala 的官方网站。",
      },
      detail: {
        pt: "Partículas com física de mola formam o nome da banda, e discografia, galeria e contato moram numa página só, sem build nem framework.",
        en: "Spring-physics particles form the band's name, and the discography, gallery and contact all live in one single page, no build step or framework.",
        es: "Partículas con física de resorte forman el nombre de la banda, y discografía, galería y contacto viven en una sola página, sin build ni framework.",
        zh: "带弹簧物理效果的粒子拼出乐队名字，唱片、相册和联系方式全部集中在一个单页面里，无需构建工具或框架。",
      },
    },
    hoverLabel: {
      pt: "Ver o nome reagir",
      en: "Watch the name react",
      es: "Ver el nombre reaccionar",
      zh: "看名字随手而动",
    },
    tags: {
      pt: ["Música", "Canvas 2D", "Tailwind CSS", "Interatividade"],
      en: ["Music", "Canvas 2D", "Tailwind CSS", "Interactivity"],
      es: ["Música", "Canvas 2D", "Tailwind CSS", "Interactividad"],
      zh: ["音乐", "Canvas 2D", "Tailwind CSS", "互动设计"],
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
    // Mídia real: gravação de tela do próprio hero do site (ver
    // pink-opala-preview/ e scripts/build-pink-opala-preview.mjs), o nome
    // da banda em partículas de areia reagindo ao mouse de verdade, não só
    // um still parado. Duas versões (a fonte já veio das duas): horizontal
    // pro painel widescreen do desktop, vertical pra tela de celular em pé
    // (ver srcMobile/posterMobile, MediaView.tsx escolhe pelo mesmo
    // breakpoint que decide mobile/desktop no resto do site).
    cover: {
      kind: "video",
      src: `${basePath}/videos/pink-opala-preview-horizontal.mp4`,
      poster: `${basePath}/photos/pink-opala-preview-horizontal.webp`,
      srcMobile: `${basePath}/videos/pink-opala-preview-vertical.mp4`,
      posterMobile: `${basePath}/photos/pink-opala-preview-vertical.webp`,
      alt: {
        pt: "Tela inicial do site do Pink Opala, nome da banda em partículas de areia reagindo ao movimento do mouse",
        en: "Pink Opala's site landing screen, the band's name in sand particles reacting to mouse movement",
        es: "Pantalla inicial del sitio de Pink Opala, nombre de la banda en partículas de arena reaccionando al movimiento del mouse",
        zh: "Pink Opala 网站的初始画面：由沙粒效果拼出的乐队名字随鼠标移动而变化",
      },
    },
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/pinkopala",
    demoUrl: "https://ganwalk.github.io/pinkopala/",
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
      headline: {
        pt: "Desenho e mantenho o ecossistema de webpages da AUVP Capital.",
        en: "I design and maintain AUVP Capital's webpage ecosystem.",
        es: "Diseño y mantengo el ecosistema de webpages de AUVP Capital.",
        zh: "设计并维护 AUVP Capital 的网页生态系统。",
      },
      detail: {
        pt: "Todas as LPs com no mínimo 90/100 de performance, alta conversão e bom rankeamento nos mecanismos de busca e em IA.",
        en: "Every LP scores at least 90/100 on performance, with high conversion and strong ranking on search engines and AI.",
        es: "Todas las LPs con al menos 90/100 de rendimiento, alta conversión y buen posicionamiento en buscadores y en IA.",
        zh: "所有落地页性能评分至少 90/100，转化率高，且在搜索引擎和人工智能中排名良好。",
      },
    },
    hoverLabel: {
      pt: "Ver as landing pages",
      en: "See the landing pages",
      es: "Ver las landing pages",
      zh: "查看落地页",
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
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
