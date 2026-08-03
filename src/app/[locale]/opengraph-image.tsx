import { ImageResponse } from "next/og";
import { OgCard, ogSize, ogContentType, loadOgAssets } from "@/lib/og-card";
import { locales, isLocale, defaultLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { profile } from "@/data/profile";

export const alt = `${profile.name}, ${profile.role}`;
export const size = ogSize;
export const contentType = ogContentType;
// Export estático exige isso explícito nesta versão do Next, mesmo sem nada
// de dinâmico no arquivo (ver mesmo comentário em app/robots.ts). O segmento
// dinâmico [locale] não herda generateStaticParams do layout/page vizinhos:
// cada arquivo especial precisa declarar o próprio.
export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : defaultLocale;
  const dict = getDictionary(locale);
  const { fonts, portrait } = await loadOgAssets();

  return new ImageResponse(
    (
      <OgCard
        eyebrow={profile.role}
        title={profile.name}
        footer={dict.hero.facts[0]}
        portrait={portrait}
      />
    ),
    { ...ogSize, fonts },
  );
}
