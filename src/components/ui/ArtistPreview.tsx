"use client";

import { DezertHorseScene } from "./DezertHorseScene";
import { GanwalkAsciiVideo } from "./GanwalkAsciiVideo";
import { ParticleTextCanvas } from "./ParticleTextCanvas";

// Prévia local e leve dos três projetos de artista, no card do trio (ver
// CasesGrid.tsx): no lugar de embutir o site publicado de verdade num
// iframe sempre montado (três contextos de WebGL/Three.js/áudio ao mesmo
// tempo, só pra uma prévia, pesado demais), uma reconstrução do elemento
// mais reconhecível de cada projeto, em Canvas 2D, vivendo neste
// repositório. A versão completa, com todos os efeitos de verdade,
// continua um clique de distância (LiveEmbed, no corpo do case).
//
// Ganwalk: o efeito de verdade da Experiência II (vídeo virando arte de
// partículas com as letras de "ganwalk", ver GanwalkAsciiVideo.tsx), não
// um texto solto inventado. Pink Opala: o letreiro em partículas reagindo
// ao mouse de verdade, igual ao site original. Dezert Horse: o cavalo
// galopando no deserto, o elemento que não podia faltar.
export function ArtistPreview({ slug, className = "" }: { slug: string; className?: string }) {
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
      return <DezertHorseScene className={className} />;
    default:
      return null;
  }
}
