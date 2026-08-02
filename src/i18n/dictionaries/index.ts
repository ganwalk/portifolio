import type { Locale } from "../config";
import { pt, type Dictionary } from "./pt";
import { en } from "./en";
import { es } from "./es";
import { zh } from "./zh";

const dictionaries: Record<Locale, Dictionary> = { pt, en, es, zh };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
