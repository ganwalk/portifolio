import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Legenda dos objetos skeumórficos (ver VinylCrate.tsx, VintageTV.tsx,
// Radio.tsx): texto solto, sem fio nem caixa por baixo, diferente da
// legenda do ExperimentCard (ver ExperimentCaption.tsx). O objeto aqui É o
// card, não um retrato dentro de uma moldura, então a legenda também não
// ganha moldura própria.
export function SkeuoCaption({
  experiment,
  locale,
}: {
  experiment: Experiment;
  locale: Locale;
}) {
  return (
    <p className="mt-5 text-center">
      <span className="block font-medium">{experiment.title[locale]}</span>
      <span className="type-mono text-muted">{experiment.medium[locale]}</span>
    </p>
  );
}
