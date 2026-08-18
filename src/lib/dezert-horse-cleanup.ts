// Dezert Horse tem tela de carregamento própria que só sai do caminho com
// um clique de verdade, e UI (nav, HUD, tooltips) que não é o cenário em
// si. O iframe da prévia é pointer-events-none de propósito (não pode
// roubar o scroll da seção), então o clique que dispensaria a tela nunca
// chega até lá por um visitante de verdade — daí o clique sintético
// assim que o botão fica pronto.
//
// Só funciona quando o iframe é MESMA ORIGEM que a página que o embute: a
// política de mesma origem do navegador olha só esquema+host+porta, não o
// caminho, e tanto o portfólio (ganwalk.github.io/portifolio/) quanto o
// site (ganwalk.github.io/cavalo/) moram no mesmo host. Em produção isso
// já vale; em desenvolvimento local (localhost embutindo o site
// publicado) NÃO vale, contentDocument lança SecurityError — por isso o
// try/catch: falha ali só faz a prévia mostrar o site como está, tela de
// carregamento e tudo, em vez de quebrar.

const START_SELECTOR = "#start-btn";
const HIDE_SELECTORS = ["#main-nav", "#hud", "#hud-toggle-btn", "#cam-tooltip", "#presave-popup"];
const MAX_ATTEMPTS = 40;
const RETRY_MS = 300;

function isReady(el: Element): boolean {
  return (el as HTMLElement).style.display === "block";
}

/** Best effort: esconde a UI do site (nav, HUD, tooltips) e clica no botão
 *  de início assim que ele ficar pronto, deixando só o cenário 3D visível.
 *  Nunca lança: qualquer falha (cross-origin em dev, marcação que mudou
 *  no site de destino) só faz a prévia continuar mostrando o site como
 *  está. */
export function cleanupDezertHorsePreview(iframe: HTMLIFrameElement) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) return;

    const style = doc.createElement("style");
    style.textContent = `${HIDE_SELECTORS.join(", ")} { display: none !important; }`;
    doc.head.appendChild(style);

    let attempts = 0;
    const tryStart = () => {
      attempts += 1;
      const el = doc.querySelector(START_SELECTOR);
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
