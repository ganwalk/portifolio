"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { HeroTitleGL } from "@/components/ui/HeroTitleGL";
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
  lensRadius,
  sectionRef,
  titleRef,
  titleLens,
  titleOnCanvas,
  onTitleDrawing,
  onTitleUnsupported,
}: {
  dict: Dictionary;
  /** Cópia dentro da lente: entra pronta, sem repetir a animação de entrada. */
  mirrored?: boolean;
  ctaRef?: React.RefObject<HTMLAnchorElement | null>;
  /** As três molas da lente, repassadas à lente do nome: ela deforma o <h1>
   *  com o mesmo raio que rege a inversão do texto (ver HeroTitleGL). */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  lensRadius: MotionValue<number>;
  sectionRef: React.RefObject<HTMLElement | null>;
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  /** Se a lente do nome roda: falso sem WebGL ou com menos movimento pedido
   *  no sistema, e aí o canvas nem é montado. */
  titleLens: boolean;
  /** O canvas assumiu o desenho do nome: o <h1> fica transparente. */
  titleOnCanvas: boolean;
  onTitleDrawing: () => void;
  onTitleUnsupported: () => void;
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

  // No mobile a frase quebra nas duas orações que o "·" já separa (mesmo
  // ponto onde ela se separa em voz alta), não onde o navegador preferir: um
  // <br> visível só abaixo de sm força esse ponto específico, e escondido
  // dali pra cima (onde a frase cabe numa linha, empilhada ou ao lado do
  // retrato) não deixa rastro. O "·" some da quebra: como marcador de
  // separação ele faz sentido numa linha só, não como bullet solto no fim
  // ou começo de uma linha empilhada.
  const breakMarker = " · ";
  const breakIndex = dict.hero.availability.indexOf(breakMarker);
  const availabilityBefore =
    breakIndex === -1
      ? dict.hero.availability
      : dict.hero.availability.slice(0, breakIndex);
  const availabilityAfter =
    breakIndex === -1
      ? ""
      : dict.hero.availability.slice(breakIndex + breakMarker.length);

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
      {/* Dentro do HeroContent, e não solto no <section>: assim a cópia
          espelhada também recebe o canvas, e o nome deformado inverte junto
          com o resto em vez de sumir atrás do disco de tinta da lente. */}
      {titleLens && (
        <HeroTitleGL
          mirrored={mirrored}
          pointerX={pointerX}
          pointerY={pointerY}
          lensRadius={lensRadius}
          sectionRef={sectionRef}
          titleRef={titleRef}
          onDrawing={onTitleDrawing}
          onUnsupported={onTitleUnsupported}
        />
      )}

      <div className="relative order-1 mt-6 text-center sm:mt-0 sm:text-left">
        {/* Transparente, não escondido, quando o canvas assume o desenho: o
            <h1> continua sendo o que o leitor de tela lê e o que o buscador
            indexa, e continua ocupando o mesmo espaço, que é justamente de
            onde saem as medidas que o canvas usa pra desenhar. */}
        <h1
          ref={titleRef}
          className={`type-display type-inktrap text-[14.5vw] leading-[0.84] tracking-[0.015em] sm:text-[8.2vw] lg:text-[11vw] 2xl:text-[10vw] ${
            titleOnCanvas ? "opacity-0" : ""
          }`}
        >
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
              data-title-line
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
        {/* Fonte e peso diferentes do padrão de .type-serif-display (Bricolage
            Grotesque, 700): aqui é subtítulo, não manchete, e nem a fonte nem
            o peso cheio da manchete combinavam com o nome em Whyte Inktrap
            acima. Switzer (Fontshare, ver src/fonts/switzer/) tem um desenho
            que conversa melhor com a Whyte, num peso mais leve (400), e
            itálico de verdade (não sintetizado). Inline porque
            .type-serif-display não é layered (vence utilitária comum do
            Tailwind de propósito), então só style sobrescreve. */}
        <motion.p
          {...reveal(1)}
          className="type-serif-display mt-7 flex flex-col items-center text-[6.5vw] italic text-muted sm:mt-9 sm:block sm:text-[3.6vw]"
          style={{ fontFamily: "var(--font-switzer)", fontWeight: 400 }}
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

      <div className="relative order-3 flex flex-col items-center gap-8 sm:items-start sm:gap-10 sm:mt-16">
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
            {availabilityBefore}
            <span className="hidden sm:inline"> · </span>
            <br className="sm:hidden" />
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
  const titleRef = useRef<HTMLHeadingElement>(null);
  const mirroredTitleRef = useRef<HTMLHeadingElement>(null);

  // O nome deformado pela lente roda em WebGL sobre uma cópia do <h1> (ver
  // HeroTitleGL). Enquanto o canvas não confirma que desenhou, e nos casos em
  // que ele nunca vai desenhar (sem WebGL, sem fonte, ou com menos movimento
  // pedido no sistema), o <h1> continua visível e a hero é a de sempre.
  const reduceMotion = useReducedMotion();
  const [titleOnCanvas, setTitleOnCanvas] = useState(false);
  // Sem cursor de verdade não existe lente: em toque o raio nunca sai de zero
  // (nenhum mousemove dispara), então o canvas desenharia uma cópia do <h1>
  // que nunca se deforma, trocando texto selecionável por pixels à toa.
  // Começa desligado, e não com a medida já lida, porque no HTML do servidor
  // não existe ponteiro pra consultar: o canvas é melhoria progressiva.
  const [hasPointer, setHasPointer] = useState(false);
  const [titleUnsupported, setTitleUnsupported] = useState(false);
  const onTitleDrawing = useCallback(() => setTitleOnCanvas(true), []);
  const onTitleUnsupported = useCallback(() => {
    setTitleUnsupported(true);
    setTitleOnCanvas(false);
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setHasPointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const titleLens = hasPointer && !reduceMotion && !titleUnsupported;

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
      className="texture-noise texture-noise-animate relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label={profile.name}
    >
      <div className="relative flex flex-1">
        <HeroContent
          dict={dict}
          ctaRef={ctaRef}
          pointerX={x}
          pointerY={y}
          lensRadius={r}
          sectionRef={sectionRef}
          titleRef={titleRef}
          titleLens={titleLens}
          titleOnCanvas={titleLens && titleOnCanvas}
          onTitleDrawing={onTitleDrawing}
          onTitleUnsupported={onTitleUnsupported}
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
            pointerX={x}
            pointerY={y}
            lensRadius={r}
            sectionRef={sectionRef}
            titleRef={mirroredTitleRef}
            titleLens={titleLens}
            titleOnCanvas={titleLens && titleOnCanvas}
            onTitleDrawing={onTitleDrawing}
            onTitleUnsupported={onTitleUnsupported}
          />
        </motion.div>
      </div>
    </section>
  );
}
