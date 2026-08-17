"use client";

import { useEffect, useRef } from "react";
import { cleanupArtistPreview, forwardMouseMove } from "@/lib/artist-preview-cleanup";

// Prévia "ao vivo" de um card: o site publicado de verdade, embutido num
// iframe, direto, sem imagem estática por baixo esperando um gesto pra
// revelar. O iframe é pointer-events-none: a página embutida continua
// rodando e animando por conta própria, mas nunca captura o mouse/toque
// de quem só queria continuar rolando a seção por cima dele. O mousemove
// de verdade É repassado pro gráfico lá dentro (ver forwardMouseMove, no
// wrapper, que recebe o evento de verdade e reenvia pro iframe nas
// coordenadas certas), então quem reage à posição do cursor (Ganwalk,
// Pink Opala) continua reagindo — só o scroll é que nunca é sequestrado.
//
// `soundRequested` tenta destravar o áudio do site embutido (hoje só
// Ganwalk e Dezert Horse têm) no gesto que o disparar (hover no desktop,
// toque no mobile — ver CaseColumn/MobileCaseCard). Ressalva técnica
// importante: a política de autoplay dos navegadores só libera áudio COM
// SOM depois de um gesto confiável recebido pelo PRÓPRIO frame do site
// (clique ou toque de verdade, não hover, e não um clique disparado por
// script, mesmo que sincronizado com um clique de verdade na nossa
// página). Isto aqui é melhor esforço: tenta mesmo assim (às vezes o
// navegador já libera sozinho, se o visitante tiver "engajado" com aquele
// domínio antes), mas não é garantia de som em toda visita.
//
// tabIndex/aria-hidden tiram o iframe da navegação por teclado e leitor
// de tela: é decorativo aqui, o link de verdade pro site mora em
// LiveEmbed, no corpo do case.
export function CardLivePreview({
  demoUrl,
  title,
  slug,
  soundRequested = false,
  className = "",
}: {
  demoUrl: string;
  title: string;
  /** Slug do case: chave de artist-preview-cleanup.ts pros sites que
   *  precisam de ajuste (dispensar tela de carregamento, esconder UI,
   *  repassar mousemove). */
  slug: string;
  /** Tenta (melhor esforço, ver comentário acima) destravar o áudio do
   *  site embutido, quando ele tem. */
  soundRequested?: boolean;
  className?: string;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!soundRequested) return;
    const iframe = iframeRef.current;
    // Reaproveita a mesma limpeza que já roda no onLoad: idempotente (os
    // sites guardam contra dispensar a tela de carregamento duas vezes),
    // só vale a pena tentar de novo aqui porque este gesto está mais perto
    // de um gesto de verdade do visitante do que o onLoad automático.
    if (iframe) cleanupArtistPreview(iframe, slug);
  }, [soundRequested, slug]);

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
        style={{ border: 0 }}
      />
    </div>
  );
}
