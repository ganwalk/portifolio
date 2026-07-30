import { Reveal } from "@/components/ui/Reveal";
import { InteractiveGridImage } from "@/components/ui/InteractiveGridImage";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Placeholder até a imagem definitiva chegar: mesma convenção de picsum.photos
// usada no resto do site (SiteMenu, cases, experiments) para mídia provisória.
const CONTACT_IMAGE = "https://picsum.photos/seed/contato-armando-grade/900/900";

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);

  return (
    <section id="contact" className="gutter section-y border-t border-line">
      {/* Duas colunas no desktop: texto à esquerda, como sempre foi, e a
          imagem interativa preenchendo o vazio que sobrava à direita. No
          mobile empilha na ordem do DOM, texto primeiro, sem precisar de
          nenhuma classe de ordem: a imagem já nasce depois do texto. */}
      <div className="grid grid-cols-1 items-center gap-16 sm:grid-cols-2 sm:gap-12">
        <div>
          <Reveal>
            <h2 className="type-serif-display mb-6 text-5xl sm:text-7xl">
              {dict.contact.title}
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
                vw, então a linha inteira sempre cabe, encolhendo ou
                crescendo junto com a viewport. */}
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

        <Reveal delay={0.15}>
          <InteractiveGridImage
            src={CONTACT_IMAGE}
            alt={dict.contact.imageAlt}
            className="aspect-square w-full max-w-sm border border-line sm:max-w-md"
          />
        </Reveal>
      </div>
    </section>
  );
}
