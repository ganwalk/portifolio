import { cases } from "@/data/cases";
import { profile } from "@/data/profile";
import { localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// A Visão Boring: single page utilitária em alto contraste, estruturada como
// tabela/timeline para leitura dinâmica, e que, impressa (Ctrl/Cmd+P),
// vira um currículo com links funcionais e hierarquia limpa.

export function BoringView({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const areaLabel: Record<string, string> = {
    banking: "Banking",
    music: locale === "pt" ? "Música" : locale === "es" ? "Música" : "Music",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
      {/* Cabeçalho = cabeçalho do currículo */}
      <header className="mb-10 border-b-2 border-line pb-6">
        <h1 className="text-3xl font-bold">{profile.name}</h1>
        <p className="text-lg">{profile.role}</p>
        <p className="type-mono mt-2">
          <a href={`mailto:${profile.email}`} className="underline">
            {profile.email}
          </a>
          {" · "}
          {profile.location}
        </p>
      </header>

      {/* Sobre: o id é o gancho que o SiteFrame usa, no mobile, pra saber
          quando revelar a assinatura no cabeçalho (ver SiteFrame.tsx). */}
      <section id="about" className="mb-10">
        <h2 className="type-mono mb-3 font-bold">{dict.about.title}</h2>
        <div className="space-y-3 text-sm leading-relaxed">
          {dict.about.bio.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </section>

      {/* Experiência */}
      <section className="mb-10">
        <h2 className="type-mono mb-3 font-bold">
          {dict.boring.experienceTitle}
        </h2>
        {profile.experience.map((job) => (
          <div key={job.company} className="text-sm">
            <p className="font-bold">
              {job.company}{" "}
              <span className="font-normal text-muted">({job.period})</span>
            </p>
            <p>{job.role[locale]}</p>
          </div>
        ))}
      </section>

      {/* Projetos em tabela utilitária */}
      <section className="mb-10">
        <h2 className="type-mono mb-3 font-bold">
          {dict.boring.projectsTitle}
        </h2>
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-line">
              <th className="py-2 pr-4">{dict.boring.tableHeaders.project}</th>
              <th className="py-2 pr-4">{dict.boring.tableHeaders.area}</th>
              <th className="py-2">{dict.boring.tableHeaders.result}</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((caseStudy) => (
              <tr key={caseStudy.slug} className="border-b border-line align-top">
                <td className="py-2 pr-4 font-bold">{caseStudy.title[locale]}</td>
                <td className="py-2 pr-4">{areaLabel[caseStudy.area]}</td>
                <td className="py-2">
                  {caseStudy.statement.headline[locale]} {caseStudy.statement.detail[locale]}
                  <span className="block text-muted">
                    {caseStudy.metrics
                      .map((m) => `${m.value} ${m.label[locale]}`)
                      .join(" · ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cases.some((c) => c.metrics.some((m) => m.illustrative)) && (
          <p className="type-mono mt-2 text-muted">
            * {dict.cases.metricsDisclaimer}
          </p>
        )}
      </section>

      {/* Habilidades e idiomas */}
      <section className="mb-10 grid grid-cols-1 gap-8 text-sm sm:grid-cols-2">
        <div>
          <h2 className="type-mono mb-3 font-bold">{dict.about.skillsTitle}</h2>
          <p>
            {[
              ...profile.skills.core,
              ...profile.skills.tools,
              ...profile.skills.secondary,
            ]
              .map((skill) => skill[locale])
              .join(" · ")}
          </p>
        </div>
        <div>
          <h2 className="type-mono mb-3 font-bold">
            {dict.about.languagesTitle}
          </h2>
          <ul>
            {profile.languages.map((language) => (
              <li key={language.code}>
                {localeNames[language.code as Locale] ?? language.code} ·{" "}
                {language.level[locale]}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <p className="type-mono no-print text-muted">{dict.boring.printHint}</p>
    </div>
  );
}
