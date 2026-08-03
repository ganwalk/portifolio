import { ImageResponse } from "next/og";
import { OgCard, ogSize, ogContentType, loadOgAssets } from "@/lib/og-card";
import { isLocale, defaultLocale, type Locale } from "@/i18n/config";
import { cases, getCase } from "@/data/cases";
import { locales } from "@/i18n/config";
import { profile } from "@/data/profile";

export const alt = `${profile.name}, portfólio`;
export const size = ogSize;
export const contentType = ogContentType;
// Export estático exige isso explícito nesta versão do Next, mesmo sem nada
// de dinâmico no arquivo (ver mesmo comentário em app/robots.ts).
export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    cases.map((caseStudy) => ({ locale, slug: caseStudy.slug })),
  );
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const caseStudy = getCase(slug);
  const { fonts } = await loadOgAssets();

  return new ImageResponse(
    (
      // O cartão do case mostra o trabalho, não o retrato, então nada nele diz
      // de quem é o portfólio: a assinatura entra no rótulo, junto do ano.
      <OgCard
        eyebrow={caseStudy ? `${profile.name} · ${caseStudy.year}` : profile.role}
        title={caseStudy ? caseStudy.title[locale] : profile.name}
        footer={caseStudy ? caseStudy.tags[locale].join(" · ") : ""}
      />
    ),
    { ...ogSize, fonts },
  );
}
