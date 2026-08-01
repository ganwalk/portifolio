import type { Metadata } from "next";
import type { CSSProperties, ReactNode } from "react";
// Archivo com o eixo de largura (wdth), que é o que dá o ar de cartaz condensado.
import "@fontsource-variable/archivo/wdth.css";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource/ibm-plex-mono/400.css";
import "../../fonts/whyte-inktrap/whyte-inktrap.css";
import "../../fonts/array/array.css";
import "../globals.css";
import { Providers } from "@/components/providers/Providers";
import { BoringBootScript } from "@/components/providers/BoringBootScript";
import { ScrollRestorationScript } from "@/components/providers/ScrollRestorationScript";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { locales, htmlLang, isLocale, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Este é o root layout do site. Ele vive sob [locale] para que cada idioma
// gere um HTML com o atributo lang correto, coisa que um layout único acima
// não conseguiria fazer no export estático.

// Cursor personalizado (globals.css consome estas variáveis): o basePath do
// GitHub Pages não chega a url() dentro do CSS puro, então as URLs vêm por
// variável, montada aqui, onde a env var existe (mesmo motivo do
// --portrait-sm/--portrait-lg em SelfPortrait.tsx). Hotspot (os dois números
// depois da URL) é a ponta do dedo indicador em cada pose, calculado por
// scripts/build-cursors.mjs.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const cursorVars = {
  "--cursor-repouso": `url(${basePath}/cursor/repouso.webp) 2 3, auto`,
  "--cursor-hover": `url(${basePath}/cursor/hover.webp) 5 0, pointer`,
  "--cursor-clique": `url(${basePath}/cursor/clique.webp) 4 9, pointer`,
} as CSSProperties;

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
    <html lang={htmlLang[locale]} suppressHydrationWarning style={cursorVars}>
      <body>
        <BoringBootScript />
        <ScrollRestorationScript />
        <Providers>
          <SiteFrame locale={locale} dict={dict}>
            {children}
          </SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
