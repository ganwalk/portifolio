// Linha do tempo da peça, compartilhada entre a composição (navegador) e a
// trilha sonora (scripts/soundtrack.mjs): os cortes do som caem exatamente
// nos cortes da imagem porque os dois leem daqui.

export const FPS = 30;

// Batida de 120 BPM (0,5s): todo corte cai numa batida inteira.
export const BEAT = 0.5;

export const SCENES = [
  { id: "intro", start: 0, end: 3.5 },
  { id: "hero", start: 3.5, end: 10 },
  { id: "chapter", start: 10, end: 14.5 },
  { id: "ascii", start: 14.5, end: 19.5 },
  { id: "desert", start: 19.5, end: 25.5 },
  { id: "particles", start: 25.5, end: 31 },
  { id: "system", start: 31, end: 37 },
  { id: "landing", start: 37, end: 43 },
  { id: "extras", start: 43, end: 49 },
  { id: "brands", start: 49, end: 53 },
  { id: "contact", start: 53, end: 62 },
];

export const DURATION = SCENES[SCENES.length - 1].end;

// Transição em cada fronteira entre cenas: "dither" dissolve uma cena na
// outra pelo mesmo retículo de Bayer dos cartões do site; "curtain" é a
// cortina de faixas verticais que o site usa na troca de página
// (StripeCurtain.tsx). `color` é a cor das faixas.
export const TRANSITIONS = [
  { at: 3.5, kind: "dither", from: 3.05, to: 4.0 },
  { at: 10, kind: "curtain", color: "#111111" },
  { at: 14.5, kind: "dither", from: 14.25, to: 14.7 },
  { at: 19.5, kind: "curtain", color: "#000000" },
  { at: 25.5, kind: "dither", from: 25.2, to: 25.75 },
  { at: 31, kind: "curtain", color: "#000000" },
  { at: 37, kind: "dither", from: 36.7, to: 37.25 },
  { at: 43, kind: "curtain", color: "#fafafa" },
  { at: 49, kind: "dither", from: 48.75, to: 49.25 },
  { at: 53, kind: "curtain", color: "#111111" },
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
    { from: 10.8, to: 13.0 },
  ],
  // Hero: clique no CTA. Marcas: clique no "SUA MARCA".
  click: [9.35, 52.05],
  counters: [
    { from: 33.2, to: 34.6 },
    { from: 39.2, to: 40.6 },
  ],
};
