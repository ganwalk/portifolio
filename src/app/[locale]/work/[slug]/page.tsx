import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaView } from "@/components/ui/MediaView";
import { cases, getCase } from "@/data/cases";
import { locales, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Cada case em rota própria: link direto para mandar a um recrutador,
// e uma página por idioma para o buscador entender.
// Estrutura de capa pronta; o corpo do case entra quando as mídias chegarem.

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    cases.map((caseStudy) => ({ locale, slug: caseStudy.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "pt";
  const caseStudy = getCase(slug);

  return {
    title: caseStudy
      ? `${caseStudy.title[locale]} · Armando Custodio`
      : "Armando Custodio",
    description: caseStudy?.statement[locale],
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : "pt";
  const dict = getDictionary(locale);
  const caseStudy = getCase(slug);

  if (!caseStudy) notFound();

  return (
    <article className="px-4 py-16 sm:px-8">
      <Link href={`/${locale}/`} className="type-mono text-accent">
        ← {dict.nav.work}
      </Link>

      <header className="texture-noise mt-10 border-b border-line pb-12">
        <p className="type-mono mb-6 text-muted">
          {caseStudy.title[locale]} · {caseStudy.year}
        </p>

        <h1 className="type-serif-display max-w-4xl text-4xl sm:text-6xl">
          {caseStudy.statement[locale]}
        </h1>

        <div className="mt-12 flex flex-wrap gap-x-16 gap-y-8">
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

        <p className="type-mono mt-10 text-muted">
          {caseStudy.tags[locale].join(" • ")}
        </p>
      </header>

      {/* Corpo do case: a capa já é real; os apoios ficam de placeholder até
          os recortes serem fornecidos. */}
      <div className="mt-12 space-y-6">
        <MediaView
          media={caseStudy.cover}
          locale={locale}
          className="aspect-video w-full object-cover"
        />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="texture-noise aspect-4/3 bg-surface" />
          <div className="texture-noise aspect-4/3 bg-surface" />
        </div>
      </div>

      {caseStudy.metrics.some((m) => m.illustrative) && (
        <p className="type-mono mt-8 text-muted">
          * {dict.cases.metricsDisclaimer}
        </p>
      )}
    </article>
  );
}
