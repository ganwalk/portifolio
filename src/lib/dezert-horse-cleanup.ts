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

/** Muda qualquer áudio do documento pra silencioso E parado, cobrindo tanto
 *  <audio>/<video> quanto Web Audio API (o painel retrô do site toca o
 *  álbum por um dos dois, sem como saber qual sem ler o código-fonte
 *  dele). allow="autoplay 'none'" no iframe (ver DezertHorseLive) já
 *  deveria bastar, mas o autoplay do host libera som sem gesto nenhum
 *  pela Media Engagement Index alta em ganwalk.github.io (o portfólio e o
 *  site moram no mesmo host): esta função é o silêncio de verdade,
 *  aplicado direto no documento do iframe, não uma permissão que o
 *  navegador pode contornar.
 *
 *  Parar, não só mutar: o cenário muda de cor por faixa (a paleta segue a
 *  música tocando), e essa progressão lê o próprio tempo decorrido do
 *  áudio, não o volume. Mudo e tocando, a prévia continuava avançando de
 *  cor sozinha por trás, nunca parecendo o mesmo cenário duas vezes; a
 *  intenção aqui é uma vitrine parada, sempre na paleta inicial, então o
 *  áudio para de vez (pause), sem nunca sair do zero. */
function silenceAudio(doc: Document) {
  const win = doc.defaultView;
  if (!win) return;

  const freeze = (el: HTMLMediaElement) => {
    el.muted = true;
    el.volume = 0;
    el.pause();
  };

  doc.querySelectorAll("audio, video").forEach((el) => freeze(el as HTMLMediaElement));

  // Cobre <audio autoplay> inserido depois no DOM (o atributo dispara a
  // reprodução por dentro do próprio navegador, sem passar pelo play()
  // público que o override abaixo intercepta): congela no instante em que
  // o elemento aparece, antes do navegador ter chance de tocar alguma coisa.
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof win.Element)) return;
        if (node instanceof win.HTMLMediaElement) freeze(node);
        node.querySelectorAll?.("audio, video").forEach((el) => freeze(el as HTMLMediaElement));
      });
    }
  }).observe(doc.documentElement, { childList: true, subtree: true });

  // Cobre elementos criados depois (`new Audio()` nunca anexado ao DOM
  // incluso, já que play() sempre precisa ser chamado pra tocar alguma
  // coisa): deixa a chamada original prosseguir (o site pode depender da
  // Promise resolvendo pra atualizar o próprio estado de "tocando"), mas
  // pausa de novo logo em seguida, antes do primeiro quadro de áudio
  // avançar o relógio de verdade.
  const originalPlay = win.HTMLMediaElement.prototype.play;
  win.HTMLMediaElement.prototype.play = function (this: HTMLMediaElement, ...args) {
    freeze(this);
    const result = originalPlay.apply(this, args);
    result?.then(() => freeze(this)).catch(() => {});
    return result;
  };

  // Web Audio API (Howler e afins às vezes tocam por aqui, não por
  // <audio>): um AudioContext nasce suspenso e só processa o grafo depois
  // de resume(). Fazendo resume() nunca resolver de verdade (só devolve
  // uma Promise já resolvida, sem chamar o resume original), o contexto
  // fica suspenso pra sempre, e nenhum nó dele produz som, sem precisar
  // tocar em nenhum nó do grafo em si.
  const AudioContextCtor =
    win.AudioContext ?? (win as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (AudioContextCtor) {
    AudioContextCtor.prototype.resume = () => Promise.resolve();
  }
}

/** Best effort: silencia todo áudio, esconde a UI do site (nav, HUD,
 *  tooltips) e clica no botão de início assim que ele ficar pronto,
 *  deixando só o cenário 3D visível. `onSettled` roda uma vez só, quando o
 *  clique é disparado, quando as tentativas se esgotam ou quando a
 *  detecção falha (cross-origin): é o sinal pra revelar o iframe (ver
 *  DezertHorseLive), que fica invisível até aqui pra nunca piscar a tela
 *  de carregamento do site embutido. Recebe a `window` do documento
 *  embutido (ou `null`, na falha), pra quem chamou poder montar o
 *  congelamento de `freezeAnimation` abaixo; ela mesma não decide nada
 *  sobre pausar a cena, só entrega o alvo. Nunca lança: qualquer falha
 *  (marcação que mudou no site de destino) só faz a prévia continuar
 *  mostrando o site como está. */
export function cleanupDezertHorsePreview(
  iframe: HTMLIFrameElement,
  onSettled: (win: Window | null) => void,
) {
  try {
    const doc = iframe.contentDocument;
    if (!doc) {
      onSettled(null);
      return;
    }

    silenceAudio(doc);

    const style = doc.createElement("style");
    style.textContent = `${HIDE_SELECTORS.join(", ")} { display: none !important; }`;
    doc.head.appendChild(style);

    let attempts = 0;
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      onSettled(doc.defaultView);
    };
    const tryStart = () => {
      attempts += 1;
      const el = doc.querySelector(START_SELECTOR);
      if (el && isReady(el)) {
        (el as HTMLElement).click();
        settle();
        return;
      }
      if (attempts < MAX_ATTEMPTS) {
        doc.defaultView?.setTimeout(tryStart, RETRY_MS);
      } else {
        settle();
      }
    };
    tryStart();
  } catch {
    // Cross-origin (dev local contra o site publicado) ou marcação
    // inesperada: a prévia cai pro comportamento padrão, site intacto.
    onSettled(null);
  }
}

export interface AnimationFreezeControl {
  freeze: () => void;
  unfreeze: () => void;
}

/** Congela e retoma o laço de renderização do cenário 3D embutido, de
 *  fora, sem recarregar o iframe (o que jogaria fora toda a preparação de
 *  cleanupDezertHorsePreview: áudio silenciado, UI escondida, botão de
 *  início já clicado). Diferente dos outros dois do trio de artistas
 *  (GanwalkAsciiVideo, ParticleTextCanvas), que já pausam o PRÓPRIO laço
 *  ao sair de tela via IntersectionObserver porque são reconstruções
 *  locais em canvas, este é o site de verdade rodando por trás: não existe
 *  como pedir pra ele mesmo pausar sem tocar no código dele.
 *
 *  A saída é a mesma família de truque de silenceAudio, acima: sobrescrever
 *  uma API nativa no documento embutido (mesma origem, ver comentário de
 *  DezertHorseLive sobre isso), aqui requestAnimationFrame em vez de
 *  play(). Enquanto congelado, o callback mais recente fica GUARDADO em
 *  vez de agendado (não simplesmente descartado): descartar quebraria a
 *  corrente pra sempre, já que é o próprio laço do site quem pede o
 *  PRÓXIMO quadro de dentro de cada quadro anterior, e sem ninguém
 *  chamando requestAnimationFrame de fora não sobra gatilho nenhum pra
 *  reacender. Ao descongelar, o callback guardado dispara uma vez só, via
 *  requestAnimationFrame nativo, e a corrente se recompõe sozinha a partir
 *  dali, porque é esse mesmo quadro que pede o próximo. */
export function freezeAnimation(win: Window): AnimationFreezeControl {
  const nativeRaf = win.requestAnimationFrame.bind(win);
  let frozen = false;
  let pending: FrameRequestCallback | null = null;

  win.requestAnimationFrame = ((callback: FrameRequestCallback) => {
    if (!frozen) return nativeRaf(callback);
    pending = callback;
    return 0;
  }) as typeof win.requestAnimationFrame;

  return {
    freeze() {
      frozen = true;
    },
    unfreeze() {
      frozen = false;
      if (pending) {
        const callback = pending;
        pending = null;
        nativeRaf(callback);
      }
    },
  };
}
