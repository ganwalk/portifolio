import type { Media } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Renderizador único de mídia: decide entre <video> e <img> a partir dos dados.
// Vídeos são mudos, em loop e com poster, comportamento de textura viva, não
// de player. Usamos <img> puro em vez de next/image porque o export estático
// não otimiza imagem no servidor e as URLs remotas mudam junto com as mídias.

export function MediaView({
  media,
  locale,
  className = "",
}: {
  media: Media;
  locale: Locale;
  className?: string;
}) {
  if (media.kind === "video") {
    // O poster também vive como camada de fundo: se o vídeo demorar ou falhar,
    // a área nunca fica vazia.
    return (
      <div className={`relative ${className}`}>
        {media.poster && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={media.poster}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src={media.src}
          poster={media.poster}
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
      src={media.src}
      alt={media.alt[locale]}
      loading="lazy"
    />
  );
}
