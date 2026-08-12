import { useEffect, useState, type RefObject } from "react";

/** true assim que o elemento entra numa margem generosa da viewport (25% de
 *  antecedência): controla o mount de mídia pesada (vídeo autoplay, cena
 *  WebGL) pra ela não ligar/carregar antes de estar perto de ser vista. Uma
 *  vez perto, fica true pra sempre: não faz sentido desmontar e recarregar
 *  algo que já foi visitado. Nasceu em CasesGrid (MediaView de cada card) e
 *  também rege os objetos skeumórficos do Playground (ver components/ui/
 *  skeuo): three.js só entra no bundle quando a seção está perto de
 *  aparecer, não no carregamento inicial da página. */
export function useNearViewport<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    if (isNear) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNear(true);
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNear, ref]);
  return isNear;
}
