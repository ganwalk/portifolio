"use client";

import { useRef } from "react";
import { cleanupArtistPreview, forwardMouseMove } from "@/lib/artist-preview-cleanup";

// Ajuste fino de enquadramento: a cena do Dezert Horse foi composta pro
// aspecto de uma janela de navegador comum, não pra coluna estreita e alta
// que o card do trio de artistas força (ver CaseColumn em CasesGrid.tsx).
// Nessa proporção mais vertical, a câmera do site (Three.js, com um
// pequeno deslocamento de foco fixo no world space) deixa o cavalo puxado
// pra esquerda do quadro. Sem acesso pra recompor a câmera de dentro do
// site, o jeito é deslocar o iframe inteiro pra direita por cima do
// fundo escuro da própria cena (a lacuna que abre na borda esquerda some
// nele, ver bg-black no wrapper): puramente estimado, sem como medir o
// valor exato sem ver o render de verdade.
const RECENTER_TRANSLATE: Record<string, string> = {
  "dezert-horse": "translateX(6%)",
};

// Prévia "ao vivo" de um card: o site publicado de verdade, embutido num
// iframe, direto, sem imagem estática por baixo esperando um gesto pra
// revelar. O iframe é pointer-events-none: a página embutida continua
// rodando e animando por conta própria, mas nunca captura o mouse/toque
// de quem só queria continuar rolando a seção por cima dele. O mousemove
// de verdade É repassado pro gráfico lá dentro (ver forwardMouseMove, no
// wrapper, que recebe o evento de verdade e reenvia pro iframe nas
// coordenadas certas) só pros cases com essa reação configurada em
// artist-preview-cleanup.ts (hoje só Pink Opala) — nos demais o repasse
// não tem efeito nenhum, o site simplesmente não escuta.
//
// Sem tentativa de som aqui: o áudio dos sites (Ganwalk, Dezert Horse)
// só toca quando o case é aberto de verdade (ExpandedCase/CaseDetail, via
// LiveEmbed), onde o visitante clica no próprio botão de "iniciar" do
// site com um gesto de verdade — a única forma que a política de
// autoplay dos navegadores realmente libera áudio com som. Um gesto no
// CARTÃO (hover, toque) nunca chega a ser um gesto DENTRO do iframe
// (pointer-events-none de propósito), então tentar destravar som aqui só
// dava falsa expectativa sem entregar áudio de verdade.
//
// tabIndex/aria-hidden tiram o iframe da navegação por teclado e leitor
// de tela: é decorativo aqui, o link de verdade pro site mora em
// LiveEmbed, no corpo do case.
export function CardLivePreview({
  demoUrl,
  title,
  slug,
  className = "",
}: {
  demoUrl: string;
  title: string;
  /** Slug do case: chave de artist-preview-cleanup.ts pros sites que
   *  precisam de ajuste (dispensar tela de carregamento, esconder UI,
   *  repassar mousemove). */
  slug: string;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const rect = iframe.getBoundingClientRect();
    forwardMouseMove(iframe, slug, event.clientX - rect.left, event.clientY - rect.top);
  }

  return (
    <div className={`relative overflow-hidden bg-black ${className}`} onMouseMove={handleMouseMove}>
      <iframe
        ref={iframeRef}
        src={demoUrl}
        title={title}
        tabIndex={-1}
        aria-hidden
        loading="lazy"
        onLoad={(event) => cleanupArtistPreview(event.currentTarget, slug)}
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ border: 0, transform: RECENTER_TRANSLATE[slug] }}
      />
    </div>
  );
}
