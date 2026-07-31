"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { KineticWeight } from "@/components/ui/KineticWeight";
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
  pointerX,
  pointerY,
  pointerActive,
}: {
  dict: Dictionary;
  /** Cópia dentro da lente: entra pronta, sem repetir a animação de entrada. */
  mirrored?: boolean;
  ctaRef?: React.RefObject<HTMLAnchorElement | null>;
  /** Compartilhados com as duas cópias (ver KineticWeight): a da lente vive
   *  atrás de um pointer-events: none e nunca receberia um onMouseMove
   *  próprio. */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  pointerActive: MotionValue<number>;
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
        <h1 className="type-display type-inktrap text-[13vw] leading-[0.84] sm:text-[8.2vw] lg:text-[11vw] 2xl:text-[10vw]">
          {/* leading-[0.84] é mais apertado que a altura real da fonte: sem
              esse respiro, o overflow-hidden usado pra animação de entrada
              corta o topo do "A" e de outras letras (fica achatado em vez de
              pontudo). pt-[0.16em] abre espaço acima da linha; -mt-[0.16em]
              nas palavras seguintes cancela esse espaço na hora de empilhar,
              então o espaçamento entre "ARMANDO" e "CUSTODIO" não muda, só a
              primeira palavra ganha uma folga extra por cima (empurrando o
              conjunto pra baixo, não pra cima, então não reduz a distância
              até o cabeçalho). */}
          {words.map((word, index) => (
            <span
              key={word}
              className={
                index === 0
                  ? "block overflow-hidden pt-[0.16em]"
                  : "-mt-[0.16em] block overflow-hidden pt-[0.16em]"
              }
            >
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
                <KineticWeight
                  text={word}
                  pointerX={pointerX}
                  pointerY={pointerY}
                  pointerActive={pointerActive}
                />
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
        {/* font-weight mais leve que o padrão de .type-serif-display (700):
            aqui é subtítulo, não manchete, e o peso cheio competia demais com
            o nome acima. Inline porque .type-serif-display não é layered
            (vence utilitária comum do Tailwind de propósito), então só
            style sobrescreve. */}
        <motion.p
          {...reveal(1)}
          className="type-serif-display mt-7 flex flex-col items-center text-[6.5vw] italic text-muted sm:mt-9 sm:block sm:text-[3.6vw]"
          style={{ fontWeight: 500 }}
        >
          <span>{dict.hero.subtitlePrefix}</span>{" "}
          <SubtitleRoulette words={dict.hero.subtitleWords} />
        </motion.p>
      </div>

      {/* w-[36vw]/max-w-[520px] é o tamanho "de verdade" do retrato, pensado
          pra tela de desktop grande. Na faixa de notebook (lg até antes do
          2xl, a maioria das telas de 13" a 16" cai aqui) ele ainda encolhe
          (o espaço disponível é menor), mas não tanto quanto antes
          (26vw/300px): folga extra pra crescer sem sair do lugar. Monitores
          grandes (2xl) voltam ao tamanho original.

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
        className="pointer-events-none relative order-2 w-[52vw] max-w-64 sm:absolute sm:right-[5vw] sm:top-[6%] sm:order-none sm:w-[36vw] sm:max-w-[520px] lg:top-[17%] lg:w-[30vw] lg:max-w-[340px] 2xl:top-[14%] 2xl:w-[36vw] 2xl:max-w-[520px]"
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

        {/* As três informações formam um rodapé só, na mesma altura. No
            notebook (sm até antes de 2xl) só "UX/UI..." e a disponibilidade
            aparecem: o wrapper é flex-row com justify-between, os dois
            medidos pela mesma borda (o próprio wrapper), então a distância
            até cada lateral bate por construção. Precisa de sm:w-full: o
            pai (order-3) é flex items-start, não stretch, então sem
            largura explícita o wrapper encolhe pro tamanho do próprio
            conteúdo.

            No desktop grande (2xl) as três aparecem juntas, numa grade de
            três colunas iguais: "UX/UI..." alinhada à esquerda na primeira
            coluna, "Do institucional..." centralizada na coluna do meio
            (equidistante das outras duas por construção, já que cada
            coluna tem a mesma largura) e a disponibilidade alinhada à
            direita na última, cuja borda direita coincide com a borda do
            próprio gutter, a mesma referência que o resto do conteúdo usa.
            Uma tentativa anterior ancorava a disponibilidade em posição
            absoluta, centralizada sob o retrato, e ela acabava
            sobrepondo "Do institucional...", que cresce pra encher a
            grade antiga de duas colunas.

            No mobile (abaixo de sm) o wrapper nem é flex nem grid, então
            os filhos empilham na ordem do DOM: "UX/UI...", depois a
            disponibilidade ("Do institucional..." continua escondida). */}
        <div className="sm:flex sm:w-full sm:items-start sm:justify-between sm:gap-8 2xl:grid 2xl:grid-cols-3 2xl:items-start 2xl:gap-x-12">
          <motion.p
            {...reveal(3)}
            className="type-mono text-center text-muted sm:text-left"
            style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
          >
            {dict.hero.facts[0]}
          </motion.p>

          <motion.p
            {...reveal(3)}
            className="type-mono hidden text-muted 2xl:block 2xl:text-center"
            style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
          >
            {dict.hero.facts[1]}
          </motion.p>

          <motion.p
            {...reveal(3)}
            className="type-mono mt-8 text-center text-muted sm:mt-0 sm:text-right"
            style={{ fontSize: "clamp(0.625rem, 0.55vw, 0.75rem)" }}
          >
            {availabilityBefore} <br className="sm:hidden" />
            {availabilityAfter}
          </motion.p>
        </div>
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

  // Posição do ponteiro em coordenadas de viewport (não relativas à seção,
  // como mouseX/mouseY acima): KineticWeight mede cada letra com
  // getBoundingClientRect(), que já vem em coordenadas de viewport, então
  // comparar direto evita converter de um lado pro outro. pointerActive
  // existe à parte da lente: reseta no mouseleave junto com o raio, mas
  // mouseX/mouseY continuam com o último valor conhecido (a lente só
  // encolhe o raio a zero, não "esquece" a posição), o que serviria mal de
  // sinal de "ponteiro dentro da hero".
  const pointerX = useMotionValue(-9999);
  const pointerY = useMotionValue(-9999);
  const pointerActive = useMotionValue(0);

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
    pointerX.set(event.clientX);
    pointerY.set(event.clientY);
    pointerActive.set(1);

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
      onMouseLeave={() => {
        radius.set(0);
        pointerActive.set(0);
      }}
      className="texture-noise texture-noise-animate relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label={profile.name}
    >
      <div className="relative flex flex-1">
        <HeroContent
          dict={dict}
          ctaRef={ctaRef}
          pointerX={pointerX}
          pointerY={pointerY}
          pointerActive={pointerActive}
        />

        {/* Cópia invertida, revelada pela lente */}
        <motion.div
          aria-hidden
          className="lens-invert pointer-events-none absolute inset-0 flex"
          style={{ maskImage: mask, WebkitMaskImage: mask }}
        >
          <HeroContent
            dict={dict}
            mirrored
            pointerX={pointerX}
            pointerY={pointerY}
            pointerActive={pointerActive}
          />
        </motion.div>
      </div>
    </section>
  );
}
