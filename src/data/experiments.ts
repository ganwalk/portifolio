import type { Experiment } from "./types";

// Bloco compacto "Fora do expediente" na home, 3 a 4 experimentos selecionados.
// Placeholders até as mídias reais (colagens, animações, áudio) serem fornecidas.

export const experiments: Experiment[] = [
  {
    id: "colagem-01",
    title: {
      pt: "Colagens digitais",
      en: "Digital collages",
      es: "Collages digitales",
    },
    medium: {
      pt: "Ilustração & colagem",
      en: "Illustration & collage",
      es: "Ilustración & collage",
    },
  },
  {
    id: "animacao-01",
    title: {
      pt: "Estudos de movimento",
      en: "Motion studies",
      es: "Estudios de movimiento",
    },
    medium: {
      pt: "Animação",
      en: "Animation",
      es: "Animación",
    },
  },
  {
    id: "som-01",
    title: {
      pt: "Produção musical",
      en: "Music production",
      es: "Producción musical",
    },
    medium: {
      pt: "Áudio",
      en: "Audio",
      es: "Audio",
    },
  },
];
