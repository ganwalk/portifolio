import { Fragment } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { profile } from "@/data/profile";
import { localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

export function About({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const allSkills = [
    ...profile.skills.core,
    ...profile.skills.tools,
    ...profile.skills.secondary,
  ];

  return (
    <section id="about" className="gutter section-y border-t border-line">
      <Reveal>
        <h2 className="type-mono mb-16">{dict.about.title}</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        <Reveal className="space-y-7 text-lg leading-relaxed">
          {dict.about.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </Reveal>

        <Reveal delay={0.15} className="space-y-14">
          <div>
            <h3 className="type-mono mb-4 text-muted">
              {dict.about.skillsTitle}
            </h3>
            {/* Cada habilidade em inline-block: sem isso, "skill•skill" vira
                um token inquebrável e estoura a largura no mobile. */}
            <p className="leading-loose">
              {allSkills.map((skill, i) => (
                <Fragment key={skill}>
                  <span className="inline-block">{skill}</span>
                  {i < allSkills.length - 1 && (
                    <span aria-hidden className="mx-2 inline-block text-muted">
                      •
                    </span>
                  )}
                </Fragment>
              ))}
            </p>
          </div>

          <div>
            <h3 className="type-mono mb-4 text-muted">
              {dict.about.languagesTitle}
            </h3>
            <ul className="space-y-1">
              {profile.languages.map((language) => (
                <li key={language.code}>
                  {localeNames[language.code as Locale] ?? language.code} ·{" "}
                  <span className="text-muted">{language.level[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
