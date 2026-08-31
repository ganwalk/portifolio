"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { usePageLoadingRegistration } from "@/contexts/PageLoadingContext";
import { useMediaQuery } from "@/lib/use-media-query";
import { framePosition, subscribeFrames } from "@/lib/portrait-frames";

// Retrato animado em flipbook, ao lado do nome na hero. Os quadros vivem numa
// folha de sprite (public/frames, gerada por scripts/build-frames.mjs) e a
// animação troca de quadro mexendo só em background-position, sem tocar no DOM.
//
// O basePath do GitHub Pages não é aplicado a url() dentro do CSS, então as
// URLs da folha entram por variável, montadas aqui, onde a variável de ambiente
// existe. A troca entre a folha leve e a grande fica no CSS, por media query.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const PORTRAIT_SM = `${basePath}/frames/eu-sm.webp`;
const PORTRAIT_LG = `${basePath}/frames/eu-lg.webp`;

export function SelfPortrait({
  label,
  className = "",
}: {
  label: string;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const ref = useRef<HTMLDivElement>(null);
  // Mesmo breakpoint que troca a folha no CSS (ver globals.css): decide qual
  // arquivo baixar aqui embaixo pra pré-carregar exatamente o mesmo que o
  // navegador vai pedir pro background-image.
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return subscribeFrames((frame) => {
      element.style.backgroundPosition = framePosition(frame);
    });
  }, []);

  // A tela de entrada do site (SiteLoader) espera esta folha de sprite
  // terminar de baixar, o mesmo mecanismo que já segura a entrada pela
  // prévia ao vivo do Dezert Horse (usePageLoadingRegistration, ver
  // PageLoadingContext.tsx). Sem isso, a cortina abria e o retrato, o
  // elemento mais vivo da hero, nascia em branco por um instante, só
  // preenchendo quando o download (até ~750KB no desktop, ~170KB no
  // mobile) terminasse por trás da entrada já revelada, pior justo em
  // conexão de celular, onde a demora é maior. Em Modo Boring o retrato
  // nem existe (ver o corte abaixo), então nem chega a baixar: a página
  // se dá como pronta na hora, sem esperar por uma imagem que nunca vai
  // aparecer.
  usePageLoadingRegistration(!isBoringMode && !loaded);

  useEffect(() => {
    if (isBoringMode) return;
    let cancelled = false;
    const image = new Image();
    const settle = () => {
      if (!cancelled) setLoaded(true);
    };
    image.onload = settle;
    image.onerror = settle;
    image.src = isDesktop ? PORTRAIT_LG : PORTRAIT_SM;
    if (image.complete) settle();
    return () => {
      cancelled = true;
    };
  }, [isBoringMode, isDesktop]);

  // Modo Boring é informação, não vitrine.
  if (isBoringMode) return null;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
      className={`portrait-frames ${className}`}
      style={
        {
          "--portrait-sm": `url(${PORTRAIT_SM})`,
          "--portrait-lg": `url(${PORTRAIT_LG})`,
        } as CSSProperties
      }
    />
  );
}
