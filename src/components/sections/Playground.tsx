import { experiments } from "@/data/experiments";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Bloco compacto "Fora do expediente", híbrido enxuto: as habilidades
// secundárias vivem como prova no próprio site (som, colagem, animação),
// e aqui ganham 3 a 4 vitrines selecionadas. Placeholders até as mídias chegarem.

export function Playground({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section className="border-t border-line px-4 py-20 sm:px-8">
      <h2 className="type-mono mb-2 text-accent">{dict.playground.title}</h2>
      <p className="mb-12 max-w-lg text-muted">{dict.playground.subtitle}</p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {experiments.map((experiment) => (
          <figure key={experiment.id} className="border border-line">
            {/* Placeholder de mídia, proporção reservada para colagem/vídeo/áudio */}
            <div className="texture-noise aspect-square bg-surface" />
            <figcaption className="border-t border-line p-4">
              <span className="block font-medium">
                {experiment.title[locale]}
              </span>
              <span className="type-mono text-muted">
                {experiment.medium[locale]}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
