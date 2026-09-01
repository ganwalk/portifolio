// Grão do cartão social: o MESMO ruído (feTurbulence) de .texture-noise, o
// grão de filme que cobre o site inteiro hoje (ver globals.css), só que
// gerado direto no tamanho do quadro em vez de ladrilhado por
// background-repeat: um PNG estático não tem propriedade repetível pra
// depender, e um campo de turbulência contínuo, do tamanho do quadro
// inteiro, evita a costura visível que ladrilhar um recorte de 120px
// criaria numa imagem parada.
//
// Substitui a gravura em ondas que o cartão usava antes (engraving.ts,
// removido): aquela era uma peça própria do cartão, sem equivalente no site
// de verdade (chegou a existir no fundo da hero e foi revertida de lá, ver
// histórico). Esta é a textura que o visitante realmente vê.

export function ogNoiseSvg({
  opacity,
  width,
  height,
}: {
  opacity: number;
  width: number;
  height: number;
}): string {
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>` +
    `<filter id='n' color-interpolation-filters='sRGB'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/></filter>` +
    `<rect width='100%' height='100%' opacity='${opacity}' filter='url(#n)'/>` +
    `</svg>`
  );
}

/** O mesmo SVG como data URI, que é como o gerador de imagem consome. */
export function ogNoiseDataUri(options: Parameters<typeof ogNoiseSvg>[0]): string {
  return `data:image/svg+xml;base64,${Buffer.from(ogNoiseSvg(options)).toString("base64")}`;
}
