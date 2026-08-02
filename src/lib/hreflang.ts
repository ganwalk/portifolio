import { locales, defaultLocale, type Locale } from "@/i18n/config";

// Gera o mapa de hreflang (alternates.languages) a partir de `locales`, não
// escrito à mão: era assim que layout.tsx, work/[slug]/page.tsx e
// sitemap.ts faziam antes, e cada um esquecia de adicionar o "zh" na hora de
// criar esse locale (o TS não pega, alternates.languages não é tipado
// contra Locale). Um locale novo agora só precisa existir em `locales`.
export function localeAlternates(
  pathFor: (locale: Locale) => string,
): Record<string, string> {
  return Object.fromEntries([
    ...locales.map((locale) => [locale, pathFor(locale)] as const),
    ["x-default", pathFor(defaultLocale)] as const,
  ]);
}
