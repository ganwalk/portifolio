"use client";

import { DezertHorseLive } from "./DezertHorseLive";
import { GanwalkAsciiVideo } from "./GanwalkAsciiVideo";
import { ParticleTextCanvas } from "./ParticleTextCanvas";

// Prévia dos três projetos de artista, no card do trio (ver
// CasesGrid.tsx). Não é um tratamento único pros três: cada projeto pediu
// o que fazia sentido pra ele depois de rodadas de ajuste.
//
// Ganwalk: reconstrução local do efeito de verdade da Experiência II
// (vídeo virando arte de partículas com as letras de "ganwalk", ver
// GanwalkAsciiVideo.tsx), leve o bastante pra não custar um contexto de
// WebGL só pra prévia. Pink Opala: o letreiro em partículas reagindo ao
// mouse de verdade, reconstruído local (ParticleTextCanvas.tsx). Dezert
// Horse: o cenário 3D de verdade embutido ao vivo (DezertHorseLive.tsx),
// não uma reconstrução — pedido explícito depois de uma silhueta
// desenhada não bater com o cavalo do programa original.
/**
 * Slugs com prévia bespoke própria (ver switch abaixo). Fonte única pra
 * quem precisa decidir ENTRE renderizar `ArtistPreview` ou cair pra
 * `MediaView`/`cover` (ver CasesGrid.tsx): checar isso, e não a presença de
 * `demoUrl`, porque outros cases (ex.: a Intranet) também têm site
 * publicado e demoUrl próprio sem ganhar uma reconstrução bespoke aqui.
 */
export const ARTIST_PREVIEW_SLUGS = new Set(["ganwalk", "pink-opala", "dezert-horse"]);

// Referência estável: um array literal escrito direto no JSX (`lines={["PINK",
// "OPALA"]}`) nasce de novo a cada render de ArtistPreview, e como `lines`
// entra na dependência do `useEffect` de ParticleTextCanvas, uma referência
// nova ali reinicia o efeito inteiro (limpa e reconstrói as partículas do
// zero) mesmo com o mesmo conteúdo. ArtistPreview re-renderiza a cada troca
// de `isHovered` (repassado por CaseColumn), então sem essa constante todo
// hover na prévia do Pink Opala reconstruía o canvas à toa, lido como uma
// piscada preta.
const PINK_OPALA_LINES = ["PINK", "OPALA"];

export function ArtistPreview({
  slug,
  demoUrl,
  title,
  className = "",
}: {
  slug: string;
  demoUrl: string;
  title: string;
  className?: string;
}) {
  switch (slug) {
    case "ganwalk":
      return <GanwalkAsciiVideo className={className} />;
    case "pink-opala":
      return (
        <ParticleTextCanvas
          lines={PINK_OPALA_LINES}
          color="#ffffff"
          background="#000000"
          // Mesmo rosa do site real (--neon-pink em ganwalk/pinkopala,
          // index.htm): as partículas perturbadas mudam de cor de verdade,
          // não só de posição, ver ParticleTextCanvas.tsx.
          highlightColor="#ff00aa"
          interactive
          className={className}
        />
      );
    case "dezert-horse":
      return <DezertHorseLive demoUrl={demoUrl} title={title} className={className} />;
    default:
      return null;
  }
}
