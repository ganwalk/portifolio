// A gravura em linha do fundo da hero, como SVG montado em código.
//
// O desenho é o mesmo de `.hero-engraving` em globals.css, e a explicação do
// porquê dele mora lá (e em docs/architecture.md). Aqui existe uma segunda
// cópia porque os dois usos são incompatíveis: no site a gravura entra como
// MÁSCARA, e a cor vem do tema; nas imagens sociais ela entra como imagem
// chapada, com a cor já decidida, porque um PNG não tem tema. Mexeu na forma
// num lugar, tem que mexer no outro.

export function engravingSvg({
  ink,
  opacity,
  width,
  height,
}: {
  /** Cor da linha, já resolvida: o SVG social não tem tema para consultar. */
  ink: string;
  opacity: number;
  width: number;
  height: number;
}): string {
  // O viewBox é o mesmo 1600x1000 do site, com preserveAspectRatio de corte
  // ("slice"), que é o equivalente do `mask-size: cover` de lá: a onda cresce
  // junto com o quadro em vez de manter espessura fixa.
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 1600 1000' preserveAspectRatio='xMidYMid slice'>` +
    `<defs>` +
    `<pattern id='l' width='1600' height='44' patternUnits='userSpaceOnUse'><rect width='1600' height='3.4' fill='${ink}'/></pattern>` +
    `<linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000'/><stop offset='.28' stop-color='#fff'/><stop offset='.78' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>` +
    `<mask id='m'><rect width='1600' height='1000' fill='url(#g)'/></mask>` +
    `<filter id='f' x='-20%' y='-20%' width='140%' height='140%' color-interpolation-filters='sRGB'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='0.0012 0.003' numOctaves='2' seed='3' result='w'/>` +
    `<feDisplacementMap in='SourceGraphic' in2='w' scale='240' xChannelSelector='R' yChannelSelector='G' result='d'/>` +
    `<feColorMatrix in='w' type='matrix' values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 -0.18' result='t'/>` +
    `<feComposite in='d' in2='t' operator='in'/>` +
    `</filter>` +
    `</defs>` +
    `<g mask='url(#m)' opacity='${opacity}'><rect x='-300' y='-300' width='2200' height='1600' fill='url(#l)' filter='url(#f)'/></g>` +
    `</svg>`
  );
}

/** O mesmo SVG como data URI, que é como o gerador de imagem consome. */
export function engravingDataUri(options: Parameters<typeof engravingSvg>[0]): string {
  return `data:image/svg+xml;base64,${Buffer.from(engravingSvg(options)).toString("base64")}`;
}
