"use client";

import { useState } from "react";
import { usePageLoadingRegistration } from "@/contexts/PageLoadingContext";
import { cleanupDezertHorsePreview } from "@/lib/dezert-horse-cleanup";

// Prévia ao vivo do Dezert Horse: o cenário 3D de verdade (Three.js, o
// cavalo correndo no deserto), embutido direto do site publicado, não uma
// reconstrução — pedido explícito depois da silhueta desenhada não bater
// com o programa original. allow="autoplay 'none'" desliga a PERMISSÃO de
// autoplay do iframe, mas não é o silêncio de verdade: o áudio real é
// cortado dentro do próprio documento do site (ver silenceAudio em
// dezert-horse-cleanup.ts), porque o host do autoplay (ganwalk.github.io,
// o mesmo do portfólio) libera som sem gesto nenhum pela própria Media
// Engagement Index, contornando a permissão do iframe. pointer-events-none
// impede o iframe de roubar o scroll da seção; a versão interativa de
// verdade, com som e controles, continua um clique de distância
// (LiveEmbed, no corpo do case).
//
// O iframe nasce com opacity 0 e só aparece quando a limpeza termina
// (settled, abaixo): sem isso, a tela de carregamento própria do site
// (antes do clique sintético no botão de início) pisca por uma fração de
// segundo antes de sumir, visível justamente pelo tempo que a limpeza leva
// pra rodar depois do evento `load` do iframe.
//
// Enquanto `settled` for `false`, esta prévia também mantém a PRÓPRIA tela
// de entrada do portfólio aberta (usePageLoadingRegistration, ver
// PageLoadingContext.tsx): a entrada do site só se dá como completa quando
// todas as telas de carregamento da página, esta incluída, tiverem
// terminado, não só quando as fontes carregarem.
//
// Ajuste fino de enquadramento: a cena foi composta pro aspecto de uma
// janela de navegador comum, não pra coluna estreita e alta que o card do
// trio de artistas força. Nessa proporção mais vertical, a câmera (com um
// pequeno deslocamento de foco fixo no world space) deixa o cavalo puxado
// pra esquerda do quadro. Sem acesso pra recompor a câmera de dentro do
// site, o jeito é deslocar o iframe inteiro pra direita por cima do fundo
// escuro da própria cena (a lacuna que abre na borda esquerda some nele,
// ver bg-black no wrapper): estimado, sem como medir o valor exato sem
// ver o render de verdade.
export function DezertHorseLive({ demoUrl, title, className = "" }: { demoUrl: string; title: string; className?: string }) {
  const [settled, setSettled] = useState(false);
  usePageLoadingRegistration(!settled);

  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <iframe
        src={demoUrl}
        title={title}
        tabIndex={-1}
        aria-hidden
        loading="lazy"
        allow="autoplay 'none'"
        onLoad={(event) => cleanupDezertHorsePreview(event.currentTarget, () => setSettled(true))}
        className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300"
        style={{ border: 0, transform: "translateX(6%)", opacity: settled ? 1 : 0 }}
      />
    </div>
  );
}
