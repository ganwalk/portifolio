import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Linha de métricas de um case: reaproveitada pela página dedicada
// (/work/[slug]) e pelo overlay expandido do carrossel na home, pra não
// duplicar o mesmo bloco duas vezes.

export function CaseMetrics({
  caseStudy,
  locale,
  compact = false,
  className = "",
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  /** Versão reduzida, usada na coluna de descrição da página dedicada
   *  (/work/[slug]): métricas menores pra não deixar aquela coluna bem
   *  mais alta que a do título ao lado. */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-wrap ${compact ? "gap-x-10 gap-y-5" : "gap-x-20 gap-y-10"} ${className}`}
    >
      {caseStudy.metrics.map((metric) => (
        <div key={metric.label[locale]}>
          <span
            className={`type-serif-display block ${compact ? "text-4xl sm:text-5xl" : "text-7xl sm:text-8xl"}`}
          >
            {metric.value}
          </span>
          <span className="type-mono text-muted">
            {metric.label[locale]}
            {metric.illustrative && " *"}
          </span>
        </div>
      ))}
    </div>
  );
}
