import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Linha de métricas de um case: reaproveitada pela página dedicada
// (/work/[slug]) e pelo overlay expandido do carrossel na home, pra não
// duplicar o mesmo bloco duas vezes.

export function CaseMetrics({
  caseStudy,
  locale,
  className = "",
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap gap-x-20 gap-y-10 ${className}`}>
      {caseStudy.metrics.map((metric) => (
        <div key={metric.label[locale]}>
          <span className="type-serif-display block text-7xl sm:text-8xl">
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
