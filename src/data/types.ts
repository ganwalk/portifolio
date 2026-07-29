import type { Locale } from "@/i18n/config";

/** Texto localizado, todo conteúdo visível ao visitante existe nos três idiomas. */
export type Localized<T = string> = Record<Locale, T>;

export type CaseArea = "banking" | "music";

export interface CaseMetric {
  /** Valor exibido em número gigante na capa. "+XX%" enquanto o número real não é calibrado. */
  value: string;
  label: Localized;
  /** true enquanto o valor for placeholder/ilustrativo, exibe o disclaimer no case. */
  illustrative: boolean;
}

export interface CaseStudy {
  slug: string;
  area: CaseArea;
  title: Localized;
  /** Uma frase de resultado, em primeira pessoa, o "grito" da capa. */
  statement: Localized;
  tags: Localized<readonly string[]>;
  metrics: CaseMetric[];
  /** Case ainda sem página completa publicada. */
  comingSoon: boolean;
  year: string;
}

export interface Experiment {
  id: string;
  title: Localized;
  medium: Localized;
}
