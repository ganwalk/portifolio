"use client";

import { cleanupDezertHorsePreview } from "@/lib/dezert-horse-cleanup";

// Prévia ao vivo do Dezert Horse: o cenário 3D de verdade (Three.js, o
// cavalo correndo no deserto), embutido direto do site publicado, não uma
// reconstrução — pedido explícito depois da silhueta desenhada não bater
// com o programa original. allow="autoplay 'none'" desliga qualquer
// áudio (o portfólio e o site moram no mesmo host, ganwalk.github.io, e o
// navegador libera autoplay com som por esse "engajamento" compartilhado
// sem isso, mesmo sem gesto nenhum aqui dentro). pointer-events-none
// impede o iframe de roubar o scroll da seção; a versão interativa de
// verdade, com som e controles, continua um clique de distância
// (LiveEmbed, no corpo do case).
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
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <iframe
        src={demoUrl}
        title={title}
        tabIndex={-1}
        aria-hidden
        loading="lazy"
        allow="autoplay 'none'"
        onLoad={(event) => cleanupDezertHorsePreview(event.currentTarget)}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ border: 0, transform: "translateX(6%)" }}
      />
    </div>
  );
}
