"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Entrada padrão de seção: sobe e aparece quando entra na viewport, uma vez.
// Componente de cliente pensado para ser usado por Server Components: recebe
// children prontos e só cuida do movimento.
//
// IntersectionObserver + transição em CSS, não mais Framer Motion
// (whileInView + animação em JS/WAAPI): no celular, sob carga do thread
// principal (Lenis, os cartões do trio, os outros observers da página), uma
// animação dirigida por JS podia atrasar o PRÓPRIO início a ponto de o
// elemento já estar quase todo visível quando ela finalmente começava,
// lida como "só aparece", sem entrada nenhuma, mesmo com o limiar de
// disparo já correto (ver histórico: amount/margin, o problema de quando
// disparava, já tinha sido corrigido; este era o de como ela tocava depois
// de disparar). opacity/transform via CSS rodam no thread de composição,
// não no principal: uma vez que a classe muda, o navegador termina a
// transição sozinho, imune a esse mesmo atraso.
//
// Bônus: transition-duration responde de verdade a prefers-reduced-motion
// (ver globals.css, a regra `*, *::before, *::after`), o que a versão em
// Framer Motion nunca respeitava (WAAPI não lê transition-duration do
// CSS), apesar do comentário "o site obedece mesmo fora do Modo Boring"
// já prometer isso.

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";
const DURATION_MS = 750;

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      // Mesmo critério de antes: dispara assim que qualquer parte do
      // elemento cruza a margem abaixo, um ponto fixo em relação à TELA
      // (não ao tamanho do próprio elemento, que é o que fazia seções
      // altas no celular disparar tarde demais).
      { rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity ${DURATION_MS}ms ${EASE} ${delay}s, transform ${DURATION_MS}ms ${EASE} ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
