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
          lines={["PINK", "OPALA"]}
          color="#ffffff"
          background="#000000"
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
