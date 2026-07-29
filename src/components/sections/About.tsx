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
    <section id="about" className="border-t border-line px-4 py-20 sm:px-8">
      <h2 className="type-mono mb-12 text-accent">{dict.about.title}</h2>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-6 text-lg leading-relaxed">
          {dict.about.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <div className="space-y-10">
          <div>
            <h3 className="type-mono mb-4 text-muted">
              {dict.about.skillsTitle}
            </h3>
            <p className="leading-loose">
              {allSkills.map((skill, i) => (
                <span key={skill}>
                  {skill}
                  {i < allSkills.length - 1 && (
                    <span aria-hidden className="mx-2 text-accent">
                      •
                    </span>
                  )}
                </span>
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
        </div>
      </div>
    </section>
  );
}
