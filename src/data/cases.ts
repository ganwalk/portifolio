import type { CaseStudy } from "./types";

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
// Capas: a maioria em vídeo, placeholders do Pexels escolhidos pelo clima de
// cada case (Ganwalk e Dezert Horse ainda esperam captura de tela real dos
// próprios sites: os dois usam WebGL/Three.js, então até lá o clima visual
// mais próximo já escolhido, terminal/código e duna de areia, continua no
// lugar). Pink Opala já usa a foto de capa real do próprio site (ver
// comentário no bloco cover dele). Para trocar pela mídia real, basta
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
      pt: "Desenhei a identidade visual interativa do Ganwalk: um logotipo de partículas em WebGL que reage ao toque e um painel de mixagem ao vivo, com looper e gravação, direto no navegador.",
      en: "I designed Ganwalk's interactive visual identity: a WebGL particle logo that reacts to touch, plus a live mixing panel with a looper and recording, straight in the browser.",
      es: "Diseñé la identidad visual interactiva de Ganwalk: un logotipo de partículas en WebGL que reacciona al toque y un panel de mezcla en vivo, con looper y grabación, directo en el navegador.",
      zh: "打造了 Ganwalk 的互动视觉形象：一个会随触摸反应的 WebGL 粒子标志，还有一个内置循环采样和录音功能的实时混音面板，全部在浏览器里运行。",
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
    // O site real já está no ar (ver demoUrl, embutido em LiveEmbed no
    // corpo do case), mas a CAPA aqui embaixo continua o placeholder de
    // vídeo: código/terminal rolando na tela, o clima mais próximo do que
    // o site de verdade entrega (visual "code editor" com glitch). Pendente:
    // trocar por uma captura de tela real do próprio site.
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
      pt: "Projetei o universo interativo do Dezert Horse: um deserto em Three.js com um painel de controle retrô que toca o álbum inteiro, faixa a faixa, direto no site.",
      en: "I designed Dezert Horse's interactive universe: a Three.js desert with a retro control panel that plays the whole album, track by track, right on the site.",
      es: "Diseñé el universo interactivo de Dezert Horse: un desierto en Three.js con un panel de control retro que reproduce el álbum entero, pista a pista, directo en el sitio.",
      zh: "打造了 Dezert Horse 的互动世界：一片用 Three.js 呈现的沙漠场景，配上一个复古控制面板，可以直接在网站上逐首播放整张专辑。",
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
      pt: "Desenvolvi o site oficial do Pink Opala, duo indie pop de Goiânia: partículas com física de mola formam o nome da banda, e discografia, galeria e contato moram numa página só, sem build nem framework.",
      en: "I built Pink Opala's official site, an indie pop duo from Goiânia, Brazil: spring-physics particles form the band's name, and the discography, gallery and contact all live in one single page, no build step or framework.",
      es: "Desarrollé el sitio oficial de Pink Opala, dúo de indie pop de Goiânia: partículas con física de resorte forman el nombre de la banda, y discografía, galería y contacto viven en una sola página, sin build ni framework.",
      zh: "打造了巴西戈亚尼亚独立流行二人组 Pink Opala 的官方网站：带弹簧物理效果的粒子拼出乐队名字，唱片、相册和联系方式全部集中在一个单页面里，无需构建工具或框架。",
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
    // Mídia real: a própria foto de capa do site (`principal.webp`), servida
    // direto do repositório via raw.githubusercontent.com, o mesmo CDN
    // caseiro que o site oficial da banda já usa pra todas as imagens (ver
    // README do repositório). Sem stock: é a dupla de verdade.
    cover: {
      kind: "image",
      src: "https://raw.githubusercontent.com/ganwalk/pinkopala/main/principal.webp",
      alt: {
        pt: "A dupla do Pink Opala, costas com costas, com maquiagem glitter, no visual do site oficial",
        en: "Pink Opala's duo, back to back, wearing glitter makeup, in the official site's visual",
        es: "El dúo de Pink Opala, espalda con espalda, con maquillaje glitter, en el visual del sitio oficial",
        zh: "Pink Opala 二人组背靠背合影，妆容带有闪粉质感，出自官方网站的视觉设计",
      },
    },
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/pinkopala",
    demoUrl: "https://ganwalk.github.io/pinkopala/",
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
