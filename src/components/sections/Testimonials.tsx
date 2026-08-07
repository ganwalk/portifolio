import { Reveal } from "@/components/ui/Reveal";
import { testimonials } from "@/data/testimonials";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Depoimentos ainda fictícios (src/data/testimonials.ts), só pra desenhar o
// bloco: nomes, cargos e as duas "empresas" mock não existem. O disclaimer
// no rodapé segue o mesmo `mock` por item que a experiência de About.tsx já
// usa (e o mesmo critério do metricsDisclaimer dos cases): some sozinho
// assim que todo mundo aqui virar gente real e autorizada.
//
// Selo com as iniciais em vez de foto: nenhuma das pessoas é real, e uma
// foto de banco de imagens ao lado de um nome inventado seria mais enganoso
// que uma iniciais tipográfica, que também combina com o resto do site
// (sempre quadrado, sem arredondamento, nenhuma mídia decorativa fora do
// que é mostrado como trabalho de verdade).
function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function Testimonials({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <section
      id="testimonials"
      className="gutter section-y border-t border-line"
    >
      <Reveal>
        <h2 className="type-mono mb-16">{dict.testimonials.title}</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
        {testimonials.map((testimonial, index) => (
          <Reveal
            key={testimonial.id}
            delay={index * 0.1}
            className="flex h-full flex-col border border-line p-6"
          >
            <p className="type-serif-display flex-1 text-xl leading-snug sm:text-2xl">
              “{testimonial.quote[locale]}”
            </p>
            <div className="mt-8 flex items-center gap-3">
              <span
                aria-hidden
                className="type-mono flex h-10 w-10 shrink-0 items-center justify-center border border-line text-muted"
              >
                {initials(testimonial.name)}
              </span>
              <div>
                <p className="font-medium">{testimonial.name}</p>
                <p className="type-mono text-muted">
                  {testimonial.role[locale]}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      {testimonials.some((testimonial) => testimonial.mock) && (
        <p className="type-mono mt-10 text-muted">
          {dict.testimonials.disclaimer}
        </p>
      )}
    </section>
  );
}
