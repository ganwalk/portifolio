import Link from "next/link";
import { notFound } from "next/navigation";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { cases, getCase } from "@/data/cases";
import { locales, isLocale, defaultLocale, type Locale } from "@/i18n/config";
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
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const caseStudy = getCase(slug);
  const path = `/${locale}/work/${slug}/`;

  if (!caseStudy) {
    return { title: "Armando Custodio" };
  }

  const title = `${caseStudy.title[locale]} · Armando Custodio`;
  const description = caseStudy.statement[locale];

  return {
    title,
    description,
    alternates: {
      canonical: path,
      languages: {
        pt: `/pt/work/${slug}/`,
        en: `/en/work/${slug}/`,
        es: `/es/work/${slug}/`,
        "x-default": `/pt/work/${slug}/`,
      },
    },
    openGraph: {
      title,
      description,
      url: path,
      type: "article",
    },
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
    <article className="gutter py-20 sm:py-28">
      <Link
        href={`/${locale}/`}
        className="type-mono text-muted transition-colors hover:text-foreground"
      >
        ← {dict.nav.work}
      </Link>

      <header className="texture-noise mt-14 border-b border-line pb-16">
        <p className="type-mono mb-6 text-muted">
          {caseStudy.title[locale]} · {caseStudy.year}
        </p>

        <h1 className="type-serif-display max-w-4xl text-4xl sm:text-6xl">
          {caseStudy.statement[locale]}
        </h1>

        <CaseMetrics caseStudy={caseStudy} locale={locale} className="mt-16" />

        <p className="type-mono mt-12 text-muted">
          {caseStudy.tags[locale].join(" • ")}
        </p>
      </header>

      {/* Corpo do case: a capa já é real; os apoios ficam de placeholder até
          os recortes serem fornecidos. */}
      <div className="mt-16 space-y-8">
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
