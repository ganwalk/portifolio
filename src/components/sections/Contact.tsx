import { Reveal } from "@/components/ui/Reveal";
import { InteractiveGridImage } from "@/components/ui/InteractiveGridImage";
import { profile } from "@/data/profile";
import { pt } from "@/i18n/dictionaries/pt";
import { en } from "@/i18n/dictionaries/en";
import { es } from "@/i18n/dictionaries/es";
import { zh } from "@/i18n/dictionaries/zh";
import type { Dictionary } from "@/i18n/dictionaries";

// basePath não é aplicado a src montado à mão em JS (só a next/image e
// links internos do próprio Next): o mesmo motivo do --portrait-lg em
// SelfPortrait.tsx.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CONTACT_IMAGE = `${basePath}/photos/armando-contato.webp`;

// Além dos quatro idiomas do site, mais oito só pra esta grade: o recado é
// "disponível pro mundo todo" (mesmo espírito do globo em hero.availability),
// então outros alfabetos são bem-vindos aqui mesmo sem página traduzida
// pra eles. Não é o sistema de i18n do site (por isso mora aqui, não em
// dictionaries/): é tempero visual, sem rota, sem SEO, sem menu próprio.
const EXTRA_GRID_PHRASES = [
  ["Parle", "moi !"], // francês
  ["Sprich", "mit mir!"], // alemão
  ["Parla", "con me!"], // italiano
  ["話して", "ください"], // japonês
  ["나에게", "말해줘!"], // coreano
  ["Поговори", "со мной!"], // russo
  ["تحدث", "معي!"], // árabe
  ["मुझसे", "बात करो"], // hindi
];

// Um quadro por idioma na grade interativa, não repetindo o do visitante:
// o convite "fale comigo" aparece em vários idiomas ao mesmo tempo (ver
// InteractiveGridImage), começando pelos quatro do site.
const GRID_PHRASES = [
  pt.contact.gridWords,
  en.contact.gridWords,
  es.contact.gridWords,
  zh.contact.gridWords,
  ...EXTRA_GRID_PHRASES,
];

export function Contact({ dict }: { dict: Dictionary }) {
  const links = Object.entries(profile.links).filter(([, url]) => url);

  return (
    <section id="contact" className="relative border-t border-line sm:flex">
      {/* No desktop a imagem ocupa a lateral inteira: vai até a borda
          direita da tela (sem o padding do gutter, que por isso não está no
          <section> e sim só na coluna de texto) e estica (align-items:
          stretch, o padrão do flex) até a altura natural da coluna de
          texto, que é quem manda no tamanho da seção. Chegou a usar
          min-h-svh (a seção inteira do tamanho da tela), mas isso deixava a
          dobra grande demais; sem esse mínimo, a seção só cresce até onde o
          conteúdo pede. No mobile ela ganha uma altura própria mais contida
          (aspect-ratio, não fração da tela) e continua de ponta a ponta na
          horizontal, sem virar um quadrado pequeno preso no meio da seção. */}
      <div className="gutter section-y text-center sm:flex sm:w-1/2 sm:flex-shrink-0 sm:flex-col sm:justify-center sm:py-0 sm:text-left">
        <Reveal>
          <h2 className="type-serif-display type-inktrap mb-6 text-5xl sm:text-7xl">
            {dict.contact.title}
          </h2>
          {/* mb-10 no mobile: a linha de disponibilidade que ficava logo
              abaixo (ver comentário abaixo) levava o respiro até o email;
              sem ela ali, o subtítulo precisa desse respiro sozinho, senão
              o email nasce colado nele. Do sm: pra cima o respiro volta a
              vir da linha seguinte, como sempre foi. */}
          <p className="mb-10 text-muted sm:mb-4">{dict.contact.subtitle}</p>
          {/* Já mostrada na hero, com o mesmo texto: aqui era repetição pura
              e, no mobile, uma linha a mais entre o subtítulo e o email numa
              tela que já é curta. Fica só do sm: pra cima, onde sobra
              espaço e a coluna de texto tem folga de sobra pra repetir o
              recado sem pesar. */}
          <p className="type-mono mb-16 hidden text-muted sm:block">
            {dict.hero.availability}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Sem quebra de linha em nenhuma largura: em vez de deixar o
              navegador decidir onde cortar (o que sempre parecia "email
              cortado"), o tamanho da fonte acompanha a largura da tela em
              vw, então a linha inteira sempre cabe, encolhendo ou crescendo
              junto com a viewport. lg:text-4xl (tamanho fixo) sobrepunha a
              imagem interativa no notebook: a coluna de texto é só metade
              da tela (sm:w-1/2), então um tamanho fixo que não encolhe com
              a viewport cedo ou tarde estoura a própria coluna. 2.5vw
              continua a mesma lógica do resto da escala, só que também
              vale a partir do lg.

              sm/lg mais contidos que o resto da escala (2.1vw/1.8vw, não
              3.4vw/2.35vw): a coluna de texto é metade da viewport inteira,
              não da seção, então o e-mail em vw cheio cresce rápido demais e
              chega a cruzar a linha divisória perto da imagem em telas de
              tablet/notebook. Com valores menores sobra respiro visível até
              a borda da coluna em qualquer largura. */}
          <a
            href={`mailto:${profile.email}`}
            className="type-display inline-block whitespace-nowrap text-[4.5vw] underline underline-offset-8 sm:text-[2.1vw] lg:text-[1.8vw]"
          >
            {profile.email}
          </a>
        </Reveal>

        {links.length > 0 && (
          <p className="type-mono mt-16">
            {links.map(([name, url], i) => (
              <span key={name}>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition-colors hover:text-foreground"
                >
                  {name}
                </a>
                {i < links.length - 1 && (
                  <span aria-hidden className="mx-3 text-muted">
                    •
                  </span>
                )}
              </span>
            ))}
          </p>
        )}
      </div>

      <Reveal delay={0.15} className="aspect-[4/3] sm:h-auto sm:flex-1">
        <InteractiveGridImage
          src={CONTACT_IMAGE}
          alt={dict.contact.imageAlt}
          phrases={GRID_PHRASES}
          className="h-full w-full border-t border-line sm:border-t-0 sm:border-l"
        />
      </Reveal>
    </section>
  );
}
