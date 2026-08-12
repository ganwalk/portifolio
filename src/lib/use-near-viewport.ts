import { useEffect, useState, type RefObject } from "react";

/** true assim que o elemento entra numa margem generosa da viewport (25% de
 *  antecedência): controla o mount de mídia pesada (vídeo autoplay) pra ela
 *  não ligar/carregar antes de estar perto de ser vista. Uma vez perto, fica
 *  true pra sempre: não faz sentido desmontar e recarregar algo que já foi
 *  visitado. Nasceu em CasesGrid (MediaView de cada card). */
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
