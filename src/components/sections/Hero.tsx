"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
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
  /** As três molas da lente, repassadas à lente do nome: ela incha o <h1>
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
  // ganha altura por flex-grow.
  //
  // No mobile o nome, o subtítulo, o retrato e o bloco de CTA são QUATRO
  // itens diretos do mesmo flex (o wrapper que antes agrupava nome+subtítulo
  // vira `contents` nessa faixa, ver abaixo: some da árvore de layout, mas
  // continua na árvore de DOM, então os dois viram itens do flex por conta
  // própria). `justify-between` reparte o espaço sobrando em partes IGUAIS
  // entre os quatro, então nome→subtítulo, subtítulo→retrato e
  // retrato→CTA saem sempre com o mesmo respiro entre si, sem precisar
  // calcular esse valor à mão (e sem o risco de sobrar tudo num vão só,
  // como um `mt-auto` no último item faria). pt/pb continuam fixos (não
  // entram nessa conta): reservam a margem solta nas duas pontas, ACIMA do
  // nome e ABAIXO do bloco de CTA.
  //
  // pt (`pt-24`) e pb (`pb-10`) NÃO são o mesmo valor de propósito, mesmo
  // os dois lendo como "a mesma margem solta" na tela: o cabeçalho é fixed,
  // flutua por cima da hero sem reservar espaço no fluxo (veja SiteFrame),
  // então de todo o `pt` só o que sobra depois da própria barra (3.5rem)
  // vira respiro visível de verdade. pb-16/pt-16 iguais como número
  // pareciam simétricos no código mas saíam bem torto na tela: a margem
  // visível embaixo do CTA (os 4rem inteiros do pb) ficava bem maior que a
  // margem visível entre a barra e o nome (só a sobra depois da barra).
  // `pt-24` desconta a barra e ainda sobra praticamente o mesmo respiro que
  // o `pb-10` dá embaixo, então as duas pontas leem como a mesma margem, e
  // o grupo inteiro desce um pouco, mais perto do centro vertical da dobra.
  // No desktop o retrato volta a ser absoluto (sai do fluxo do flex) e o
  // wrapper nome+subtítulo volta a ser um bloco só (não mais `contents`),
  // porque lá sobra espaço ao lado da manchete e o respiro entre nome e
  // subtítulo volta a ser a margem fixa de sempre (`sm:mt-9`), não parte
  // dessa conta.
  return (
    <div className="gutter relative flex flex-1 flex-col items-center justify-between pb-10 pt-24 sm:items-stretch sm:pb-14 sm:pt-32">
      {/* Dentro do HeroContent, e não solto no <section>: assim a cópia
          espelhada também recebe o canvas, e o nome inchado inverte junto
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

      {/* contents no mobile: o wrapper some da árvore de LAYOUT (não
          participa mais do flex como uma caixa só), mas continua na árvore
          de DOM, então nome e subtítulo passam a ser dois itens diretos do
          flex, cada um com seu próprio respiro equidistante (ver comentário
          acima). sm:block desfaz isso no desktop: volta a ser uma caixa só,
          e nome+subtítulo voltam a andar juntos, um bloco à esquerda.
          text-center/sm:text-left mora no PRÓPRIO nome e no PRÓPRIO
          subtítulo agora, não aqui: depender de herança through um wrapper
          `contents` (que ainda funciona, a herança de CSS não olha pra
          árvore de layout) foi o que deixou o `sm:text-left` faltando só no
          <h1> passar despercebido, centralizando o nome por cima do
          retrato em qualquer largura de tela, inclusive no desktop. Melhor
          cada filho já nascer com a própria regra completa (ambas as
          faixas) do que herdar de um ancestral que nem sempre está por
          perto pra lembrar. */}
      <div className="contents sm:relative sm:order-1 sm:block">
        {/* Transparente, não escondido, quando o canvas assume o desenho: o
            <h1> continua sendo o que o leitor de tela lê e o que o buscador
            indexa, e continua ocupando o mesmo espaço, que é justamente de
            onde saem as medidas que o canvas usa pra desenhar.

            lg:text-[9vw], menor que os 8.2vw do sm: em vw mas MAIOR em
            pixel (a faixa lg começa numa viewport bem mais larga): na
            faixa de notebook (lg até antes do 2xl) o nome pesava demais ao
            lado do retrato, que também encolhe um pouco nessa faixa (ver
            SelfPortrait abaixo). */}
        <h1
          ref={titleRef}
          className={`type-display type-inktrap order-1 text-center text-[14.5vw] leading-[0.84] tracking-[0.015em] sm:text-left sm:text-[8.2vw] lg:text-[9vw] 2xl:text-[10vw] ${
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
          className="type-serif-display order-1 flex flex-col items-center text-center text-[6.5vw] italic text-muted sm:mt-9 sm:block sm:text-left sm:text-[3.6vw]"
          style={{ fontFamily: "var(--font-switzer)", fontWeight: 400 }}
        >
          <span>{dict.hero.subtitlePrefix}</span>{" "}
          <SubtitleRoulette words={dict.hero.subtitleWords} />
        </motion.p>
      </div>

      {/* w-[50vw]/max-w-60 no mobile: o `justify-between` do contêiner (ver
          comentário no topo da função) reparte sozinho o que sobra de
          altura entre os quatro itens, então o retrato não precisa mais
          ficar pequeno só pra abrir espaço pro resto caber, como numa
          versão anterior (46vw/max-w-56, ainda menor que o 52vw/max-w-64
          original). Um pouco maior de propósito, o "ligeiramente" pedido:
          o retrato é o elemento mais vivo da composição (gira sozinho, em
          flipbook), merece presença, sem chegar perto do tamanho "de
          verdade" do desktop abaixo nem apertar o resto da hero numa tela
          baixa (o flex ainda encolhe os vãos sozinho se precisar, nunca
          estoura a tela, ver comentário no topo da função).

          w-[36vw]/max-w-[520px] é o tamanho "de verdade" do retrato, pensado
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
        className="portrait-enter pointer-events-none relative order-2 w-[50vw] max-w-60 sm:absolute sm:right-[5vw] sm:top-[6%] sm:order-none sm:w-[36vw] sm:max-w-[520px] lg:top-[17%] lg:w-[30vw] lg:max-w-[340px] 2xl:top-[14%] 2xl:w-[36vw] 2xl:max-w-[520px]"
      />

      <div className="relative order-3 flex flex-col items-center gap-5 sm:items-start sm:gap-10 sm:mt-16">
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
            className="type-mono mt-4 text-center text-muted sm:mt-0 sm:text-right"
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

  // O nome incha sob a lente, que roda em WebGL sobre uma cópia do <h1> (ver
  // HeroTitleGL). Enquanto o canvas não confirma que desenhou, e nos casos em
  // que ele nunca vai desenhar (sem WebGL, sem fonte, ou com menos movimento
  // pedido no sistema), o <h1> continua visível e a hero é a de sempre.
  const reduceMotion = useReducedMotion();
  const [titleOnCanvas, setTitleOnCanvas] = useState(false);
  // Sem cursor de verdade não existe lente: em toque o raio nunca sai de zero
  // (nenhum mousemove dispara), então o canvas desenharia uma cópia do <h1>
  // que nunca incha, trocando texto selecionável por pixels à toa.
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

  // A lente só liga depois de 2s na página: de cara ela competia com a
  // animação de entrada do nome e do retrato, o olhar ainda nem tinha
  // pousado no título e o vidro já distorcia tudo. O atraso é só pro
  // GATILHO (onMouseMove ignora eventos antes disso); a mola e a máscara
  // continuam do jeito que já eram, a lente simplesmente começa fechada por
  // mais um instante.
  const [lensReady, setLensReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setLensReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  const mouseX = useMotionValue(-600);
  const mouseY = useMotionValue(-600);
  const radius = useMotionValue(0);

  const x = useSpring(mouseX, { stiffness: 250, damping: 28, mass: 0.6 });
  const y = useSpring(mouseY, { stiffness: 250, damping: 28, mass: 0.6 });
  const r = useSpring(radius, { stiffness: 180, damping: 24 });

  // Máscara de borda suave: opaca no centro, dissolvendo até o raio cheio.
  const mask = useMotionTemplate`radial-gradient(circle ${r}px at ${x}px ${y}px, black 0%, rgba(0,0,0,0.9) 46%, rgba(0,0,0,0.4) 72%, transparent 100%)`;

  // A máscara sozinha NÃO fecha a lente. Com raio zero (nenhum cursor na
  // hero: antes do primeiro movimento, depois que ele sai, e a vida inteira
  // em tela de toque) o gradiente fica degenerado, e o Chromium, em vez de
  // tratar isso como área vazia, ignora a máscara e revela a cópia inteira.
  // O sintoma era a hero nascer com DOIS nomes: o de verdade subindo pela
  // animação de entrada e o da cópia, que entra pronta por definição, parado
  // no lugar final atrás dele.
  //
  // A opacidade fecha por fora, sem depender de como cada navegador resolve
  // um gradiente de raio zero. Sai do mesmo raio, então acompanha a mola: a
  // lente abre e fecha junto com o círculo em vez de piscar.
  const lensOpacity = useTransform(r, [0, 8], [0, 1]);

  // Raio alvo pro ponto atual do cursor: função só da distância até o CTA
  // (perto dele a lente encolhe, cedendo o palco ao clique), sem nenhum
  // efeito colateral. Extraída do onMouseMove pra também servir o efeito de
  // entrada abaixo, que precisa do mesmo cálculo sem esperar por um evento
  // de mouse novo.
  const targetRadiusAt = useCallback((clientX: number, clientY: number) => {
    const cta = ctaRef.current?.getBoundingClientRect();
    if (!cta) return LENS_MAX;
    const distance = Math.hypot(
      clientX - (cta.left + cta.width / 2),
      clientY - (cta.top + cta.height / 2),
    );
    const t = Math.min(Math.max((distance - 90) / 340, 0), 1);
    return LENS_MIN + (LENS_MAX - LENS_MIN) * t;
  }, []);

  const onMouseMove = (event: React.MouseEvent) => {
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    // A posição sempre é rastreada, mesmo antes da lente ligar (abaixo): é
    // ela que alimenta o crescimento de entrada assim que `lensReady` vira
    // true, mesmo que o cursor esteja parado naquele instante, sem esperar
    // por um próximo movimento.
    mouseX.set(event.clientX - rect.left);
    mouseY.set(event.clientY - rect.top);
    if (!lensReady) return;
    radius.set(targetRadiusAt(event.clientX, event.clientY));
  };

  // Quando a lente liga (2s, ver lensReady acima), se o cursor já estiver
  // parado sobre a hero, nenhum mousemove novo dispara pra acender o raio:
  // sem isso, o círculo só nasceria no PRÓXIMO movimento do mouse, uma
  // lente que "esquece" de aparecer até alguém mexer o dedo de novo. Em vez
  // disso, dispara o crescimento diretamente daqui, contra a última posição
  // já rastreada (ou o sentinel fora de tela, se o cursor nunca passou pela
  // hero, e então o círculo nasce fora de vista mesmo, sem efeito visível
  // nenhum): raio vai de 0 até o alvo, e a MESMA mola que já suaviza o
  // resto do gesto (`r`) cuida sozinha do crescimento, sem precisar de uma
  // animação à parte.
  useEffect(() => {
    if (!lensReady) return;
    const section = sectionRef.current;
    if (!section) return;
    const rect = section.getBoundingClientRect();
    const clientX = rect.left + mouseX.get();
    const clientY = rect.top + mouseY.get();
    radius.set(targetRadiusAt(clientX, clientY));
  }, [lensReady, mouseX, mouseY, radius, targetRadiusAt]);

  // Na home o cabeçalho é fixed (veja SiteFrame), não reserva espaço no
  // fluxo, então a hero ocupa a tela inteira e a barra flutua por cima
  // quando decide aparecer.
  return (
    <section
      id="home"
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
          style={{ maskImage: mask, WebkitMaskImage: mask, opacity: lensOpacity }}
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
