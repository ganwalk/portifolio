import type { MetadataRoute } from "next";
import { cases } from "@/data/cases";
import { locales, defaultLocale } from "@/i18n/config";
import { siteUrl } from "@/lib/site";

// Export estático (output: "export") exige isso explícito nesta versão do
// Next: sem ele o build falha, mesmo o arquivo não tendo nada de dinâmico.
export const dynamic = "force-static";

// Um bloco `alternates.languages` por URL, apontando pras outras duas
// versões de idioma da mesma página: é o que faz o hreflang do sitemap
// bater com o `alternates.languages` que cada página já declara no <head>
// (ver generateMetadata em layout.tsx e work/[slug]/page.tsx).
function languageAlternates(path: string) {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, `${siteUrl}/${locale}${path}`]),
    ["x-default", `${siteUrl}/${defaultLocale}${path}`],
  ]);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${siteUrl}/${locale}/`,
      changeFrequency: "monthly",
      priority: 1,
      alternates: { languages: languageAlternates("/") },
    });

    for (const caseStudy of cases) {
      entries.push({
        url: `${siteUrl}/${locale}/work/${caseStudy.slug}/`,
        changeFrequency: "monthly",
        priority: 0.7,
        alternates: {
          languages: languageAlternates(`/work/${caseStudy.slug}/`),
        },
      });
    }
  }

  return entries;
}
