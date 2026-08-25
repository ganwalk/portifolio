"use client";

import { forwardRef } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Media } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Renderizador único de mídia: decide entre <video> e <img> a partir dos dados.
// Vídeos são mudos, em loop e com poster, comportamento de textura viva, não
// de player. Usamos <img> puro em vez de next/image porque o export estático
// não otimiza imagem no servidor e as URLs remotas mudam junto com as mídias.
//
// forwardRef pro elemento <video>: só o ExperimentCard usa (ver
// useBayerDither.ts), pra desenhar o quadro atual do vídeo de verdade num
// canvas de dither, sem precisar de um segundo <video> tocando em paralelo
// só pra isso. Sem uso na variante <img>: nenhum consumidor precisa dela
// ainda.

export const MediaView = forwardRef<HTMLVideoElement, {
  media: Media;
  locale: Locale;
  className?: string;
  /**
   * Força a variante vertical (srcMobile/posterMobile) mesmo em tela larga:
   * usado pelo cartão compacto do carrossel de desktop (CaseColumn em
   * CasesGrid), que é uma coluna estreita e alta mesmo com a janela
   * inteira sendo grande (o trio de artistas divide a largura em três).
   * Sem isso, o vídeo horizontal ficava espremido numa faixa vertical ali.
   * A versão expandida (ExpandedCase) e a página própria do case
   * (CaseDetail) continuam decidindo só pela largura real da tela: as duas
   * ocupam a tela inteira, então a horizontal cabe bem a partir do mesmo
   * breakpoint de sempre.
   */
  preferMobile?: boolean;
}>(function MediaView({ media, locale, className = "", preferMobile = false }, ref) {
  // Mesmo breakpoint que decide a versão mobile/desktop de CasesGrid (ver
  // useMediaQuery("(min-width: 640px)") lá): abaixo dele, troca pela
  // variante vertical (srcMobile/posterMobile), quando existe, em vez de
  // espremer um vídeo horizontal numa tela de pé.
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const useMobileVariant = preferMobile || !isDesktop;
  const src = (useMobileVariant && media.srcMobile) || media.src;
  const poster = (useMobileVariant && media.posterMobile) || media.poster;
  const objectPosition = media.objectPosition ?? "center";

  if (media.kind === "video") {
    // O poster também vive como camada de fundo: se o vídeo demorar ou falhar,
    // a área nunca fica vazia.
    return (
      <div className={`relative ${className}`}>
        {poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition }}
          />
        )}
        <video
          ref={ref}
          // key força o navegador a recarregar a fonte quando a variante
          // troca (ex.: hidratação corrigindo o palpite mobile-first do
          // servidor pra desktop, ver useMediaQuery), em vez de manter o
          // <video> antigo com o atributo src desatualizado.
          key={src}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ objectPosition }}
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={media.alt[locale]}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={className}
      style={{ objectPosition }}
      src={media.src}
      alt={media.alt[locale]}
      loading="lazy"
    />
  );
});
