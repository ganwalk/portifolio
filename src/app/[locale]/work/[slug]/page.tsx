import { notFound } from "next/navigation";
import { CaseDetail } from "@/components/sections/CaseDetail";
import { cases, getCase } from "@/data/cases";
import { locales, isLocale, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { localeAlternates } from "@/lib/hreflang";

// Cada case em rota própria: link direto para mandar a um recrutador,
// e uma página por idioma para o buscador entender.
// Estrutura de capa pronta; o corpo do case entra quando as mídias chegarem.
//
// O corpo mora em CaseDetail (client component: usa framer-motion e Reveal
// pra dar à página o mesmo tratamento em tela cheia do painel expandido da
// home, ExpandedCase, em vez de terminar num bloco de texto plano depois do
// clique animado que leva até aqui).

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
      languages: localeAlternates((loc) => `/${loc}/work/${slug}/`),
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
    <article>
      <CaseDetail caseStudy={caseStudy} locale={locale} dict={dict} />
    </article>
  );
}
