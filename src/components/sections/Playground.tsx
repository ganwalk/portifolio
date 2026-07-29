import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { experiments } from "@/data/experiments";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Bloco "Fora do expediente": vitrines visuais das habilidades paralelas
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
    <section id="playground" className="border-t border-line px-4 py-20 sm:px-8">
      <Reveal>
        <h2 className="type-mono mb-2 text-accent">{dict.playground.title}</h2>
        <p className="mb-12 max-w-lg text-muted">{dict.playground.subtitle}</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {experiments.map((experiment, index) => (
          <Reveal key={experiment.id} delay={index * 0.1}>
            <figure className="card-tactile group rounded-lg border border-line bg-background">
              <div className="aspect-square overflow-hidden rounded-t-lg bg-surface">
                <MediaView
                  media={experiment.media}
                  locale={locale}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
              </div>
              <figcaption className="border-t border-line p-4">
                <span className="block font-medium">
                  {experiment.title[locale]}
                </span>
                <span className="type-mono text-muted">
                  {experiment.medium[locale]}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
