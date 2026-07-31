import { Reveal } from "@/components/ui/Reveal";
import { InteractiveGridImage } from "@/components/ui/InteractiveGridImage";
import { KineticText } from "@/components/ui/KineticText";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Placeholder até a imagem definitiva chegar: mesma convenção de picsum.photos
// usada no resto do site (SiteMenu, cases, experiments) para mídia provisória.
const CONTACT_IMAGE = "https://picsum.photos/seed/contato-armando-grade/900/900";

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);

  return (
    <section id="contact" className="relative border-t border-line sm:flex">
      {/* No desktop a imagem ocupa a lateral inteira: vai até a borda
          direita da tela (sem o padding do gutter, que por isso não está no
          <section> e sim só na coluna de texto) e estica (align-items:
          stretch, o padrão do flex) até a altura natural da coluna de
          texto, que é quem manda no tamanho da seção. Chegou a usar
          min-h-svh (a seção inteira do tamanho da tela), mas isso deixava a
          dobra grande demais; sem esse mínimo, a seção só cresce até onde o
          conteúdo pede. No mobile ela ganha uma altura própria mais contida
          (aspect-ratio, não fração da tela) e continua de ponta a ponta na
          horizontal, sem virar um quadrado pequeno preso no meio da seção. */}
      <div className="gutter section-y sm:flex sm:w-1/2 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:py-0">
        <Reveal>
          <h2 className="type-serif-display mb-6 text-5xl sm:text-7xl">
            <KineticText text={dict.contact.title} />
          </h2>
          <p className="mb-4 text-muted">{dict.contact.subtitle}</p>
          <p className="type-mono mb-16 text-muted">
            {dict.hero.availability}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Sem quebra de linha em nenhuma largura: em vez de deixar o
              navegador decidir onde cortar (o que sempre parecia "email
              cortado"), o tamanho da fonte acompanha a largura da tela em
              vw, então a linha inteira sempre cabe, encolhendo ou crescendo
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
      </div>

      <Reveal delay={0.15} className="aspect-[4/3] sm:h-auto sm:flex-1">
        <InteractiveGridImage
          src={CONTACT_IMAGE}
          alt={dict.contact.imageAlt}
          className="h-full w-full border-t border-line sm:border-t-0 sm:border-l"
        />
      </Reveal>
    </section>
  );
}
