import type { Experiment } from "./types";

// basePath não é aplicado a src montado à mão em JS (só a next/image e links
// internos do próprio Next): o mesmo motivo do CONTACT_IMAGE em Contact.tsx.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Bloco compacto "Extras" na home, 3 a 4 experimentos selecionados.
// Mídias placeholder (Pexels e Picsum) até as reais chegarem: colagens
// digitalizadas, gravações de tela dos estudos de movimento e trechos de
// produção no DAW. A troca é substituir o bloco media de cada item.

export const experiments: Experiment[] = [
  {
    id: "colagem-01",
    title: {
      pt: "Colagens e ilustrações digitais",
      en: "Digital collages and illustrations",
      es: "Collages e ilustraciones digitales",
      zh: "数字拼贴与插画",
    },
    medium: {
      pt: "Estampas, quadros & pôsteres",
      en: "Prints, frames & posters",
      es: "Estampados, cuadros & pósters",
      zh: "印花、画框与海报",
    },
    // Vitrine de verdade: oito peças reais (ver pasta ilustras/) em ciclo
    // contínuo (ver ExperimentCard.tsx), não só no hover. `media` fica como
    // a primeira peça da galeria, usada por quem pede menos movimento no
    // sistema (prefers-reduced-motion): mostra ela parada, sem ciclar.
    media: {
      kind: "image",
      src: `${basePath}/photos/ilustra-venturo.webp`,
      alt: {
        pt: "Selo ornamentado 'Venturo do Brasil', com lua e sol ao centro",
        en: "Ornamented 'Venturo do Brasil' seal, with a sun and moon at the center",
        es: "Sello ornamentado 'Venturo do Brasil', con sol y luna al centro",
        zh: "华丽的 Venturo do Brasil 徽章，中央是日月图案",
      },
    },
    gallery: [
      {
        src: `${basePath}/photos/ilustra-venturo.webp`,
        alt: {
          pt: "Selo ornamentado 'Venturo do Brasil', com lua e sol ao centro",
          en: "Ornamented 'Venturo do Brasil' seal, with a sun and moon at the center",
          es: "Sello ornamentado 'Venturo do Brasil', con sol y luna al centro",
          zh: "华丽的 Venturo do Brasil 徽章，中央是日月图案",
        },
        asciiArt: "☆(＾▽＾)☆",
      },
      {
        src: `${basePath}/photos/ilustra-cabeca.webp`,
        alt: {
          pt: "Pôster psicodélico de um rosto sob um halo espiralado colorido",
          en: "Psychedelic poster of a face under a spiraling colorful halo",
          es: "Póster psicodélico de un rostro bajo un halo espiralado de colores",
          zh: "迷幻风格海报，一张脸庞笼罩在旋转的彩色光环下",
        },
        asciiArt: "(⊙▽⊙)",
      },
      {
        src: `${basePath}/photos/ilustra-manuzika.webp`,
        alt: {
          pt: "Colagem de uma garota balançando presa a uma flor vermelha gigante",
          en: "Collage of a girl on a swing hanging from a giant red flower",
          es: "Collage de una chica en un columpio colgado de una flor roja gigante",
          zh: "拼贴画，女孩坐在巨大红花垂下的秋千上",
        },
        asciiArt: "❀ヽ(・∀・)ﾉ❀",
      },
      {
        src: `${basePath}/photos/ilustra-simetria.webp`,
        alt: {
          pt: "Duas figuras espelhadas em rosa e verde sobre fundo preto",
          en: "Two mirrored pink and green figures on a black background",
          es: "Dos figuras espejadas en rosa y verde sobre fondo negro",
          zh: "黑色背景上一对粉绿相对称的镜像图形",
        },
        asciiArt: "(ノ´∀｀)ノ",
      },
      {
        src: `${basePath}/photos/ilustra-auuuuu.webp`,
        alt: {
          pt: "Figura granulada sob um halo de arco-íris em espiral",
          en: "Grainy figure under a spiraling rainbow halo",
          es: "Figura granulada bajo un halo de arcoíris en espiral",
          zh: "颗粒质感的人像，笼罩在螺旋彩虹光环下",
        },
        asciiArt: "☼(°◡°)☼",
      },
      {
        src: `${basePath}/photos/ilustra-flores.webp`,
        alt: {
          pt: "Ilustração botânica emoldurada, com flores e folhas coloridas",
          en: "Framed botanical illustration, with colorful flowers and leaves",
          es: "Ilustración botánica enmarcada, con flores y hojas de colores",
          zh: "装裱的植物插画，色彩缤纷的花朵与叶子",
        },
        asciiArt: "✿(◠‿◠)✿",
      },
      {
        src: `${basePath}/photos/ilustra-irezumi.webp`,
        alt: {
          pt: "Mandala em espiral com uma figura ao centro, sobre fundo marmorizado",
          en: "Spiraling mandala with a figure at the center, over a marbled background",
          es: "Mandala en espiral con una figura al centro, sobre fondo marmolado",
          zh: "螺旋曼陀罗图案，中央有一个人物，背景为大理石纹理",
        },
        asciiArt: "(◉_◉)",
      },
      {
        src: `${basePath}/photos/ilustra-majuju.webp`,
        alt: {
          pt: "Pintura surreal de uma figura numa porta emoldurada por asas de mariposa",
          en: "Surreal painting of a figure in a doorway framed by moth wings",
          es: "Pintura surrealista de una figura en una puerta enmarcada por alas de polilla",
          zh: "超现实画作，一扇被飞蛾翅膀环绕的门中站着一个人影",
        },
        asciiArt: "(づ￣³￣)づ",
      },
    ],
  },
  {
    id: "animacao-01",
    title: {
      pt: "Estudos de movimento",
      en: "Motion studies",
      es: "Estudios de movimiento",
      zh: "动效研究",
    },
    medium: {
      pt: "Animação",
      en: "Animation",
      es: "Animación",
      zh: "动画",
    },
    // "Cagumela": teste de animação de um personagem e cenário autorais.
    // O vídeo é o resultado final, em loop mudo; o hover troca a vitrine
    // pelos stills do processo (ver ExperimentCard.tsx), em ordem: concept
    // art do cenário, depois model sheet do personagem. Sai do hover, volta
    // pro vídeo.
    media: {
      kind: "video",
      src: `${basePath}/videos/cagumela-ceu.mp4`,
      poster: `${basePath}/photos/cagumela-ceu-poster.webp`,
      alt: {
        pt: "Quadro do teste de animação Cagumela, personagem sentado no sofá de um quarto colorido",
        en: "Frame from the Cagumela animation test, character sitting on the couch of a colorful room",
        es: "Cuadro de la prueba de animación Cagumela, personaje sentado en el sofá de un cuarto colorido",
        zh: "Cagumela 动画测试画面，角色坐在色彩斑斓房间的沙发上",
      },
    },
    process: [
      {
        src: `${basePath}/photos/cagumela-quarto.webp`,
        caption: {
          pt: "Concept art do cenário, a cor antes da cena",
          en: "Concept art for the set, the color before the scene",
          es: "Concept art del escenario, el color antes de la escena",
          zh: "场景概念图，先定色再进场景",
        },
      },
      {
        src: `${basePath}/photos/cagumela-modelsheet.webp`,
        caption: {
          pt: "Model sheet do personagem, o traço antes de animar",
          en: "Character model sheet, the linework before animating",
          es: "Model sheet del personaje, el trazo antes de animar",
          zh: "角色设定表，动画前先定好的线稿",
        },
      },
    ],
  },
  {
    id: "som-01",
    title: {
      pt: "Produção musical",
      en: "Music production",
      es: "Producción musical",
      zh: "音乐制作",
    },
    medium: {
      pt: "Áudio",
      en: "Audio",
      es: "Audio",
      zh: "音频",
    },
    // Sugestão de mídia real: vídeo do arranjo no DAW rodando, ou player de
    // áudio com uma faixa autoral.
    media: {
      kind: "video",
      src: "https://videos.pexels.com/video-files/3116506/3116506-hd_1920_1080_25fps.mp4",
      poster:
        "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=800",
      alt: {
        pt: "Vinil tocando em uma vitrola, placeholder da produção musical",
        en: "Vinyl playing on a turntable, music production placeholder",
        es: "Vinilo sonando en un tocadiscos, placeholder de producción musical",
        zh: "唱机上播放的黑胶唱片，音乐制作的占位图片",
      },
    },
  },
];
