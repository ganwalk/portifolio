import type { CaseStudy } from "./types";

// basePath não é aplicado a src montado à mão em JS (só a next/image e links
// internos do próprio Next): o mesmo motivo de experiments.ts. Só entra em
// jogo pras mídias locais deste arquivo (hoje, as capas de Ganwalk e Pink
// Opala); o resto continua apontando pra URL externa (Pexels, ou o próprio
// GitHub do artista) sem precisar dele.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Lineup de lançamento: 1 case de Banking (Intranet) + 4 de Música (o trio
// de artistas e o Guia da música). Os três artistas (Ganwalk, Dezert Horse,
// Pink Opala) e o Guia da música são projetos individuais, cada um com a
// própria página e o próprio lugar no carrossel da home, não um case guarda
// chuva só. Todos já estão no ar (site publicado, repositório público):
// `repoUrl` aponta pro código no GitHub e `demoUrl` pro site publicado, que
// aparece embutido em iframe de verdade no corpo do case (ver LiveEmbed.tsx),
// navegável ali mesmo dentro do portfólio.
// Métricas: reais sempre que houver dado de verdade (analytics, contagem no
// próprio repositório ou no próprio site); `illustrative: true` só nos
// placeholders explícitos ainda não calibrados.
// Telas do case de Banking serão recriadas/anonimizadas até autorização formal de uso.
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
//
// Ordem do carrossel: o trio de artistas abre a lista (três colunas lado a
// lado no desktop, ver `group: "artistas"` abaixo), seguido do par Intranet
// + Guia da música (duas colunas, `group: "web"`). Cases adjacentes com o
// mesmo `group` viram uma fatia só do carrossel (ver buildSlides em
// CasesGrid.tsx): a ordem do array decide tanto a sequência quanto o
// agrupamento, os dois de uma vez.

export const cases: CaseStudy[] = [
  {
    slug: "ganwalk",
    area: "music",
    // Os três artistas ficam lado a lado no carrossel da home (desktop),
    // ver CasesGrid: mesmo group, adjacentes no array.
    group: "artistas",
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
    // Sem dado de impacto no site em si (não há analytics público do
    // Ganwalk): a métrica vem do próprio repositório (git log --oneline),
    // contada em 19/08/2026.
    metrics: [
      {
        value: "67",
        label: {
          pt: "commits no repositório",
          en: "commits in the repository",
          es: "commits en el repositorio",
          zh: "仓库提交次数",
        },
        illustrative: false,
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
    // Sem dado de impacto no site em si: a métrica vem do próprio
    // repositório (git log --oneline), contada em 19/08/2026.
    metrics: [
      {
        value: "8",
        label: {
          pt: "commits no repositório",
          en: "commits in the repository",
          es: "commits en el repositorio",
          zh: "仓库提交次数",
        },
        illustrative: false,
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
    // Sem dado de impacto no site em si: a métrica vem do próprio
    // repositório (git log --oneline), contada em 19/08/2026.
    metrics: [
      {
        value: "54",
        label: {
          pt: "commits no repositório",
          en: "commits in the repository",
          es: "commits en el repositorio",
          zh: "仓库提交次数",
        },
        illustrative: false,
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
    slug: "intranet-auvp",
    area: "banking",
    // Intranet e Guia da música ficam lado a lado no carrossel da home
    // (desktop), duas colunas: mesmo group, adjacentes no array (mesmo
    // raciocínio do trio de artistas acima).
    group: "web",
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
    // Métricas reais, contadas direto no código do repositório (não
    // estimativa): 70 é o tamanho de `sections` em
    // src/data/designSystemSections.ts (uma entrada por componente/padrão
    // com vitrine própria), 110 é 60 componentes autorais em
    // src/components/widgets mais os 50 componentes base do shadcn/ui em
    // src/components/ui, e 10 é a lista de áreas em src/data/areasEmpresa.ts.
    metrics: [
      {
        value: "70",
        label: {
          pt: "componentes documentados",
          en: "documented components",
          es: "componentes documentados",
          zh: "已归档组件数",
        },
        illustrative: false,
      },
      {
        value: "110",
        label: {
          pt: "componentes React no total",
          en: "React components in total",
          es: "componentes React en total",
          zh: "React 组件总数",
        },
        illustrative: false,
      },
      {
        value: "10",
        label: {
          pt: "áreas mapeadas no tom de voz",
          en: "areas mapped in the tone of voice",
          es: "áreas mapeadas en el tono de voz",
          zh: "语气语调手册覆盖的部门",
        },
        illustrative: false,
      },
    ],
    // Mídia real: screencast rolando pela home do Design System
    // (ver scripts/capture-intranet-cover.mjs), capturado direto do site
    // publicado em `demoUrl`.
    cover: {
      kind: "video",
      src: `${basePath}/videos/intranet-preview.mp4`,
      poster: `${basePath}/photos/intranet-preview.webp`,
      alt: {
        pt: "Rolagem pela home do Design System, mostrando o símbolo da marca, paletas de cor e componentes documentados",
        en: "Scrolling through the Design System home, showing the brand symbol, color palettes and documented components",
        es: "Recorrido por la home del Design System, mostrando el símbolo de la marca, paletas de color y componentes documentados",
        zh: "滚动浏览设计系统主页,展示品牌标志、色板与已归档的组件",
      },
    },
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/intranet",
    demoUrl: "https://ganwalk.github.io/intranet/",
  },
  {
    slug: "guia-da-musica",
    area: "music",
    group: "web",
    title: {
      pt: "Guia da música",
      en: "Music Guide",
      es: "Guía de música",
      zh: "音乐指南",
    },
    statement: {
      headline: {
        pt: "Construí uma plataforma colaborativa com os lançamentos mais esperados da música brasileira.",
        en: "I built a collaborative platform for Brazilian music's most anticipated releases.",
        es: "Construí una plataforma colaborativa con los lanzamientos más esperados de la música brasileña.",
        zh: "打造了一个收录巴西音乐最受期待发行作品的协作平台。",
      },
      detail: {
        pt: "Linha do tempo, mapa por estado e um fluxo de submissão da comunidade, com moderação em tempo real via Firebase.",
        en: "A timeline, a map by state, and a community submission flow, moderated in real time via Firebase.",
        es: "Línea de tiempo, mapa por estado y un flujo de envío de la comunidad, moderado en tiempo real vía Firebase.",
        zh: "发行时间线、按州划分的地图，以及通过 Firebase 实时审核的社区提交流程。",
      },
    },
    hoverLabel: {
      pt: "Ver o guia",
      en: "See the guide",
      es: "Ver la guía",
      zh: "查看指南",
    },
    tags: {
      pt: ["Firebase", "Google Charts", "Tailwind CSS", "Comunidade"],
      en: ["Firebase", "Google Charts", "Tailwind CSS", "Community"],
      es: ["Firebase", "Google Charts", "Tailwind CSS", "Comunidad"],
      zh: ["Firebase", "Google Charts", "Tailwind CSS", "社区"],
    },
    // Números reais, lidos direto do próprio site (guiadelancamentos.com.br)
    // em 19/08/2026: soma do seed estático com as submissões da comunidade
    // já aprovadas no Firestore, não uma estimativa.
    metrics: [
      {
        value: "432",
        label: {
          pt: "lançamentos catalogados",
          en: "releases catalogued",
          es: "lanzamientos catalogados",
          zh: "已收录的发行作品",
        },
        illustrative: false,
      },
      {
        value: "301",
        label: {
          pt: "artistas mapeados",
          en: "artists mapped",
          es: "artistas mapeados",
          zh: "已收录的艺人",
        },
        illustrative: false,
      },
    ],
    // Mídia real: screencast rolando pela home do site publicado (ver
    // scripts/capture-guia-cover.mjs), capturado direto do `demoUrl`.
    cover: {
      kind: "video",
      src: `${basePath}/videos/guia-musica-preview.mp4`,
      poster: `${basePath}/photos/guia-musica-preview.webp`,
      alt: {
        pt: "Home do Guia de Lançamentos 2026, com gráfico de frequência de lançamentos por mês e mapa do Brasil por estado",
        en: "Guia de Lançamentos 2026 home, showing a monthly release frequency chart and a map of Brazil by state",
        es: "Home de Guia de Lançamentos 2026, con gráfico de frecuencia de lanzamientos por mes y mapa de Brasil por estado",
        zh: "Guia de Lançamentos 2026 主页，展示按月发行频率图表和巴西各州地图",
      },
    },
    comingSoon: false,
    repoUrl: "https://github.com/ganwalk/guia2026",
    demoUrl: "https://guiadelancamentos.com.br/",
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return cases.find((c) => c.slug === slug);
}
