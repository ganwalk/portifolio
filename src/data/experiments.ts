import type { Experiment } from "./types";

// Bloco compacto "Extras" na home, 3 a 4 experimentos selecionados.
// Mídias placeholder (Pexels e Picsum) até as reais chegarem: colagens
// digitalizadas, gravações de tela dos estudos de movimento e trechos de
// produção no DAW. A troca é substituir o bloco media de cada item.

export const experiments: Experiment[] = [
  {
    id: "colagem-01",
    title: {
      pt: "Colagens digitais",
      en: "Digital collages",
      es: "Collages digitales",
      zh: "数字拼贴",
    },
    medium: {
      pt: "Ilustração & colagem",
      en: "Illustration & collage",
      es: "Ilustración & collage",
      zh: "插画与拼贴",
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
    // Sugestão de mídia real: loop curto de um estudo de animação (2 a 6s),
    // exportado em mp4 mudo.
    media: {
      kind: "image",
      src: "https://picsum.photos/seed/movimento-armando/1200/1200",
      alt: {
        pt: "Fotografia placeholder para os estudos de movimento",
        en: "Placeholder photograph for the motion studies",
        es: "Fotografía placeholder para los estudios de movimiento",
        zh: "动效研究的占位图片",
      },
    },
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
