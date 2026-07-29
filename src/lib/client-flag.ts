// Interruptor booleano que sobrevive ao recarregamento.
//
// Guardar preferência em localStorage e ler dentro de um efeito causa dois
// problemas: o React reclama do setState no efeito e, pior, a pessoa que
// escolheu o Modo Boring vê a versão criativa piscar antes da hidratação.
// Com useSyncExternalStore o React lê a preferência já na primeira renderização
// do cliente, e o script de `boot.ts` cuida do CSS antes da primeira pintura.

type Listener = () => void;

export interface ClientFlag {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => boolean;
  getServerSnapshot: () => boolean;
  set: (next: boolean) => void;
}

export function createClientFlag(
  storageKey: string,
  /** Atributo espelhado em <html>, para o CSS reagir sem depender do React. */
  htmlAttribute?: string,
): ClientFlag {
  const listeners = new Set<Listener>();
  let cache: boolean | null = null;

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    getSnapshot() {
      cache ??= localStorage.getItem(storageKey) === "true";
      return cache;
    },

    // Durante a geração do HTML e a hidratação vale o padrão desligado.
    getServerSnapshot: () => false,

    set(next) {
      cache = next;
      localStorage.setItem(storageKey, String(next));
      if (htmlAttribute) {
        document.documentElement.setAttribute(htmlAttribute, String(next));
      }
      listeners.forEach((listener) => listener());
    },
  };
}
