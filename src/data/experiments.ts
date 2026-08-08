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
    // Sugestão de mídia real: uma colagem finalizada em alta, ou um carrossel
    // de recortes escaneados.
    media: {
      kind: "image",
      src: "https://picsum.photos/seed/colagem-armando/1200/1200",
      alt: {
        pt: "Fotografia placeholder para a série de colagens",
        en: "Placeholder photograph for the collage series",
        es: "Fotografía placeholder para la serie de collages",
        zh: "拼贴系列的占位图片",
      },
    },
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
