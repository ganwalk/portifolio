// Sequência e batida do retrato animado da hero, e o relógio da roleta de
// palavras do subtítulo, que anda em cima do mesmo pulso.
//
// A volta completa tem quatro ciclos. Os quadros 1 a 12 são sempre os mesmos, e
// o que muda é o último de cada ciclo: 13, 14, 15 e 16, as quatro expressões.
// O quadro final segura bem mais tempo que os outros, senão a expressão, que é
// a graça da coisa, passa batido.
//
// O relógio vive aqui, fora do React, porque a hero renderiza o retrato (e o
// subtítulo) duas vezes: a cópia normal e a cópia invertida que aparece dentro
// da lente. Temporizadores independentes sairiam de sincronia, e a lente
// mostraria um quadro ou uma palavra diferente do que está atrás dela. Com um
// relógio só, todas as cópias andam juntas, e sobra um temporizador em vez de
// vários.
//
// A roleta do subtítulo gira exatamente quando o retrato muda de expressão:
// cada vez que o relógio entra num quadro final (13 a 16), a próxima palavra
// da lista entra. É o mesmo instante, então rosto e palavra mudam juntos, sem
// precisar de um segundo relógio.

const BASE_FRAMES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const ENDING_FRAMES = [13, 14, 15, 16] as const;
const ENDING_FRAME_SET = new Set<number>(ENDING_FRAMES);
const FRAME_MS = 85;
const ENDING_MS = 700;

/** Colunas e linhas da folha de sprite gerada por scripts/build-frames.mjs. */
const SHEET_COLUMNS = 4;

interface Step {
  frame: number;
  hold: number;
}

const SEQUENCE: Step[] = ENDING_FRAMES.flatMap((ending) => [
  ...BASE_FRAMES.map((frame) => ({ frame, hold: FRAME_MS })),
  { frame: ending, hold: ENDING_MS },
]);

/**
 * Posição do quadro na folha. Com `background-size: 400% 400%`, cada passo
 * alinha um tile, e os passos são `i / (n - 1) * 100%`.
 */
export function framePosition(frame: number): string {
  const index = frame - 1;
  const step = 100 / (SHEET_COLUMNS - 1);
  const column = index % SHEET_COLUMNS;
  const row = Math.floor(index / SHEET_COLUMNS);
  return `${column * step}% ${row * step}%`;
}

type FrameListener = (frame: number) => void;
type TickListener = (tick: number) => void;

const frameListeners = new Set<FrameListener>();
const tickListeners = new Set<TickListener>();
let step = 0;
let currentFrame: number = BASE_FRAMES[0];
// Conta quantos quadros finais já passaram, sobe de um em um pra sempre. Quem
// assina a roleta faz `tick % words.length` e não precisa saber nada sobre
// quadros de retrato, só que um novo "batimento" chegou.
let rouletteTick = 0;
let timer: ReturnType<typeof setTimeout> | null = null;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function hasSubscribers(): boolean {
  return frameListeners.size > 0 || tickListeners.size > 0;
}

function tick() {
  const { frame, hold } = SEQUENCE[step];
  currentFrame = frame;
  for (const listener of frameListeners) listener(frame);

  if (ENDING_FRAME_SET.has(frame)) {
    rouletteTick += 1;
    for (const listener of tickListeners) listener(rouletteTick);
  }

  step = (step + 1) % SEQUENCE.length;
  timer = setTimeout(tick, hold);
}

function stopIfIdle() {
  if (!hasSubscribers() && timer !== null) {
    clearTimeout(timer);
    timer = null;
    step = 0;
    rouletteTick = 0;
  }
}

/** Assina o relógio do retrato e devolve a função de cancelar. */
export function subscribeFrames(listener: FrameListener): () => void {
  // Quem pediu menos movimento no sistema recebe um quadro só, parado.
  if (prefersReducedMotion()) {
    listener(BASE_FRAMES[0]);
    return () => {};
  }

  frameListeners.add(listener);

  if (timer === null) {
    tick();
  } else {
    // Quem chega no meio da volta entra no quadro que já está no ar, em vez de
    // esperar o próximo passo mostrando o primeiro quadro.
    listener(currentFrame);
  }

  return () => {
    frameListeners.delete(listener);
    stopIfIdle();
  };
}

/**
 * Assina a roleta de palavras do subtítulo: dispara um número crescente a
 * cada quadro final do retrato, no mesmo instante em que a expressão muda.
 */
export function subscribeRouletteTick(listener: TickListener): () => void {
  if (prefersReducedMotion()) {
    listener(0);
    return () => {};
  }

  tickListeners.add(listener);

  if (timer === null) {
    tick();
  } else {
    // Quem chega no meio da volta entra na palavra que já está no ar.
    listener(rouletteTick);
  }

  return () => {
    tickListeners.delete(listener);
    stopIfIdle();
  };
}
