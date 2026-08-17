"use client";

import { DuneDrift } from "./DuneDrift";
import { ParticleTextCanvas } from "./ParticleTextCanvas";

// Prévia local e leve dos três projetos de artista, no card do trio (ver
// CasesGrid.tsx): no lugar de embutir o site publicado de verdade num
// iframe sempre montado (três contextos de WebGL/Three.js/áudio ao mesmo
// tempo, só pra uma prévia, pesado demais), uma reconstrução simplificada
// de cada identidade visual, em Canvas 2D, vivendo neste repositório. A
// versão completa, com todos os efeitos de verdade, continua um clique de
// distância (LiveEmbed, no corpo do case).
//
// Cores e texto batem com a identidade real de cada site: âmbar sobre
// preto do Ganwalk (mesmo tom da Experiência II, ver goToExperience2 no
// código-fonte publicado), branco sobre preto do Pink Opala (tema escuro
// padrão do site real, --neon-pink como acento vive só no case de
// verdade). Ganwalk e Pink Opala reagem ao hover de propósito: os dois
// sites reais são "toque nas partículas"; Dezert Horse fica parado (a
// câmera do site real também não reage ao cursor, só anima sozinha).
export function ArtistPreview({ slug, className = "" }: { slug: string; className?: string }) {
  switch (slug) {
    case "ganwalk":
      return (
        <ParticleTextCanvas
          lines={["GANWALK", "GANWALK", "GANWALK"]}
          color="#ffc800"
          background="#000000"
          interactive
          className={className}
        />
      );
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
      return <DuneDrift className={className} />;
    default:
      return null;
  }
}
