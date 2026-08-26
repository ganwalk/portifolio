"use client";

import type { ReactNode } from "react";
import { Reveal } from "../Reveal";

// Caixa da grid bento da vitrine da Intranet: cada exemplo (token, componente
// portado) mora numa caixa própria que o descreve (título curto + uma linha
// de contexto), revelada sozinha ao entrar na tela. Cada caixa recebe seu
// próprio Reveal (em vez de uma seção inteira embrulhada numa cortina só):
// numa seção alta o bastante (a trilha do roadmap sozinha já passa de
// 400px), o "amount: 0.25" do Reveal (ver Reveal.tsx) pede uma fração da
// altura TOTAL do bloco visível de uma vez, algo que o viewport do celular
// nunca alcança quando o bloco inteiro nunca cabe nele. O efeito prático era
// um vão de tela em branco enorme (a seção inteira presa em opacity: 0) até
// o visitante rolar bem além dela. Caixas pequenas, uma por vez, sempre
// cabem no viewport e sempre revelam.
//
// Cor sempre da "Marca A" (--ig-background/--ig-foreground/--border, ver
// .intranet-scope em globals.css), nunca dos tokens do site (bg-surface,
// text-foreground): esses seguem o tema claro/escuro do resto do site, mas
// tudo AQUI DENTRO (os componentes portados, ver FaqAccordion.tsx,
// TooltipsDemo.tsx etc.) já é fixo, um retrato real da Intranet publicada,
// sempre clara. Com
// a casca acompanhando o tema e o miolo sempre claro, o modo escuro do site
// virava uma caixa escura com conteúdo branco dentro, destoando do resto da
// vitrine (que também é sempre clara). Casca e miolo na mesma paleta fixa:
// lê como uma peça só, um recorte do produto de verdade, não uma mistura
// dos dois temas.

export function BentoCard({
  title,
  description,
  className = "",
  delay = 0,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="flex h-full flex-col gap-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--ig-background))] p-5 transition-colors duration-300 hover:border-[hsl(var(--ig-foreground)/0.25)]">
        <div>
          <p className="text-sm font-bold text-[hsl(var(--ig-foreground))]">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>
        </div>
        <div className="w-full flex-1">{children}</div>
      </div>
    </Reveal>
  );
}
