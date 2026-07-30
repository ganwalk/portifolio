"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { SelfPortrait } from "@/components/ui/SelfPortrait";
import { SubtitleRoulette } from "@/components/ui/SubtitleRoulette";
import { profile } from "@/data/profile";
import type { Dictionary } from "@/i18n/dictionaries";

// Hero em preto e branco: o nome em display gigante, uma palavra por linha,
// alinhado à esquerda, o subtítulo em serif itálica logo abaixo (com a última
// palavra girando numa roleta sincronizada ao retrato) e o retrato animado em
// flipbook ao lado.
//
// A lente é uma inversão: dentro do círculo que segue o mouse, tinta e papel
// trocam de lugar. A revelação usa máscara radial de borda suave, não recorte
// duro, então o círculo é difuso nas beiradas. Perto do CTA o raio encolhe,
// cedendo o palco ao clique. Em telas de toque nada disso roda: sem mousemove,
// o raio fica em zero.

const LENS_MAX = 210;
const LENS_MIN = 40;

function HeroContent({
  dict,
  mirrored,
  ctaRef,
}: {
  dict: Dictionary;
  /** Cópia dentro da lente: entra pronta, sem repetir a animação de entrada. */
  mirrored?: boolean;
  ctaRef?: React.RefObject<HTMLAnchorElement | null>;
}) {
  const reveal = (index: number): object =>
    mirrored
      ? {}
      : {
          initial: { y: 40, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          transition: {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            delay: 0.35 + index * 0.12,
          },
        };

  const words = profile.name.split(" ");

  // No mobile a frase quebra entre "no" e "mundo", não onde o navegador
  // preferir: um <br> visível só abaixo de sm força esse ponto específico,
  // e escondido dali pra cima (onde a frase cabe numa linha, empilhada ou
  // ao lado do retrato) não deixa rastro. Procura "no mundo" já com o "no"
  // dentro do primeiro pedaço; nos outros idiomas, que não têm essa
  // sequência, o índice não bate e a frase inteira cai no primeiro pedaço,
  // sem quebra nenhuma (mesmo comportamento de antes).
  const breakMarker = "no mundo";
  const breakIndex = dict.hero.availability.indexOf(breakMarker);
  const availabilityBefore =
    breakIndex === -1
      ? dict.hero.availability
      : dict.hero.availability.slice(0, breakIndex + 2);
  const availabilityAfter =
    breakIndex === -1 ? "" : dict.hero.availability.slice(breakIndex + 3);

  // flex-1, e não h-full: altura percentual não resolve contra um pai que só
  // ganha altura por flex-grow, e o justify-between viraria letra morta.
  //
  // No mobile o retrato deixa de ser posicionado em absoluto e passa a ser um
  // terceiro item do flex (via order), entre o bloco de título e o de CTA: o
  // justify-between do contêiner então reparte o espaço entre os três, e o
  // retrato nunca mais sobrepõe o botão nem o subtítulo, porque participa da
  // mesma conta de altura. No desktop ele volta a ser absoluto, à direita,
  // porque lá sobra espaço ao lado da manchete e não precisa disputar altura
  // com mais nada.
  // pt-16 no mobile: a segunda linha do cabeçalho (o botão do Modo Boring)
  // fica sempre visível, até antes de rolar (veja SiteFrame), então a hero
  // precisa reservar espaço pra ela por baixo, senão "ARMANDO CUSTODIO"
  // nasce atrás da tarja.
  return (
    <div className="gutter relative flex flex-1 flex-col items-center justify-between pb-14 pt-16 sm:items-stretch sm:pt-32">
      <div className="order-1 text-center sm:text-left">
        <h1 className="type-display text-[17vw] leading-[0.84] sm:text-[12vw]">
          {words.map((word, index) => (
            <span key={word} className="block overflow-hidden">
              <motion.span
                className="block"
                initial={mirrored ? undefined : { y: "108%" }}
                animate={mirrored ? undefined : { y: 0 }}
                transition={
                  mirrored
                    ? undefined
                    : {
                        duration: 0.95,
                        ease: [0.16, 1, 0.3, 1],
                        delay: 0.1 + index * 0.13,
                      }
                }
              >
                {word}
              </motion.span>
            </span>
          ))}
        </h1>
        {/* No mobile a palavra da roleta desce pra linha de baixo: dividir
            "Designer de" e a palavra em duas linhas deixa cada uma centrar
            pela própria largura (flex-col + items-center), em vez de
            depender do texto inteiro caber numa linha só pra centralizar
            direito. No desktop (sm:block) volta a ser texto corrido numa
            linha, como sempre foi. */}
        <motion.p
          {...reveal(1)}
          className="type-serif-display mt-7 flex flex-col items-center text-[6.5vw] italic text-muted sm:mt-9 sm:block sm:text-[3.6vw]"
        >
          <span>{dict.hero.subtitlePrefix}</span>{" "}
          <SubtitleRoulette words={dict.hero.subtitleWords} />
        </motion.p>
      </div>

      {/* w-[36vw]/max-w-[520px] é o tamanho "de verdade" do retrato, pensado
          pra tela de desktop grande. Na faixa de notebook (lg até antes do
          2xl, a maioria das telas de 13" a 16" cai aqui) ele fica pequeno
          demais para o espaço disponível, então encolhe; monitores grandes
          (2xl) voltam ao tamanho original.

          O top também muda por faixa: `top` é uma porcentagem da altura do
          contêiner inteiro, não da altura do próprio retrato, então uma
          imagem mais baixa (a versão notebook) ancorada no mesmo topo acaba
          com o centro mais alto do que a versão grande, e sai do alinhamento
          vertical com "Armando Custodio". Em telas grandes (2xl) o mesmo
          6% herdado da faixa de tablet deixava o topo do retrato quase
          colado no cabeçalho (54px, contra os 128px de respiro do h1 antes
          da faixa `pt-32`), mesmo com o centro da imagem já mais ou menos
          alinhado, porque a imagem é alta e sobra pouco embaixo. 14% deixa
          o topo do retrato perto do topo do h1, com respiro parecido. */}
      <SelfPortrait
        label={dict.hero.portraitAlt}
        className="pointer-events-none relative order-2 w-[52vw] max-w-64 sm:absolute sm:right-[5vw] sm:top-[6%] sm:order-none sm:w-[36vw] sm:max-w-[520px] lg:top-[17%] lg:w-[26vw] lg:max-w-[300px] 2xl:top-[14%] 2xl:w-[36vw] 2xl:max-w-[520px]"
      />

      <div className="order-3 flex flex-col items-center gap-8 sm:items-start sm:gap-10 sm:mt-16">
        <motion.div {...reveal(2)}>
          <a
            ref={ctaRef}
            href="#work"
            tabIndex={mirrored ? -1 : undefined}
            className="type-mono group inline-flex items-center gap-3"
          >
            <span className="underline decoration-1 underline-offset-8">
              {dict.hero.cta}
            </span>
            <span
              aria-hidden
              className="transition-transform duration-300 group-hover:translate-y-1"
            >
              ↓
            </span>
          </a>
        </motion.div>

        {/* As três informações formam um rodapé só, na mesma altura, mas a
            de disponibilidade não entra no grid de duas colunas junto com
            as outras: ela precisa ficar centralizada com o retrato, numa
            posição que o grid (estreito, encolhido pro tamanho do próprio
            conteúdo) nem alcança. Em vez de aninhar outro "position:
            relative" (testado e descartado: o container de posicionamento
            de um elemento absolute é a padding box do ancestral mais
            próximo, então "right: 5vw" mede a partir da borda daquele
            container, e um container aninhado mais estreito dá uma resposta
            diferente do container do retrato mesmo os dois usando vw), a
            legenda vira irmã do grid, ancorada direto na raiz do
            HeroContent (o mesmo "relative" que o retrato usa), com
            right/width idênticos aos dele. Para a altura, bottom-0 (não
            top em %): o rodapé fica colado na borda de baixo da raiz
            (justify-between, só dois filhos em fluxo no desktop), e o grid
            de fatos é o último elemento dali, então a base da legenda cai
            perto o bastante da base das outras duas frases. No mobile ela
            só empilha depois das outras duas, sem posicionamento
            especial. */}
        <motion.div
          {...reveal(3)}
          className="grid grid-cols-1 gap-x-12 gap-y-4 text-center sm:text-left 2xl:grid-cols-2"
        >
          <p
            className="type-mono text-muted"
            style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
          >
            {dict.hero.facts[0]}
          </p>
          <p
            className="type-mono hidden text-muted 2xl:block"
            style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
          >
            {dict.hero.facts[1]}
          </p>
        </motion.div>

        {/* bottom-14, não bottom-0: o container de posicionamento (a raiz)
            tem pb-14 de padding, e a base de um elemento absolute mede a
            partir da padding box (fora do padding, não da borda interna
            dele), então bottom-0 sobraria 56px abaixo de onde o conteúdo de
            verdade (o rodapé, dentro do padding) termina. bottom-14
            cancela exatamente esse padding e alinha a base desta legenda
            com a base das outras duas frases do rodapé.

            O alinhamento com o retrato só liga a partir de 2xl, não de sm:
            entre sm e xl o retrato usa a largura da faixa de notebook
            (300px, calibrada pro tamanho da imagem, não do texto), estreita
            demais pra essa frase caber numa linha só, e quebrar violaria a
            própria exigência de "mesma altura" (mais uma linha muda a
            altura da caixa). Abaixo de 2xl ela só empilha depois das outras
            duas, como um quarto item comum do rodapé. motion.p com o mesmo
            reveal(3) do grid vizinho: virou irmã dele numa edição anterior
            e perdeu a entrada animada nessa troca, já que só o motion.div
            do grid carregava a animação. */}
        <motion.p
          {...reveal(3)}
          className="type-mono text-center text-muted 2xl:absolute 2xl:bottom-14 2xl:right-[5vw] 2xl:w-[36vw] 2xl:max-w-[520px]"
          style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
        >
          {availabilityBefore} <br className="sm:hidden" />
          {availabilityAfter}
        </motion.p>
      </div>
    </div>
  );
}

export function Hero({ dict }: { dict: Dictionary }) {
  const sectionRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLAnchorElement>(null);

  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);
  const radius = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 250, damping: 28, mass: 0.6 });
  const y = useSpring(mouseY, { stiffness: 250, damping: 28, mass: 0.6 });
  const r = useSpring(radius, { stiffness: 180, damping: 24 });

  // Máscara de borda suave: opaca no centro, dissolvendo até o raio cheio.
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${x}px ${y}px, black 0%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,0.4) 72%, transparent 100%)`;

  const onMouseMove = (event: React.MouseEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);

    // Perto do CTA a lente encolhe: o raio é função da distância ao botão.
    const cta = ctaRef.current?.getBoundingClientRect();
    if (cta) {
      const distance = Math.hypot(
        event.clientX - (cta.left + cta.width / 2),
        event.clientY - (cta.top + cta.height / 2),
      );
      const t = Math.min(Math.max((distance - 90) / 340, 0), 1);
      radius.set(LENS_MIN + (LENS_MAX - LENS_MIN) * t);
    } else {
      radius.set(LENS_MAX);
    }
  };

  // Na home o cabeçalho é fixed (veja SiteFrame), não reserva espaço no
  // fluxo, então a hero ocupa a tela inteira e a barra flutua por cima
  // quando decide aparecer.
  return (
    <section
      ref={sectionRef}
      onMouseMove={onMouseMove}
      onMouseLeave={() => radius.set(0)}
      className="texture-noise relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label={profile.name}
    >
      <div className="relative flex flex-1">
        <HeroContent dict={dict} ctaRef={ctaRef} />

        {/* Cópia invertida, revelada pela lente */}
        <motion.div
          aria-hidden
          className="lens-invert pointer-events-none absolute inset-0 flex"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <HeroContent dict={dict} mirrored />
        </motion.div>
      </div>
    </section>
  );
}
