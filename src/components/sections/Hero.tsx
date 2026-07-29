import { Marquee } from "@/components/ui/Marquee";
import type { Dictionary } from "@/i18n/dictionaries";

// Hero da Visão Criativa: manchete display gigante quebrada em linhas,
// legenda mono de "extrato" e o letreiro contínuo de habilidades.
// Os recortes de colagem que "vazam" do grid entram aqui quando as mídias chegarem.

export function Hero({ dict }: { dict: Dictionary }) {
  return (
    <section className="texture-noise flex min-h-[80svh] flex-col justify-between">
      <div className="flex flex-1 flex-col justify-center px-4 py-16 sm:px-8">
        <p className="type-mono mb-6 text-accent">{dict.hero.role}</p>
        <h1 className="type-display text-[16vw] sm:text-[11vw]">
          {dict.hero.headline.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted sm:text-xl">
          {dict.hero.tagline}
        </p>
        <p className="type-mono mt-6 text-muted">{dict.hero.availability}</p>
      </div>
      <Marquee items={dict.hero.marquee} className="type-mono py-3" />
    </section>
  );
}
