// Ganwalk e Dezert Horse têm tela de carregamento própria que só sai do
// caminho com um clique de verdade, e UI (nav, controles, tooltips) que
// não é o elemento gráfico reativo em si (o logo de partículas do
// Ganwalk, a cena do deserto do Dezert Horse, o nome em partículas do
// Pink Opala). Sem isso, a prévia ao vivo do card (ver CardLivePreview.tsx)
// ficava travada na tela de carregamento pra sempre: o iframe é
// pointer-events-none de propósito (não pode roubar o scroll da seção),
// então o clique que dispensaria a tela nunca chega até lá por um
// visitante de verdade.
//
// Só funciona quando o iframe é MESMA ORIGEM que a página que o embute:
// a política de mesma origem do navegador olha só esquema+host+porta, não
// o caminho, e tanto o portfólio (ganwalk.github.io/portifolio/) quanto os
// três sites (ganwalk.github.io/2026/, /cavalo/, /pinkopala/) moram no
// mesmo host. Em produção isso já vale; em desenvolvimento local
// (localhost embutindo o site publicado) NÃO vale, contentDocument lança
// SecurityError — por isso o try/catch: falha ali só faz a prévia mostrar
// o site como está, tela de carregamento e tudo, em vez de quebrar.

interface PreviewCleanup {
  /**
   * Seletor do elemento que dispensa a tela de carregamento ao ser
   * clicado. Ausente quando o site já dispensa sozinho, sem clique (Pink
   * Opala: `document.fonts.ready` mais um fallback de tempo).
   */
  startSelector?: string;
  /** Enquanto false, o elemento ainda não está pronto (um clique real
   *  também não teria efeito nele ainda). Ignorado sem `startSelector`. */
  isReady?: (el: Element) => boolean;
  /** Escondidos assim que a limpeza roda: nav, controles, textos de
   *  instrução — tudo que não é o elemento gráfico reativo em si. */
  hideSelectors: string[];
  /**
   * Seletor do elemento que recebe o mousemove repassado do cartão (ver
   * forwardMouseMove abaixo): o iframe é pointer-events-none, então o
   * gráfico nunca veria o mouse de verdade sem isso. Ausente quando o
   * gráfico não reage à posição do cursor (Dezert Horse: câmera anima
   * sozinha, sem essa interação).
   */
  mouseMoveSelector?: string;
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
    // Escuta mousemove no próprio canvas (cvs.addEventListener), não na
    // window: precisa ser o alvo exato do dispatch pra disparar o listener.
    mouseMoveSelector: "#p1-canvas",
  },
  "dezert-horse": {
    startSelector: "#start-btn",
    isReady: (el) => (el as HTMLElement).style.display === "block",
    hideSelectors: ["#main-nav", "#hud", "#hud-toggle-btn", "#cam-tooltip", "#presave-popup"],
  },
  "pink-opala": {
    // Sem startSelector: o preloader do próprio Pink Opala já dispensa
    // sozinho (document.fonts.ready + fallback de 4s), não precisa de
    // clique nenhum pra sair do caminho.
    hideSelectors: ["#top-nav"],
    // window.addEventListener('mousemove', ...) no código-fonte: qualquer
    // alvo que borbulhe até a window serve, o próprio documento funciona.
    mouseMoveSelector: ":root",
  },
};

const MAX_ATTEMPTS = 40;
const RETRY_MS = 300;

/** Best effort: tenta destravar a experiência (clicar em quem dispensa a
 *  tela de carregamento assim que ela ficar pronta, quando existe esse
 *  gatilho) e esconder a UI do próprio site, deixando só o elemento
 *  gráfico reativo visível. Nunca lança: qualquer falha (cross-origin em
 *  dev, marcação que mudou no site de destino) só faz a prévia continuar
 *  mostrando o site como está. */
export function cleanupArtistPreview(iframe: HTMLIFrameElement, slug: string) {
  const cleanup = CLEANUPS[slug];
  if (!cleanup) return;

  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const style = doc.createElement("style");
    style.textContent = `${cleanup.hideSelectors.join(", ")} { display: none !important; }`;
    doc.head.appendChild(style);

    if (!cleanup.startSelector || !cleanup.isReady) return;
    const { startSelector, isReady } = cleanup;

    let attempts = 0;
    const tryStart = () => {
      attempts += 1;
      const el = doc.querySelector(startSelector);
      if (el && isReady(el)) {
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

/** Repassa a posição do mouse (em coordenadas de viewport, como
 *  MouseEvent.clientX/Y de verdade) pro elemento gráfico dentro do
 *  iframe, quando o case tem essa reação configurada. O evento sintético
 *  não é "trusted" (isTrusted: false), mas isso só importa pra APIs
 *  vigiadas por gesto do usuário (autoplay de áudio, por exemplo); o
 *  código do site só lê clientX/clientY do evento pra saber onde o mouse
 *  está, e isso funciona igual venha o evento de onde vier. Mesmo
 *  try/catch silencioso de cleanupArtistPreview: melhor esforço, nunca
 *  quebra a página por causa de uma prévia decorativa. */
export function forwardMouseMove(iframe: HTMLIFrameElement, slug: string, clientX: number, clientY: number) {
  const cleanup = CLEANUPS[slug];
  if (!cleanup?.mouseMoveSelector) return;

  try {
    const doc = iframe.contentDocument;
    const win = doc?.defaultView;
    if (!doc || !win) return;

    const target = doc.querySelector(cleanup.mouseMoveSelector);
    if (!target) return;

    target.dispatchEvent(
      new win.MouseEvent("mousemove", { clientX, clientY, bubbles: true, cancelable: true }),
    );
  } catch {
    // Cross-origin em dev: sem efeito, a prévia continua parada pro mouse.
  }
}
