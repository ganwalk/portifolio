import Link from "next/link";
import { cases } from "@/data/cases";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Grid de cases: a capa "grita" o resultado, métrica em serif gigante,
// statement em primeira pessoa, tags separadas por bullets.
// Placeholders de mídia entram nos cartões quando os recortes forem fornecidos.

export function CasesGrid({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const hasIllustrative = cases.some((c) =>
    c.metrics.some((m) => m.illustrative),
  );

  return (
    <section id="work" className="border-t border-line px-4 py-20 sm:px-8">
      <h2 className="type-mono mb-12 text-accent">{dict.cases.title}</h2>

      <div className="grid grid-cols-1 gap-px bg-line md:grid-cols-2">
        {cases.map((caseStudy) => (
          <Link
            key={caseStudy.slug}
            href={`/${locale}/work/${caseStudy.slug}/`}
            className="group flex flex-col justify-between gap-10 bg-background p-6 transition-colors hover:bg-surface sm:p-10"
          >
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2">
              {caseStudy.metrics.map((metric) => (
                <div key={metric.label[locale]}>
                  <span className="type-serif-display block text-6xl sm:text-7xl">
                    {metric.value}
                  </span>
                  <span className="type-mono text-muted">
                    {metric.label[locale]}
                  </span>
                </div>
              ))}
            </div>

            <div>
              <h3 className="type-serif-display mb-3 text-2xl sm:text-3xl">
                {caseStudy.statement[locale]}
              </h3>
              <p className="type-mono text-muted">
                {caseStudy.title[locale]} · {caseStudy.year}
              </p>
              <p className="type-mono mt-2 text-muted">
                {caseStudy.tags[locale].join(" • ")}
              </p>
              <span className="type-mono mt-6 inline-block text-accent group-hover:underline">
                {caseStudy.comingSoon
                  ? dict.cases.comingSoon
                  : dict.cases.viewCase}{" "}
                →
              </span>
            </div>
          </Link>
        ))}
      </div>

      {hasIllustrative && (
        <p className="type-mono mt-4 text-muted">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </section>
  );
}
