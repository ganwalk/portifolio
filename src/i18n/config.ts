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

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
