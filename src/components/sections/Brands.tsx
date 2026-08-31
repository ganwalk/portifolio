import { Marquee } from "@/components/ui/Marquee";
import { brands } from "@/data/brands";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Linha de crédito fina, não mais uma dobra própria: mora dentro de About,
// logo abaixo da bio e das habilidades (ver About.tsx), como um fechamento
// da seção "quem sou eu" em vez de uma régua solta entre o trabalho
// (CasesGrid) e a pessoa por trás dele. O rótulo aqui é um <h3>, não um <p>
// solto: mesma marcação que já organiza "Habilidades" e "Idiomas" ao lado,
// então os leitores de tela encontram os três no mesmo nível da árvore de
// cabeçalhos, dentro do <h2> "Sobre" que os une.
//
// Marcas com logo de verdade (ver `logo` em data/brands.ts) mostram a logo,
// já convertida pro preto e branco do site (scripts/build-brand-logos.mjs),
// com dark:invert: são PNGs/SVGs rasterizados com o preto já fixo no
// pixel, não currentColor, então não acompanhariam sozinhas a troca de
// tema como o resto do site acompanha; a mesma lógica já usada no retrato
// da hero dentro da lente (.lens-invert), aqui aplicada por marca. "Sua
// marca" por último: uma caixa pontilhada em vez de nome sólido, o
// convite explícito de que a lista está aberta. O fallback em serifa (sem
// `logo` nem `isInvite`) cobre só um cliente real ainda sem arquivo de
// logo processado, nunca uma marca inventada.
export function Brands({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <div>
      <h3 className="type-mono mb-4 text-muted">{dict.brands.title}</h3>

      <Marquee durationSeconds={32}>
        <ul className="flex items-center">
          {brands.map((brand, index) => (
            <li key={index} className="flex shrink-0 items-center">
              {brand.isInvite ? (
                <span className="type-mono mx-6 whitespace-nowrap border border-dashed border-line px-4 py-1.5 text-muted sm:mx-8">
                  {brand.name[locale]}
                </span>
              ) : brand.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logo}
                  alt={brand.name[locale]}
                  className={`mx-6 w-auto object-contain sm:mx-8 dark:invert ${
                    brand.large ? "h-12 sm:h-14" : "h-8 sm:h-10"
                  }`}
                />
              ) : (
                <span className="type-serif-display mx-6 whitespace-nowrap text-2xl sm:mx-8 sm:text-3xl">
                  {brand.name[locale]}
                </span>
              )}
              <span aria-hidden className="text-muted">
                ·
              </span>
            </li>
          ))}
        </ul>
      </Marquee>
    </div>
  );
}
