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
// site, o jeito é deslocar o CONTEÚDO pra direita dentro do quadro: valor
// estimado, sem como medir o exato sem ver o render de verdade.
//
// Não é mais um transform: translateX no iframe do tamanho do próprio
// quadro (h-full w-full): deslocar esse iframe pra direita abre uma
// lacuna do lado esquerdo do tamanho do deslocamento, e essa lacuna
// expõe o fundo do wrapper (bg-black) como uma tarja sólida, não a
// própria cena (a suposição de que "o fundo escuro do wrapper se
// confunde com o fundo da cena" não se sustentou: a cena não é preta
// sólida nessa borda, então a tarja aparece nítida). Em vez disso, o
// iframe nasce 30% mais largo que o quadro (excedente que sobra dos
// dois lados) e `left` desloca esse excedente: com left mais próximo de
// 0% (em vez do -15% que centralizaria), sobra menos excedente à
// esquerda e mais à direita, deslocando o que se vê pra direita sem
// nunca deixar a borda esquerda do iframe entrar no quadro (a reserva de
// 15% de excedente cobre o deslocamento inteiro, sem lacuna).
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
        className="pointer-events-none absolute transition-opacity duration-300"
        style={{ border: 0, top: 0, left: "-5%", width: "130%", height: "100%", opacity: settled ? 1 : 0 }}
      />
    </div>
  );
}
