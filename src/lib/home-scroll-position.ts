// Guarda a posição de rolagem da home antes de entrar na página de um
// projeto (/work/[slug]), pra o botão de voltar de lá poder devolver o
// visitante exatamente de onde ele saiu, não só pro topo da seção de
// projetos. sessionStorage, não um estado em memória: a navegação entre
// / e /work/[slug] é uma troca de rota de verdade (histórico do
// navegador), e o valor precisa sobreviver a ela.
const KEY = "home-scroll-y";

export function saveHomeScrollPosition() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, String(window.scrollY));
}

// Consome (lê e apaga) a posição salva: uma vez restaurada, não deve reaparecer
// numa visita futura à home que não veio de um botão de voltar.
export function consumeHomeScrollPosition(): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (raw === null) return null;
  sessionStorage.removeItem(KEY);
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
