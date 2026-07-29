import type { Locale } from "../config";
import { pt, type Dictionary } from "./pt";
import { en } from "./en";
import { es } from "./es";

const dictionaries: Record<Locale, Dictionary> = { pt, en, es };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export type { Dictionary };
