// Cartão compartilhado entre os opengraph-image.tsx da home e dos cases: é o
// que aparece quando alguém cola um link do site numa rede social.
//
// A composição é a hero em 1200x630: papel, o nome/título em Whyte Inktrap
// (o MESMO desenho da assinatura do cabeçalho e do nome na hero de verdade,
// não uma fonte parecida) e as legendas em mono nos cantos. O retrato entra
// só na home; num case ele roubaria o assunto, que é o trabalho.
//
// O nome/título não é texto: é contorno vetorial (SVG path), gerado uma vez
// no build por scripts/build-og-wordmarks.mjs e importado pronto daqui (ver
// src/lib/og/wordmarks.ts). A Whyte é licenciada (ABC Dinamo), e contornar
// palavras específicas pra virar arte fixa é o uso normal de um logotipo,
// diferente de embarcar a fonte inteira só pra gerar cartões sociais (mesmo
// critério do favicon, ver build-favicon.mjs). Título fora da lista fixa de
// wordmarks (hoje só a versão em chinês do case de Landing Pages, sem
// cobertura nenhuma na Whyte de qualquer forma) cai em texto normal, na
// fonte de reserva do próprio gerador.
//
// IBM Plex Mono, a fonte das legendas (rótulo e rodapé), é OFL: essa sim
// entra como fonte de verdade (ver loadOgAssets), o mesmo critério que já
// valia antes pra ela.
//
// O fundo era uma gravura em ondas (engraving.ts, removido): uma peça
// própria do cartão, sem equivalente no site de verdade (chegou a existir
// no fundo da hero e foi revertida de lá, competindo com o nome em
// movimento). Virou o grão de filme que o site usa hoje de verdade
// (.texture-noise em globals.css, ver og-noise.ts), a textura que quem
// visita o site realmente vê.

// As duas regras abaixo valem para HTML, e isto não vira HTML: o JSX daqui é
// lido pelo satori, que o transforma em PNG. next/image não existe nesse
// caminho (nem faria sentido: a imagem já é o produto final, e o export é
// estático), e alt não tem onde pousar, porque um PNG não tem árvore de
// acessibilidade. O texto alternativo do cartão vive no `alt` exportado por
// cada rota de opengraph-image, que é o que vira a meta tag.
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ogNoiseDataUri } from "@/lib/og-noise";
import { ogWordmarks } from "@/lib/og/wordmarks";

export const ogSize = { width: 1200, height: 630 } as const;
export const ogContentType = "image/png";

const PAPER = "#ffffff";
const INK = "#0b0b0b";
const MUTED = "#6d6d6d";

const PAD = 72;
// Proporção do quadro do retrato, a mesma da folha de sprite da hero.
const PORTRAIT_WIDTH = 430;
const PORTRAIT_HEIGHT = Math.round(PORTRAIT_WIDTH * (9 / 8));

/** Fontes e retrato, lidos do disco no build. */
export async function loadOgAssets() {
  const [mono, portrait] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/og/ibm-plex-mono-400.woff")),
    readFile(join(process.cwd(), "src/lib/og/retrato.png")),
  ]);

  return {
    portrait: `data:image/png;base64,${portrait.toString("base64")}`,
    fonts: [
      { name: "IBM Plex Mono", data: mono, weight: 400 as const, style: "normal" as const },
    ],
  };
}

const legend = {
  fontFamily: "IBM Plex Mono",
  fontSize: 24,
  letterSpacing: 2,
  textTransform: "uppercase" as const,
  color: MUTED,
};

// Vão entre linhas empilhadas do título: fração da própria altura de cada
// linha, não um valor fixo, pra continuar proporcional se o título precisar
// encolher pra caber (ver fitLines abaixo).
const WORDMARK_LINE_GAP = 0.16;

/**
 * Encaixa as linhas de um título vetorial (uma palavra por linha, mesmo
 * desenho do nome na hero de verdade, ver Hero.tsx) dentro de `maxWidth`,
 * partindo de `preferredHeight` por linha e encolhendo tudo junto (mesma
 * escala em todas as linhas) só o necessário pra a palavra mais larga caber.
 */
function fitWordmarkLines(words: (typeof ogWordmarks)[string], maxWidth: number, preferredHeight: number) {
  const widthAt = (h: number, w: (typeof words)[number]) => h * (w.width / w.height);
  const widestAtPreferred = Math.max(...words.map((w) => widthAt(preferredHeight, w)));
  const scale = widestAtPreferred > maxWidth ? maxWidth / widestAtPreferred : 1;
  const height = preferredHeight * scale;
  return words.map((w) => ({ ...w, renderWidth: widthAt(height, w), renderHeight: height }));
}

/** Título em Whyte Inktrap, como contorno vetorial: ver comentário no topo do arquivo. */
function Wordmark({
  title,
  maxWidth,
  preferredHeight,
}: {
  title: string;
  maxWidth: number;
  preferredHeight: number;
}) {
  const words = ogWordmarks[title as keyof typeof ogWordmarks];

  // Fora da lista fixa (ver build-og-wordmarks.mjs): texto normal, na fonte
  // de reserva do próprio gerador. É o caso hoje só do case de Landing
  // Pages em chinês ("落地页"), sem glifo nenhum na Whyte de qualquer jeito.
  if (!words) {
    return (
      <div
        style={{
          display: "flex",
          fontSize: preferredHeight,
          lineHeight: 1,
          color: INK,
          maxWidth,
        }}
      >
        {title}
      </div>
    );
  }

  const lines = fitWordmarkLines(words, maxWidth, preferredHeight);
  const gap = lines[0].renderHeight * WORDMARK_LINE_GAP;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((line, i) => {
        // satori não reamostra viewBox contra width/height diferentes: a
        // escala precisa estar NO PRÓPRIO path, não delegada ao viewBox,
        // mesma técnica de build-favicon.mjs. scale leva a caixa real da
        // palavra (line.x/y/width/height, em unidades de fonte) pro tamanho
        // final em pixel (renderWidth/renderHeight). Cada LETRA é o próprio
        // path, gerado no próprio x=0 (ver build-og-wordmarks.mjs: alguns
        // glifos desta fonte saem com coordenada NaN quando o opentype.js já
        // constrói o contorno deslocado), então a posição de cada uma dentro
        // da palavra (line.x global menos o x individual do glifo) entra
        // aqui, junto com a escala, no transform de cada path.
        const scale = line.renderHeight / line.height;
        return (
          <svg
            key={line.word}
            width={line.renderWidth}
            height={line.renderHeight}
            style={{ marginTop: i === 0 ? 0 : gap }}
          >
            {line.glyphs.map((glyph, gi) => (
              <path
                key={gi}
                d={glyph.d}
                fill={INK}
                transform={`scale(${scale}) translate(${glyph.x - line.x} ${-line.y})`}
              />
            ))}
          </svg>
        );
      })}
    </div>
  );
}

export function OgCard({
  eyebrow,
  title,
  footer,
  portrait,
}: {
  eyebrow: string;
  title: string;
  footer: string;
  /** Data URI do retrato. Sem ele o cartão é só tipografia, como nos cases. */
  portrait?: string;
}) {
  // Com o retrato ao lado, o título para antes dele. Sem retrato, usa o
  // quadro inteiro. Mesma lógica de antes, só que agora também decide a
  // altura de PARTIDA de cada linha do título vetorial (fitWordmarkLines
  // encolhe a partir daqui só se a palavra mais larga não couber).
  const titleMaxWidth = portrait ? ogSize.width - PORTRAIT_WIDTH - PAD * 2 : ogSize.width - PAD * 2;
  const titlePreferredHeight = portrait ? 88 : 112;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: PAPER,
        color: INK,
      }}
    >
      <img
        width={ogSize.width}
        height={ogSize.height}
        src={ogNoiseDataUri({
          // Mais presente que no site (0.1 na hero): aqui a imagem é vista
          // pequena, dentro do feed, quase sempre depois de uma
          // recompressão, mesmo raciocínio que já valia pra gravura antes
          // dela (ver comentário no topo do arquivo).
          opacity: 0.16,
          width: ogSize.width,
          height: ogSize.height,
        })}
        style={{ position: "absolute", top: 0, left: 0 }}
      />

      {portrait && (
        <img
          src={portrait}
          width={PORTRAIT_WIDTH}
          height={PORTRAIT_HEIGHT}
          style={{
            position: "absolute",
            right: PAD - 16,
            top: (ogSize.height - PORTRAIT_HEIGHT) / 2,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: PAD,
        }}
      >
        <div style={legend}>{eyebrow}</div>

        <Wordmark title={title} maxWidth={titleMaxWidth} preferredHeight={titlePreferredHeight} />

        <div style={legend}>{footer}</div>
      </div>
    </div>
  );
}
