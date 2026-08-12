import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Legenda dos cards do Playground: título + meio, sempre no mesmo lugar
// (rodapé, com fio em cima), ancorando o card no mesmo sistema tipográfico
// do site.
export function ExperimentCaption({
  experiment,
  locale,
}: {
  experiment: Experiment;
  locale: Locale;
}) {
  return (
    <figcaption className="border-t border-line p-4">
      <span className="block font-medium">{experiment.title[locale]}</span>
      <span className="type-mono text-muted">{experiment.medium[locale]}</span>
    </figcaption>
  );
}
