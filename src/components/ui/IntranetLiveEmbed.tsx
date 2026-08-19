"use client";

import { useEffect, useRef, useState } from "react";
import { useNearViewport } from "@/lib/use-near-viewport";
import { cleanupIntranetEmbed } from "@/lib/intranet-embed-cleanup";

// Prévia AO VIVO de um componente específico da Intranet, não uma
// reconstrução: o site de verdade, embutido, com cabeçalho e sidebar
// escondidos e a rolagem já no lugar certo (ver intranet-embed-cleanup.ts),
// então arrastar, clicar e usar o teclado funcionam de verdade, como no
// site publicado. A técnica é a de "mini navegador": o iframe nasce no
// tamanho real de desktop (SOURCE_WIDTH) e uma escala CSS o encolhe pra
// caber na célula do bento, calculada a partir da largura real do
// container (ResizeObserver, mesmo raciocínio de ParticleTextCanvas.tsx).
// Eventos de ponteiro e teclado atravessam a escala normalmente: é só
// pintura, o navegador já resolve as coordenadas certas por baixo.
//
// A limpeza (esconder UI, rolar até o componente) só funciona quando o
// portfólio publicado embute a Intranet publicada: mesma origem
// (ganwalk.github.io), mesmo raciocínio de DezertHorseLive.tsx. Fora
// desse cenário (desenvolvimento local, ou qualquer outro host) o iframe
// nunca é revelado: o still (`poster`) continua por cima pra sempre, sem
// nunca mostrar um recorte errado da página.

const HIDE_SELECTORS = ["header.glass-nav", ".sidebar-scrollbar"];
const SOURCE_WIDTH = 1400;
const SOURCE_HEIGHT = 1400;

export function IntranetLiveEmbed({
  demoUrl,
  scrollToSelector,
  poster,
  title,
  className = "",
}: {
  /** URL completa da página real, com a âncora do componente (ex.:
   *  ".../design-system#roadmap-timeline"). */
  demoUrl: string;
  /** Seletor do componente a isolar dentro da página embutida. */
  scrollToSelector: string;
  /** Still de fallback, sempre por baixo: única coisa visível fora de
   *  produção (mesma origem), e também o que aparece até o iframe
   *  terminar de carregar mesmo em produção. */
  poster: string;
  title: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(wrapperRef);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const resizeObserver = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SOURCE_WIDTH);
    });
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, []);

  return (
    // `className` (ex.: "absolute inset-0") controla o posicionamento
    // deste elemento dentro do card, de fora: sem wrapper interno próprio,
    // uma classe "relative" fixa aqui dentro brigaria de especificidade
    // com um "absolute" vindo de fora (mesmo seletor CSS, position), e o
    // vencedor não é quem vem depois no HTML, é quem o Tailwind gerou
    // depois na folha de estilo — o resultado, uma vez, foi o elemento
    // ficar sem posicionamento nenhum e sem altura (position:relative com
    // inset-0 não estica nada, só desloca). O wrapper interno sempre
    // ganha "relative h-full w-full" sozinho, sem nunca se misturar com o
    // que vem de fora.
    <div ref={wrapperRef} className={className}>
      <div className="relative h-full w-full overflow-hidden bg-surface">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={poster}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
        {isNear && (
          <iframe
            key={demoUrl}
            src={demoUrl}
            title={title}
            loading="lazy"
            onLoad={(event) =>
              cleanupIntranetEmbed(
                event.currentTarget,
                { scrollToSelector, hideSelectors: HIDE_SELECTORS },
                setReady,
              )
            }
            className={`absolute left-0 top-0 origin-top-left transition-opacity duration-300 ${
              ready ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{
              border: 0,
              width: SOURCE_WIDTH,
              height: SOURCE_HEIGHT,
              transform: `scale(${scale})`,
              opacity: ready ? 1 : 0,
            }}
          />
        )}
      </div>
    </div>
  );
}
