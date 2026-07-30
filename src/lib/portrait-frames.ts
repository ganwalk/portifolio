// Sequência e batida do retrato animado da hero.
//
// A volta completa tem quatro ciclos. Os quadros 1 a 12 são sempre os mesmos, e
// o que muda é o último de cada ciclo: 13, 14, 15 e 16, as quatro expressões.
// O quadro final segura bem mais tempo que os outros, senão a expressão, que é
// a graça da coisa, passa batido.
//
// O relógio vive aqui, fora do React, porque a hero renderiza o retrato duas
// vezes: a cópia normal e a cópia invertida que aparece dentro da lente. Dois
// temporizadores independentes sairiam de sincronia e a lente mostraria um
// quadro diferente do que está atrás dela. Com um relógio só, as duas andam
// juntas, e sobra um temporizador em vez de dois.

const BASE_FRAMES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
const ENDING_FRAMES = [13, 14, 15, 16] as const;
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

type Listener = (frame: number) => void;

const listeners = new Set<Listener>();
let step = 0;
let currentFrame: number = BASE_FRAMES[0];
let timer: ReturnType<typeof setTimeout> | null = null;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function tick() {
  const { frame, hold } = SEQUENCE[step];
  currentFrame = frame;
  for (const listener of listeners) listener(frame);
  step = (step + 1) % SEQUENCE.length;
  timer = setTimeout(tick, hold);
}

/** Assina o relógio do retrato e devolve a função de cancelar. */
export function subscribeFrames(listener: Listener): () => void {
  // Quem pediu menos movimento no sistema recebe um quadro só, parado.
  if (prefersReducedMotion()) {
    listener(BASE_FRAMES[0]);
    return () => {};
  }

  listeners.add(listener);

  if (timer === null) {
    tick();
  } else {
    // Quem chega no meio da volta entra no quadro que já está no ar, em vez de
    // esperar o próximo passo mostrando o primeiro quadro.
    listener(currentFrame);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== null) {
      clearTimeout(timer);
      timer = null;
      step = 0;
    }
  };
}
