import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);

  return (
    <section id="contact" className="gutter section-y border-t border-line">
      <Reveal>
        <h2 className="type-serif-display mb-6 text-5xl sm:text-7xl">
          {dict.contact.title}
        </h2>
        <p className="mb-4 text-muted">{dict.contact.subtitle}</p>
        <p className="type-mono mb-16 text-muted">{dict.hero.availability}</p>
      </Reveal>

      <Reveal delay={0.1}>
        {/* Sem quebra de linha em nenhuma largura: em vez de deixar o
            navegador decidir onde cortar (o que sempre parecia "email
            cortado"), o tamanho da fonte acompanha a largura da tela em vw,
            então a linha inteira sempre cabe, encolhendo ou crescendo
            junto com a viewport. */}
        <a
          href={`mailto:${profile.email}`}
          className="type-display inline-block whitespace-nowrap text-[4.5vw] underline underline-offset-8 sm:text-[3.4vw] lg:text-4xl"
        >
          {profile.email}
        </a>
      </Reveal>

      {links.length > 0 && (
        <p className="type-mono mt-16">
          {links.map(([name, url], i) => (
            <span key={name}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-foreground"
              >
                {name}
              </a>
              {i < links.length - 1 && (
                <span aria-hidden className="mx-3 text-muted">
                  •
                </span>
              )}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
