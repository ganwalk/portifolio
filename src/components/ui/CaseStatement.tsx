import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Statement de um case em duas colunas: o "grito" (headline, tipografia
// grande) à esquerda, mais estreita, e a elaboração (detail, tipografia
// bem menor) à direita, mais larga. Reaproveitada pela página dedicada
// (/work/[slug]) e pelo overlay expandido do carrossel na home, mesmo
// motivo de CaseMetrics: um bloco só, não duas cópias.
//
// Antes era uma frase só ("Título: elaboração completa"), toda no mesmo
// tamanho grande, comprimida numa coluna estreita (max-w-3xl): a
// elaboração, sempre mais longa que o grito, quebrava em várias linhas no
// MESMO peso tipográfico do título, lendo como um bloco grande demais e
// desequilibrado. Separar em duas colunas de peso diferente é o mesmo
// princípio que já rege o resto do site (índice pequeno + título grande
// nos cards, por exemplo): hierarquia por tamanho, não um parágrafo só do
// mesmo tamanho pra tudo. No mobile as duas empilham, título em cima.

export function CaseStatement({
  caseStudy,
  locale,
  className = "",
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 gap-x-16 gap-y-4 sm:grid-cols-[1fr_1.3fr] ${className}`}>
      <p className="type-serif-display text-3xl sm:text-5xl">
        {caseStudy.statement.headline[locale]}
      </p>
      <p className="text-lg text-muted sm:pt-2 sm:text-xl">
        {caseStudy.statement.detail[locale]}
      </p>
    </div>
  );
}
