// Ganwalk e Dezert Horse têm tela de carregamento própria que só sai do
// caminho com um clique de verdade, e UI (nav, controles, tooltips) que
// não é o elemento gráfico reativo em si (o logo de partículas do
// Ganwalk, a cena do deserto do Dezert Horse). Sem isso, a prévia ao vivo
// do card (ver CardLivePreview.tsx) ficava travada na tela de
// carregamento pra sempre: o iframe é pointer-events-none de propósito
// (não pode roubar o scroll da seção), então o clique que dispensaria a
// tela nunca chega até lá por um visitante de verdade.
//
// Só funciona quando o iframe é MESMA ORIGEM que a página que o embute:
// a política de mesma origem do navegador olha só esquema+host+porta, não
// o caminho, e tanto o portfólio (ganwalk.github.io/portifolio/) quanto os
// dois sites (ganwalk.github.io/2026/, /cavalo/) moram no mesmo host. Em
// produção isso já vale; em desenvolvimento local (localhost embutindo o
// site publicado) NÃO vale, contentDocument lança SecurityError — por
// isso o try/catch: falha ali só faz a prévia mostrar o site como está,
// tela de carregamento e tudo, em vez de quebrar.

interface PreviewCleanup {
  /** Seletor do elemento que dispensa a tela de carregamento ao ser clicado. */
  startSelector: string;
  /** Enquanto false, o elemento ainda não está pronto (um clique real
   *  também não teria efeito nele ainda). */
  isReady: (el: Element) => boolean;
  /** Escondidos assim que a limpeza roda: nav, controles, textos de
   *  instrução — tudo que não é o elemento gráfico reativo em si. */
  hideSelectors: string[];
}

const CLEANUPS: Record<string, PreviewCleanup> = {
  ganwalk: {
    startSelector: "#click-to-start-text",
    isReady: (el) => el.classList.contains("ready"),
    hideSelectors: [
      "#top-nav",
      "#top-marquee",
      "#mobile-exp-bar",
      "#mobile-menu-overlay",
      "#p1-interaction-tooltip",
      "#p1-controls-bar",
      "#p1-toggle-button",
    ],
  },
  "dezert-horse": {
    startSelector: "#start-btn",
    isReady: (el) => (el as HTMLElement).style.display === "block",
    hideSelectors: ["#main-nav", "#hud", "#hud-toggle-btn", "#cam-tooltip", "#presave-popup"],
  },
};

const MAX_ATTEMPTS = 40;
const RETRY_MS = 300;

/** Best effort: tenta destravar a experiência (clicar em quem dispensa a
 *  tela de carregamento assim que ela ficar pronta) e esconder a UI do
 *  próprio site, deixando só o elemento gráfico reativo visível. Nunca
 *  lança: qualquer falha (cross-origin em dev, marcação que mudou no site
 *  de destino) só faz a prévia continuar mostrando o site como está. */
export function cleanupArtistPreview(iframe: HTMLIFrameElement, slug: string) {
  const cleanup = CLEANUPS[slug];
  if (!cleanup) return;

  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const style = doc.createElement("style");
    style.textContent = `${cleanup.hideSelectors.join(", ")} { display: none !important; }`;
    doc.head.appendChild(style);

    let attempts = 0;
    const tryStart = () => {
      attempts += 1;
      const el = doc.querySelector(cleanup.startSelector);
      if (el && cleanup.isReady(el)) {
        (el as HTMLElement).click();
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        doc.defaultView?.setTimeout(tryStart, RETRY_MS);
      }
    };
    tryStart();
  } catch {
    // Cross-origin (dev local contra o site publicado) ou marcação
    // inesperada: a prévia cai pro comportamento padrão, site intacto.
  }
}
