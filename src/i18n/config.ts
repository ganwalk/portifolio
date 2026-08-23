export const locales = ["pt", "en", "es", "zh"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export const localeNames: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  zh: "中文",
};

// Sigla curta do seletor de idioma (ver LocaleSwitcher.tsx): "PT" sozinho lê
// como português de Portugal, não do Brasil. "BR" tira a ambiguidade sem
// precisar de "PT-BR" (a rota e o slug continuam "pt", só a sigla visível
// muda).
export const localeCodes: Record<Locale, string> = {
  pt: "BR",
  en: "EN",
  es: "ES",
  zh: "ZH",
};

export const htmlLang: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
  zh: "zh-CN",
};

// Formato underscore do Open Graph (og:locale), diferente do BCP47 de
// htmlLang. en/es não miram uma região específica, então usam a variante mais
// comum (US/ES) só para preencher a tag, sem afetar o conteúdo servido.
export const ogLocale: Record<Locale, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
  zh: "zh_CN",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
