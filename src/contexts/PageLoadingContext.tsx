"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

// Registro de telas de carregamento ANINHADAS (hoje, só a prévia ao vivo do
// Dezert Horse, ver DezertHorseLive.tsx): a tela de entrada do próprio
// portfólio (SiteLoader) só se dá como completa quando document.fonts.ready
// resolver E todo componente registrado aqui tiver terminado de carregar,
// não só quando as fontes chegarem. Sem isso, o site podia revelar a home
// enquanto uma prévia embutida (com sua PRÓPRIA tela de carregamento, ver
// dezert-horse-cleanup.ts) ainda estava no meio da própria entrada,
// escondida atrás do overlay de entrada só por coincidência de tempo.
//
// `begin()` incrementa o contador e devolve a função que o decrementa de
// volta; um componente chama na montagem e chama o retorno assim que a
// PRÓPRIA tela de carregamento terminar (ou no desmonte, o que vier
// primeiro: `begin` é reentrante contra chamada dupla). SiteLoader nunca
// trava para sempre por causa disso: o teto absoluto de espera continua
// nela mesma (HARD_MAX_MS), então um registro que nunca resolve (uma prévia
// que nunca chega perto da viewport, por exemplo) só faz o teto valer, não
// prende a entrada do site.

interface PageLoadingValue {
  pendingCount: number;
  begin: () => () => void;
}

const PageLoadingContext = createContext<PageLoadingValue | null>(null);

export function PageLoadingProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);

  const begin = useCallback(() => {
    setPendingCount((n) => n + 1);
    const endedRef = { current: false };
    return () => {
      if (endedRef.current) return;
      endedRef.current = true;
      setPendingCount((n) => Math.max(0, n - 1));
    };
  }, []);

  return <PageLoadingContext value={{ pendingCount, begin }}>{children}</PageLoadingContext>;
}

/** Registra UM componente com tela de carregamento própria. `pending` é se
 *  ELE ainda não terminou de carregar; enquanto for `true`, o contador
 *  global fica incrementado (efeito, não durante a renderização: alterar o
 *  contador de outro componente no meio do render dele é side effect
 *  inseguro). */
export function usePageLoadingRegistration(pending: boolean) {
  const ctx = useContext(PageLoadingContext);
  if (!ctx) {
    throw new Error("usePageLoadingRegistration deve ser usado dentro de PageLoadingProvider");
  }
  const { begin } = ctx;

  useEffect(() => {
    if (!pending) return;
    return begin();
  }, [pending, begin]);
}

/** Consumido só por SiteLoader: quantas telas de carregamento aninhadas
 *  ainda estão pendentes agora. */
export function usePageLoadingPendingCount(): number {
  const ctx = useContext(PageLoadingContext);
  if (!ctx) {
    throw new Error("usePageLoadingPendingCount deve ser usado dentro de PageLoadingProvider");
  }
  return ctx.pendingCount;
}
