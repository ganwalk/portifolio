import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);

  return (
    <section id="contact" className="border-t border-line px-4 py-20 sm:px-8">
      <Reveal>
        <h2 className="type-serif-display mb-4 text-5xl sm:text-7xl">
          {dict.contact.title}
        </h2>
        <p className="mb-3 text-muted">{dict.contact.subtitle}</p>
        <p className="type-mono mb-10 text-muted">{dict.hero.availability}</p>
      </Reveal>

      <Reveal delay={0.1}>
        <a
          href={`mailto:${profile.email}`}
          className="type-display inline-block break-all text-2xl text-accent underline underline-offset-8 sm:text-4xl"
        >
          {profile.email}
        </a>
      </Reveal>

      {links.length > 0 && (
        <p className="type-mono mt-10">
          {links.map(([name, url], i) => (
            <span key={name}>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent"
              >
                {name}
              </a>
              {i < links.length - 1 && (
                <span aria-hidden className="mx-3 text-accent">
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
