// Geometria da lua compartilhada entre o seletor de tema (MoonPhase.tsx, fase
// regida pelo scroll) e os 5 ícones da tela de entrada (SiteLoader.tsx, fase
// regida pelo progresso de carregamento): mesmo desenho, dois motores de
// animação diferentes por trás.

export const MOON_R = 9;
export const MOON_CENTER = 10;

// f em [0,1): 0 é lua nova, 0.5 cheia, 1 nova de novo. A parte iluminada é a
// interseção entre o semicírculo do lado aceso e a elipse do terminador.
export function moonPath(f: number): string {
  const k = Math.cos(2 * Math.PI * f);
  const rx = Math.abs(k) * MOON_R;
  const waxing = f < 0.5;
  const side = waxing ? 1 : 0;
  const bulge = waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0;
  const top = MOON_CENTER - MOON_R;
  const bottom = MOON_CENTER + MOON_R;
  return [
    `M ${MOON_CENTER} ${top}`,
    `A ${MOON_R} ${MOON_R} 0 0 ${side} ${MOON_CENTER} ${bottom}`,
    `A ${rx} ${MOON_R} 0 0 ${bulge} ${MOON_CENTER} ${top}`,
    "Z",
  ].join(" ");
}
