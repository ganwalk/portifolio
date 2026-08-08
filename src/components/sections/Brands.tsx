import { Marquee } from "@/components/ui/Marquee";
import { Reveal } from "@/components/ui/Reveal";
import { brands } from "@/data/brands";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Dobra fina, só uma linha de altura: uma régua de crédito entre o trabalho
// (CasesGrid) e a pessoa por trás dele (About), no mesmo espírito do selo
// "ver caso" que já roda em letreiro contínuo em CasesGrid (ver
// ui/Marquee.tsx). Marcas com logo de verdade (ver `logo` em
// data/brands.ts) mostram a logo, já convertida pro preto e branco do site
// (scripts/build-brand-logos.mjs); as sem logo (placeholders explícitos)
// mostram só o nome em texto. dark:invert nas logos: são PNGs/SVGs
// rasterizados com o preto já fixo no pixel, não currentColor, então não
// acompanhariam sozinhas a troca de tema como o resto do site acompanha;
// a mesma lógica já usada no retrato da hero dentro da lente
// (.lens-invert), aqui aplicada por marca. "Sua marca" por último: uma
// caixa pontilhada em vez de nome sólido, o convite explícito de que a
// lista está aberta.
export function Brands({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <section
      aria-label={dict.brands.title}
      className="border-t border-line py-8 sm:py-10"
    >
      <Reveal>
        <p className="gutter type-mono mb-6 text-muted">{dict.brands.title}</p>
      </Reveal>

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
                  className="mx-6 h-8 w-auto object-contain sm:mx-8 sm:h-10 dark:invert"
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
    </section>
  );
}
