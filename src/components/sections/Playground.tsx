import { ExperimentCard } from "@/components/ui/ExperimentCard";
import { Reveal } from "@/components/ui/Reveal";
import { experiments } from "@/data/experiments";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Bloco "Extras": vitrines visuais das habilidades paralelas
// (colagem, animação, produção musical). A mídia carrega a seção; o texto é
// só a legenda de galeria. Cartões com peso de papel que sobem em cascata.

export function Playground({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section id="playground" className="gutter section-y-tight border-t border-line">
      <Reveal>
        <h2 className="type-mono mb-2">{dict.playground.title}</h2>
        <p className="mb-16 max-w-lg text-muted">{dict.playground.subtitle}</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:gap-12">
        {experiments.map((experiment, index) => (
          <Reveal key={experiment.id} delay={index * 0.1}>
            <ExperimentCard experiment={experiment} locale={locale} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
