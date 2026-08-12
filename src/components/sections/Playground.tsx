import { ExperimentCard } from "@/components/ui/ExperimentCard";
import { Reveal } from "@/components/ui/Reveal";
import { SkeuoExperimentCard } from "@/components/ui/skeuo/SkeuoExperimentCard";
import { experiments } from "@/data/experiments";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Bloco "Extras": vitrines visuais das habilidades paralelas
// (colagem, animação, produção musical). A mídia carrega a seção; o texto é
// só a legenda de galeria. Cartões com peso de papel que sobem em cascata.
//
// A PARTIR do lg: (1024px), a vitrine plana vira objeto: caixa de vinis,
// tevê vintage, deck de fita (ver components/ui/skeuo), um por experimento,
// escolhido pelos mesmos campos que já decidem o comportamento do
// ExperimentCard (ver o dispatcher em SkeuoExperimentCard). Abaixo do lg:,
// os cards continuam simples: a interação de arrastar/girar pede mouse fino
// e espaço de sobra, nenhum dos dois garantido em tela pequena. Duas grades
// no DOM (uma `lg:hidden`, outra `hidden lg:grid`) em vez de uma condição
// controlada por `useMediaQuery`: sem media query em JS, sem hidratação
// dependente de matchMedia, só CSS decidindo qual das duas existe na tela.
export function Playground({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section id="playground" className="gutter section-y-tight border-t border-line">
      <Reveal>
        <h2 className="type-mono mb-2">{dict.playground.title}</h2>
        <p className="mb-16 max-w-lg text-muted">{dict.playground.subtitle}</p>
      </Reveal>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 lg:hidden">
        {experiments.map((experiment, index) => (
          <Reveal key={experiment.id} delay={index * 0.1}>
            <ExperimentCard experiment={experiment} locale={locale} />
          </Reveal>
        ))}
      </div>

      <div className="hidden grid-cols-3 gap-12 lg:grid">
        {experiments.map((experiment, index) => (
          <Reveal key={experiment.id} delay={index * 0.1}>
            <SkeuoExperimentCard experiment={experiment} locale={locale} dict={dict} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
