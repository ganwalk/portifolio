export const locales = ["pt", "en", "es"] as const;
// Espaço reservado para expansão futura (ex: "zh"), basta adicionar aqui e criar o dicionário.

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "pt";

export const localeNames: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
};

export const htmlLang: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en",
  es: "es",
};

// Formato underscore do Open Graph (og:locale), diferente do BCP47 de
// htmlLang. en/es não miram uma região específica, então usam a variante mais
// comum (US/ES) só para preencher a tag, sem afetar o conteúdo servido.
export const ogLocale: Record<Locale, string> = {
  pt: "pt_BR",
  en: "en_US",
  es: "es_ES",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
