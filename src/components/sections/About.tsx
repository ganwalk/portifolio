import { useRef } from "react";
import { Brands } from "@/components/sections/Brands";
import { Reveal } from "@/components/ui/Reveal";
import { SkillsOrbit } from "@/components/ui/SkillsOrbit";
import { profile } from "@/data/profile";
import { localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Antes, a seção inteira (bio, skills, idiomas) subia junto num só Reveal:
// o único trecho do site sem nenhum movimento próprio, plano contra o resto
// da home (lente da hero, pilha do CasesGrid, cascata do Playground, grade
// do Contato). Duas mudanças, nenhuma delas cor nem ornamento novo, só
// movimento e estrutura, na mesma linguagem do resto da home:
//
// A bio sobe parágrafo por parágrafo, cada um com seu próprio atraso, em vez
// do bloco inteiro nascer junto.
//
// As habilidades trocam a linha corrida com bullet por uma corrente
// (SkillsOrbit): o gatilho é a dobra inteira, não só a área das tags, e cada
// tag só se solta do lugar quando o mouse passa perto da posição dela,
// entrando numa fila que pende do cursor. Quando a última entra na fila, uma
// frase aparece acima do mouse, no mesmo estilo de selo do "Case completo em
// breve" do CasesGrid.
//
// "Acreditam no meu trabalho" (Brands) fecha a dobra, abaixo da bio e das
// habilidades: já foi uma dobra própria, uma régua fina entre o trabalho
// (CasesGrid) e a pessoa por trás dele, mas fazia mais sentido como o
// último credencial de "quem sou eu" do que como uma seção à parte com
// título próprio. `border-t` aqui, não na seção inteira: fecha só esse
// bloco, o mesmo traço fino que separava as duas dobras antes.
export function About({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const sectionRef = useRef<HTMLElement>(null);
  const allSkills = [
    ...profile.skills.core,
    ...profile.skills.tools,
    ...profile.skills.secondary,
  ].map((skill) => skill[locale]);

  return (
    <section
      id="about"
      ref={sectionRef}
      className="gutter section-y border-t border-line"
    >
      <Reveal>
        <h2 className="type-mono mb-16">{dict.about.title}</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
        <div className="space-y-7 text-lg leading-relaxed">
          {dict.about.bio.map((paragraph, i) => (
            <Reveal key={paragraph.slice(0, 24)} delay={i * 0.12}>
              <p>{paragraph}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.15} className="space-y-14">
          <div>
            <h3 className="type-mono mb-4 text-muted">
              {dict.about.skillsTitle}
            </h3>
            <SkillsOrbit
              skills={allSkills}
              message={dict.about.skillsOrbitMessage}
              sectionRef={sectionRef}
            />
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

      <Reveal delay={0.2} className="mt-16 border-t border-line pt-10 sm:mt-20 sm:pt-12">
        <Brands locale={locale} dict={dict} />
      </Reveal>
    </section>
  );
}
