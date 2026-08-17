"use client";

import { useState } from "react";
import { useMediaQuery } from "@/lib/use-media-query";
import type { Media } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Dona do próprio estado de "carregou": monta e desmonta inteira junto com
// `active` (ver abaixo), então cada ativação começa com `loaded` limpo de
// novo, sem precisar de um efeito só pra resetar estado entre uma troca e
// outra.
function LiveFrame({ demoUrl, title }: { demoUrl: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <iframe
      src={demoUrl}
      title={title}
      tabIndex={-1}
      aria-hidden
      loading="lazy"
      onLoad={() => setLoaded(true)}
      className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-500 ${
        loaded ? "opacity-100" : "opacity-0"
      }`}
      style={{ border: 0 }}
    />
  );
}

// Prévia "ao vivo" de um card: mostra a capa (still) por padrão e troca
// pelo site publicado de verdade, embutido num iframe, quando `active`
// (hover no desktop, toque no mobile — ver CaseColumn/MobileCaseCard em
// CasesGrid.tsx). O iframe é pointer-events-none: a página embutida
// continua rodando e animando por conta própria, mas nunca captura o
// mouse/toque de quem só queria continuar rolando a seção por cima dele.
// tabIndex/aria-hidden tiram ele da navegação por teclado e leitor de
// tela: é decorativo aqui, o link de verdade pro site mora em LiveEmbed,
// no corpo do case.
//
// Existe porque vídeo pré-gravado, comprimido pra caber num cartão que
// carrega sozinho, perde qualidade rápido demais em conteúdo com textura
// fina (partículas, ruído de tela). A prévia ao vivo é a página de
// verdade, sem nenhuma perda de compressão, e mais interessante que um
// loop qualquer, já que reage de verdade a quem estiver vendo.
export function CardLivePreview({
  cover,
  demoUrl,
  title,
  locale,
  active,
  preferMobile = false,
  className = "",
}: {
  cover: Media;
  demoUrl: string;
  title: string;
  locale: Locale;
  active: boolean;
  /** Mesmo raciocínio de MediaView: força a variante vertical mesmo em
   *  tela larga, pro cartão compacto do carrossel de desktop. */
  preferMobile?: boolean;
  className?: string;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const useMobileVariant = preferMobile || !isDesktop;
  const poster =
    cover.kind === "video" ? (useMobileVariant && cover.posterMobile) || cover.poster : cover.src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={cover.alt[locale]}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {active && <LiveFrame demoUrl={demoUrl} title={title} />}
    </div>
  );
}
