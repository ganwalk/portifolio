// Cartão compartilhado entre os opengraph-image.tsx da home e dos cases: é o
// que aparece quando alguém cola um link do site numa rede social.
//
// A composição é a hero em 1200x630: papel, a gravura em linha no fundo, o
// nome em caixa alta ocupando o quadro e as legendas em mono nos cantos. O
// retrato entra só na home; num case ele roubaria o assunto, que é o trabalho.
//
// Fonte não é detalhe aqui. O gerador (satori, por baixo do ImageResponse)
// cai numa fonte genérica quando não recebe nenhuma, e era isso que o cartão
// vinha mostrando: um nome em Helvetica, sem relação com o site. As duas que
// entram são as do site, carregadas em woff porque satori não lê woff2 (ver
// scripts/build-og-assets.mjs). A Whyte Inktrap do nome na hero fica de fora:
// é licenciada, e levar a fonte inteira para dentro do build por causa de um
// cartão não se justifica. Bricolage Grotesque é a display do resto do site
// (`.type-display`), então o cartão continua falando a mesma língua.

// As duas regras abaixo valem para HTML, e isto não vira HTML: o JSX daqui é
// lido pelo satori, que o transforma em PNG. next/image não existe nesse
// caminho (nem faria sentido: a imagem já é o produto final, e o export é
// estático), e alt não tem onde pousar, porque um PNG não tem árvore de
// acessibilidade. O texto alternativo do cartão vive no `alt` exportado por
// cada rota de opengraph-image, que é o que vira a meta tag.
/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { engravingDataUri } from "@/lib/engraving";

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
  const [display, mono, portrait] = await Promise.all([
    readFile(join(process.cwd(), "src/fonts/og/bricolage-grotesque-800.woff")),
    readFile(join(process.cwd(), "src/fonts/og/ibm-plex-mono-400.woff")),
    readFile(join(process.cwd(), "src/lib/og/retrato.png")),
  ]);

  return {
    portrait: `data:image/png;base64,${portrait.toString("base64")}`,
    // A ordem importa: satori percorre a lista atrás de quem tem o glifo, e
    // devolve para a fonte seguinte o que a primeira não cobre. As duas aqui
    // são subconjunto latino, então título em chinês (o site tem locale zh)
    // não é coberto por nenhuma e cai no mecanismo de reserva do próprio
    // ImageResponse, que era quem já resolvia isso antes destas fontes
    // existirem.
    fonts: [
      { name: "Bricolage Grotesque", data: display, weight: 800 as const, style: "normal" as const },
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
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: PAPER,
        color: INK,
        fontFamily: "Bricolage Grotesque",
      }}
    >
      {/* A gravura entra como <img>, e não como background-image: satori
          resolve background com um raster próprio que ignora filtro de SVG, e
          é filtro (feTurbulence somado a feDisplacementMap) que faz a onda. */}
      <img
        width={ogSize.width}
        height={ogSize.height}
        src={engravingDataUri({
          ink: INK,
          // Mais presente que no site (0.28): aqui a imagem é vista pequena,
          // dentro do feed, quase sempre depois de uma recompressão. Na
          // opacidade do site a trama simplesmente sumiria.
          opacity: 0.4,
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

        <div
          style={{
            display: "flex",
            // Sem o retrato ao lado sobra metade do quadro, e o título fica
            // pequeno demais para o vazio que deixa: cresce para ocupá-lo.
            fontSize: portrait ? 104 : 128,
            lineHeight: 0.92,
            letterSpacing: -1,
            textTransform: "uppercase",
            // Com o retrato ao lado, o texto para antes dele. Sem retrato,
            // usa o quadro inteiro e o título quebra onde quiser.
            maxWidth: portrait
              ? ogSize.width - PORTRAIT_WIDTH - PAD * 2
              : ogSize.width - PAD * 2,
          }}
        >
          {title}
        </div>

        <div style={legend}>{footer}</div>
      </div>
    </div>
  );
}
