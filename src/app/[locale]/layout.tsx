import type { Metadata } from "next";
import type { ReactNode } from "react";
// Archivo com o eixo de largura (wdth), que é o que dá o ar de cartaz condensado.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/fraunces";
import "@fontsource/ibm-plex-mono/400.css";
import "../globals.css";
import { Providers } from "@/components/providers/Providers";
import { BoringBootScript } from "@/components/providers/BoringBootScript";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { locales, htmlLang, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Este é o root layout do site. Ele vive sob [locale] para que cada idioma
// gere um HTML com o atributo lang correto, coisa que um layout único acima
// não conseguiria fazer no export estático.

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "pt");

  return {
    title: dict.meta.title,
    description: dict.meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale: Locale = isLocale(raw) ? raw : "pt";
  const dict = getDictionary(locale);

  return (
    <html lang={htmlLang[locale]} suppressHydrationWarning>
      <body>
        <BoringBootScript />
        <Providers>
          <SiteFrame locale={locale} dict={dict}>
            {children}
          </SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
