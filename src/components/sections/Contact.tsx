import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);
  // break-all quebrava em qualquer caractere, sem dó: "gmail.com" virava
  // "GMA" numa linha e "IL.COM" na outra. Com o @ como único ponto de quebra
  // sugerido (wbr) e break-words como rede de segurança, o navegador só
  // quebra ali, e cada metade ("armandocustodio0@" e "gmail.com") cabe
  // inteira numa linha em qualquer largura de tela razoável.
  const [emailUser, emailDomain] = profile.email.split("@");

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
        <a
          href={`mailto:${profile.email}`}
          className="type-display inline-block break-words text-2xl underline underline-offset-8 sm:text-4xl"
        >
          {emailUser}@<wbr />
          {emailDomain}
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
