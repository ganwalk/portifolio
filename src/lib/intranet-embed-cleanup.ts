// Prévia de componente específico da Intranet: abre a página real (com
// âncora) num iframe e, quando a mesma origem permite, esconde o cabeçalho
// e a sidebar e rola até o componente certo, deixando só ele visível. Só
// funciona quando o iframe é MESMA ORIGEM que a página que o embute: a
// política de mesma origem do navegador olha só esquema+host+porta, não o
// caminho, e tanto o portfólio (ganwalk.github.io/portifolio/) quanto a
// Intranet (ganwalk.github.io/intranet/) moram no mesmo host. Em produção
// isso já vale; em desenvolvimento local (localhost embutindo o site
// publicado) NÃO vale, contentDocument lança SecurityError, coberto pelo
// try/catch (mesmo raciocínio de dezert-horse-cleanup.ts, que já resolve
// isso pro trio de artistas).

export interface IntranetCleanupConfig {
  /** Seletor do componente a isolar (ex.: "#roadmap-timeline"). */
  scrollToSelector: string;
  /** Seletores a esconder por completo (cabeçalho, sidebar). */
  hideSelectors: string[];
}

const MAX_ATTEMPTS = 40;
const RETRY_MS = 150;

/** Best effort: esconde cabeçalho e sidebar, rola instantaneamente (sem
 *  animação, é um recorte, não uma navegação) até o componente alvo.
 *  `onSettled(ok)` roda uma vez só: `ok=true` quando a limpeza terminou de
 *  verdade (mesma origem, elemento encontrado), `ok=false` quando falhou
 *  (cross-origin, ou o elemento nunca apareceu) — o chamador decide o que
 *  fazer com cada caso (ver IntranetLiveEmbed.tsx: só revela o iframe
 *  quando `ok`, mantém o still de fallback por cima quando não). Nunca
 *  lança.
 */
export function cleanupIntranetEmbed(
  iframe: HTMLIFrameElement,
  config: IntranetCleanupConfig,
  onSettled: (ok: boolean) => void,
) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      onSettled(false);
      return;
    }

    const style = doc.createElement("style");
    style.textContent = `${config.hideSelectors.join(", ")} { display: none !important; }`;
    doc.head.appendChild(style);

    let attempts = 0;
    let settled = false;
    const settle = (ok: boolean) => {
      if (settled) return;
      settled = true;
      onSettled(ok);
    };
    const tryScroll = () => {
      attempts += 1;
      const el = doc.querySelector(config.scrollToSelector);
      if (el) {
        // Duas chamadas, não uma: esconder cabeçalho/sidebar muda a altura
        // do documento (a sidebar podia ser a coluna mais alta), e o
        // primeiro scrollIntoView roda antes do reflow assentar depois do
        // <style> acima. O segundo, um quadro depois, corrige contra o
        // layout final.
        el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
        doc.defaultView?.requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "instant" as ScrollBehavior, block: "start" });
          settle(true);
        });
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        doc.defaultView?.setTimeout(tryScroll, RETRY_MS);
      } else {
        settle(false);
      }
    };
    tryScroll();
  } catch {
    // Cross-origin (dev local contra o site publicado): sem acesso pra
    // limpar nada, o chamador mantém o still de fallback.
    onSettled(false);
  }
}
