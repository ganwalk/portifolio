import { TapeDeck } from "@/components/ui/skeuo/TapeDeck";
import { VintageTV } from "@/components/ui/skeuo/VintageTV";
import { VinylCrate } from "@/components/ui/skeuo/VinylCrate";
import type { Experiment } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Escolhe o objeto skeumórfico pelo mesmo critério de campos que
// ExperimentCard já usa pra escolher comportamento (ver o comentário lá):
// `gallery` vira a caixa de vinis, `process` vira a tevê vintage, e quem não
// tem nenhum dos dois (só um vídeo, hoje só o de produção musical) vira a
// deck de fita. Um experimento novo sem `gallery` nem `process` cai na deck
// por padrão, então esse objeto continua sendo o "genérico" da família.
export function SkeuoExperimentCard({
  experiment,
  locale,
  dict,
}: {
  experiment: Experiment;
  locale: Locale;
  dict: Dictionary;
}) {
  if (experiment.gallery && experiment.gallery.length > 0) {
    return <VinylCrate experiment={experiment} locale={locale} dict={dict} />;
  }
  if (experiment.process && experiment.process.length > 0) {
    return <VintageTV experiment={experiment} locale={locale} dict={dict} />;
  }
  return <TapeDeck experiment={experiment} locale={locale} dict={dict} />;
}
