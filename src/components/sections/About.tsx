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

      {/* Experiência: mesma caixa com linha fina que o menu overlay já usa
          (border-y na primeira, border-b nas demais), não uma abstração
          nova. As últimas entradas são fictícias (profile.ts, mock: true),
          só pra desenhar a timeline: o asterisco e o rodapé somem junto
          quando virarem histórico real. */}
      <Reveal delay={0.1} className="mt-16">
        <h3 className="type-mono mb-4 text-muted">
          {dict.boring.experienceTitle}
        </h3>
        <ul>
          {profile.experience.map((job, index) => (
            <li
              key={job.company}
              className={`flex flex-col gap-1 border-line py-6 sm:flex-row sm:items-baseline sm:gap-10 ${
                index === 0 ? "border-y" : "border-b"
              }`}
            >
              <span className="type-mono w-28 shrink-0 text-muted">
                {job.period[locale]}
              </span>
              <div>
                <p className="type-serif-display text-2xl sm:text-3xl">
                  {job.title}
                  {job.mock && <span aria-hidden> *</span>}
                </p>
                <p className="type-mono mt-1 text-muted">{job.company}</p>
              </div>
            </li>
          ))}
        </ul>
        {profile.experience.some((job) => job.mock) && (
          <p className="type-mono mt-6 text-muted">
            * {dict.about.experienceMockDisclaimer}
          </p>
        )}
      </Reveal>
    </section>
  );
}
