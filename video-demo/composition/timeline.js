// Linha do tempo da peça, compartilhada entre a composição (navegador) e a
// trilha sonora (scripts/soundtrack.mjs): os cortes do som caem exatamente
// nos cortes da imagem porque os dois leem daqui.

export const FPS = 30;

// Batida de 120 BPM (0,5s): todo corte cai numa batida inteira.
export const BEAT = 0.5;

export const SCENES = [
  { id: "intro", start: 0, end: 3.5 },
  { id: "hero", start: 3.5, end: 10 },
  { id: "chapter", start: 10, end: 12.5 },
  { id: "ascii", start: 12.5, end: 17.5 },
  { id: "desert", start: 17.5, end: 23.5 },
  { id: "particles", start: 23.5, end: 29 },
  { id: "system", start: 29, end: 35 },
  { id: "landing", start: 35, end: 41 },
  { id: "extras", start: 41, end: 47 },
  { id: "brands", start: 47, end: 50 },
  { id: "contact", start: 50, end: 60 },
];

export const DURATION = SCENES[SCENES.length - 1].end;

// Transição em cada fronteira entre cenas: "dither" dissolve uma cena na
// outra pelo mesmo retículo de Bayer dos cartões do site; "curtain" é a
// cortina de faixas verticais que o site usa na troca de página
// (StripeCurtain.tsx). `color` é a cor das faixas.
export const TRANSITIONS = [
  { at: 3.5, kind: "dither", from: 3.05, to: 4.0 },
  { at: 10, kind: "curtain", color: "#111111" },
  { at: 12.5, kind: "dither", from: 12.25, to: 12.7 },
  { at: 17.5, kind: "curtain", color: "#000000" },
  { at: 23.5, kind: "dither", from: 23.2, to: 23.75 },
  { at: 29, kind: "curtain", color: "#000000" },
  { at: 35, kind: "dither", from: 34.7, to: 35.25 },
  { at: 41, kind: "curtain", color: "#fafafa" },
  { at: 47, kind: "dither", from: 46.75, to: 47.25 },
  { at: 50, kind: "curtain", color: "#111111" },
];

// Cortina: 8 faixas, cada uma leva STRIPE segundos, com STAGGER de atraso
// entre vizinhas. Mesmas proporções do site, um pouco mais lentas pra ler
// em vídeo.
export const CURTAIN = { stripes: 8, stripe: 0.3, stagger: 0.035, hold: 0.08 };
export const CURTAIN_COVER = CURTAIN.stripe + (CURTAIN.stripes - 1) * CURTAIN.stagger;

// Momentos pontuais que o som acompanha (além dos cortes).
export const HITS = {
  typing: [
    { from: 0.35, to: 1.25 },
    { from: 1.55, to: 2.55 },
    { from: 10.55, to: 11.5 },
  ],
  click: [9.35, 58.05],
  counters: [
    { from: 31.2, to: 32.6 },
    { from: 37.2, to: 38.6 },
  ],
};
