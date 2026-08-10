"use client";

import Link from "next/link";
import Lenis from "lenis";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { CaseMetrics } from "@/components/ui/CaseMetrics";
import { MediaView } from "@/components/ui/MediaView";
import { Reveal } from "@/components/ui/Reveal";
import { cases } from "@/data/cases";
import type { CaseStudy } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { useMediaQuery } from "@/lib/use-media-query";

// Projetos em destaque como uma sequência amarrada ao scroll da própria
// página, não um carrossel com botões e timer, A PARTIR DO sm: (640px). No
// mobile (abaixo disso) é rolagem vertical comum, um painel quase de tela
// cheia por projeto (ver MobileCaseList, mais abaixo): a pilha presa ao
// scroll empilhava mal em telas pequenas (o cabeçalho fixo cobria o topo do
// painel ativo em certas posições, e o trio de artistas competia com a pilha
// de fatias), e um carrossel horizontal por gesto, tentado depois, lia fraco
// e brigava com o eixo em que a página já rola.
// `useMediaQuery` decide qual das duas versões monta (ver CasesGrid): a
// versão presa ao scroll (`useScroll`, `SlidePanel` etc.) mora inteira em
// `DesktopCasesGrid`, um componente à parte que só é montado quando
// `isDesktop` é verdadeiro. Montar as duas ao mesmo tempo (uma escondida
// via CSS) deixaria o `useScroll` da versão presa apontando pra um ref que
// nunca prende a nenhum elemento enquanto o mobile está em cena, o que o
// Framer Motion acusa em console (ref definido mas nunca hidratado) mesmo
// sem quebrar nada visualmente; como componente à parte, o hook só existe
// enquanto o elemento que ele mede também existe.
//
// A partir daqui, tudo descreve a versão de desktop: a seção sai direto da
// hero (sem título nem subtítulo próprios, só um rótulo acessível no
// <section> pra quem usa leitor de tela) e já entra prendendo o scroll. É
// alta (uma tela inteira por fatia) e fica presa (position: sticky) enquanto
// o visitante rola por ela, e cada fatia entra deslizando de baixo pra cima
// (translateY, não clip-path) até assentar no lugar, empilhando por cima da
// anterior como um baralho de cartas: a fatia que fica por baixo encolhe um
// pouco e escurece enquanto a próxima sobe sobre ela, dando profundidade
// física à pilha, e não se move mais depois de coberta, só recebe a
// próxima por cima. Rolar É a navegação: sem seta, sem play/pause, sem
// índice próprio brigando com o scroll de verdade.
//
// Cada FATIA ocupa uma janela própria de scrollYProgress (ver slideWindows).
// Quase todas valem o mesmo; a PRIMEIRA vale menos, porque é a única sem fase
// de entrada e, com peso igual, virava uma tela inteira de rolagem sem nada
// acontecendo antes da primeira transição, contra pouco mais de meia tela de
// pausa nas demais. Uma fatia nem sempre é um case só: cases adjacentes que compartilham
// `group` no dado (o trio de artistas, hoje) viram uma fatia só
// (`buildSlides`, calculado uma vez fora do componente porque `cases` é
// estático), lado a lado a partir do `lg:` (1024px) ou empilhados
// verticalmente dentro do mesmo painel antes disso: reduz o scroll do trio
// a 1/3 do que seria com um artista por fatia. Essa fatia ganha uma coluna
// extra, estreita, antes das outras
// (à esquerda no lg:, à esquerda também empilhada): só a frase
// "Experiências interativas" girada 90°, na Whyte Inktrap, uma régua de
// contexto, não um case clicável. O rótulo de índice de cada coluna
// ("03 / 06") sempre conta cases, não fatias: SlidePanel repassa o índice
// original (`flatIndex`) pra cada CaseColumn, independente de quantas
// fatias existem; é a ÚNICA contagem da seção, não existe outra em nível de
// fatia competindo com ela. Nas pontas (primeira e última fatia) a fatia
// não tem a metade que não existe: a primeira já nasce aberta (nada
// "antes" dela pra desdobrar de), a última fica aberta até o fim da seção
// (nada "depois").
//
// Texto em máscara escalonada por cima da pilha, atrás do MotionConfig do
// Modo Boring: cada linha (índice, métrica, título, tags, convite) mora num
// overflow-hidden próprio e sobe do zero por baixo dele num instante
// diferente, em vez do bloco inteiro nascer junto num só fade. O atraso
// entre linhas é maior justamente no título, o elemento mais dramático da
// composição. A mídia em si fica sempre a cores (nenhum preto e branco
// entra na conta aqui, ao contrário do resto do site: a exceção é
// proposital, é o próprio projeto quem fala).
//
// O fundo de cada card é a mídia e nada mais: nenhum shader, nenhum canvas.
// Uma ondulação em WebGL que seguia o cursor e fundia uma capa na outra morou
// aqui e saiu; o único WebGL do site hoje é a lente que deforma o nome na hero
// (HeroTitleGL), onde o efeito É o desenho, não uma camada por cima de um
// vídeo que já tem movimento próprio. O que restou de movimento na mídia são dois, os dois
// discretos: um zoom no hover e o paralaxe de scroll (abaixo). Um
// selo "ver caso" acompanha o cursor (mola só, sem rastro de partículas),
// deslocado bem à direita e um pouco abaixo da ponta (cursores grandes do
// sistema cobrem a área logo ao lado dela), com o texto rodando num
// letreiro horizontal contínuo, como uma placa luminosa antiga: duas cópias
// idênticas do texto lado a lado, separadas por um bullet com padding igual
// dos dois lados (não espaço literal, refém da fonte), andando de 0% a
// -50% pra sempre, sem costura no loop. Complementar ao selo estático
// dentro do texto (que continua ali por acessibilidade e pra quem usa
// toque). O selo é um só pra seção inteira (rastreado em `CasesGrid`, não
// um por coluna): todos os painéis ocupam o mesmo retângulo da tela, então
// a posição do cursor não muda quando o scroll troca qual fatia está por
// cima, só o alvo do hover muda, recalculado tanto a cada movimento real do
// mouse quanto sempre que a fatia ativa troca. onMouseMove, não
// onPointerMove: em toque o evento não dispara, então nada disso ativa lá,
// mesmo princípio que já mantém a lente da hero parada no mobile.
//
// A rolagem é amortecida, não literal: o progresso bruto do scroll passa por
// uma mola (`useSpring` em `CasesGrid`) e é o valor amortecido que rege TODA
// transformação da seção, o mesmo raciocínio de lerp que Lenis (ver
// SmoothScroll.tsx) já aplica à rolagem em si, mas aqui do lado da CENA: a
// mola vive na animação, não na posição do scroll, então o amortecimento da
// pilha soma ao de Lenis em vez de competir com ele. Superamortecida de
// propósito (sem overshoot): pilha que passa do ponto e volta enjoa. Quem
// pede menos movimento no sistema recebe o progresso bruto, sem mola.
//
// O que rege a LÓGICA (qual fatia está ativa) continua sendo o progresso
// bruto: a mola atrasa uns décimos, e um índice ativo atrasado tornaria o
// clique e o foco de teclado imprecisos justo enquanto a cena ainda se
// acomoda.
//
// Cada fatia sobe durante os primeiros 45% da própria janela de scroll e
// depois fica. Esse resto, antes parado, hoje tem paralaxe: a mídia da fatia
// em cena desliza devagar em contrassenso enquanto o texto fica ancorado.
// Rolagem sem nada acontecendo lê como travada, mesmo quando é só uma pausa
// de composição.
//
// Clicar no projeto em cena ainda expande pra tela cheia com os dados
// completos do case, igual antes; só a navegação ENTRE projetos mudou.

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Fração da janela de uma fatia gasta subindo. O resto é a pausa em que ela
 *  fica assentada em cena, recebendo a próxima por cima. */
const ENTER_FRACTION = 0.45;

/** Peso da PRIMEIRA fatia na altura da seção, contra 1 das demais.
 *
 *  Ela é a única sem fase de entrada: já nasce no lugar, porque não existe
 *  nada antes dela pra subir de. Com todas as fatias recebendo a mesma altura
 *  de scroll, essa diferença virava uma tela inteira de rolagem sem NADA
 *  acontecendo antes da primeira transição, contra 55% de uma tela de pausa
 *  em cada fatia seguinte. Na prática a seção parecia travada logo na
 *  entrada, e a mão de quem rola aprendia um ritmo que a seção não cumpria
 *  depois. Dando à primeira só o peso da pausa (o que sobra depois da subida
 *  que ela não tem), a espera entre uma transição e a próxima fica igual do
 *  começo ao fim. */
const FIRST_SLIDE_WEIGHT = 1 - ENTER_FRACTION;

interface SlideWindow {
  /** Início e fim desta fatia em scrollYProgress (0 a 1 da seção). */
  start: number;
  end: number;
}

/** Divide o progresso da seção entre as fatias, com a primeira valendo menos
 *  que as outras (ver FIRST_SLIDE_WEIGHT). `total` é a altura da seção em
 *  telas: não é mais `count`, já que as fatias não valem todas o mesmo. */
function slideWindows(count: number): { windows: SlideWindow[]; total: number } {
  const weights = Array.from({ length: count }, (_, index) =>
    index === 0 ? FIRST_SLIDE_WEIGHT : 1,
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const windows: SlideWindow[] = [];
  let acc = 0;
  for (const weight of weights) {
    const start = acc / total;
    acc += weight;
    windows.push({ start, end: acc / total });
  }
  return { windows, total };
}

/** Range de entrada de scrollYProgress pra useTransform: sobe de 0 a 1
 *  durante a subida da fatia (`enterEnd`) e trava em 1 pra sempre depois
 *  disso (clamp padrão do useTransform fora do domínio de `input`), mesmo
 *  quando a próxima fatia começa a cobri-la por cima. É esse travamento que
 *  faz a fatia SUBIR uma vez só e nunca descer de volta: uma curva que
 *  também recuasse na saída faria a fatia deslizar de volta pra baixo bem
 *  no instante em que ela devia só ficar parada, recebendo a próxima em
 *  cima. */
function enterRange(index: number, windows: SlideWindow[]) {
  if (index === 0) return { input: [0, 1] as [number, number], output: [1, 1] as [number, number] };
  const { start, end } = windows[index];
  return {
    input: [start, start + (end - start) * ENTER_FRACTION] as [number, number],
    output: [0, 1] as [number, number],
  };
}

/** Qual fatia está em cena num dado progresso. Varre de trás pra frente
 *  porque as janelas não têm mais largura igual, então não dá pra dividir o
 *  progresso pelo número de fatias e arredondar. */
function activeSlideAt(progress: number, windows: SlideWindow[]) {
  for (let index = windows.length - 1; index > 0; index--) {
    if (progress >= windows[index].start) return index;
  }
  return 0;
}

interface SlideCase {
  caseStudy: CaseStudy;
  /** Posição do case na lista completa (0-based), independente de slide:
   *  o rótulo de índice de cada coluna ("03 / 06") conta projetos, não
   *  fatias de scroll. */
  flatIndex: number;
}

/** Agrupa cases adjacentes que compartilham `group` numa fatia só de scroll
 *  (ver SlidePanel: lado a lado a partir do lg:, empilhados antes disso).
 *  Cases sem `group`, ou cujo vizinho tem um `group` diferente, viram uma
 *  fatia de um caso só, do jeito que sempre foi. */
function buildSlides(list: CaseStudy[]): SlideCase[][] {
  const slides: SlideCase[][] = [];
  let i = 0;
  while (i < list.length) {
    const group = list[i].group;
    const slide: SlideCase[] = [{ caseStudy: list[i], flatIndex: i }];
    i++;
    while (group && i < list.length && list[i].group === group) {
      slide.push({ caseStudy: list[i], flatIndex: i });
      i++;
    }
    slides.push(slide);
  }
  return slides;
}

// `cases` é estático (import), então cabe calcular uma vez só, fora do
// componente.
const groupedSlides = buildSlides(cases);

function SlidePanel({
  slide,
  totalCases,
  locale,
  dict,
  index,
  windows,
  progress,
  parallax,
  isActive,
  isNearActive,
  hoveredSlug,
  onExpand,
}: {
  slide: SlideCase[];
  totalCases: number;
  locale: Locale;
  dict: Dictionary;
  index: number;
  /** Janelas de scroll de todas as fatias (ver slideWindows): a fatia
   *  precisa das vizinhas, não só da própria, pra saber quando é coberta. */
  windows: SlideWindow[];
  /** Progresso da seção já amortecido pela mola (ver CasesGrid): é ele, e
   *  não o scroll cru, que rege toda transformação daqui pra baixo. */
  progress: MotionValue<number>;
  /** Amplitude do paralaxe da mídia, em porcentagem da altura. Zero quando o
   *  sistema pede menos movimento. */
  parallax: number;
  isActive: boolean;
  isNearActive: boolean;
  hoveredSlug: string | null;
  onExpand: (caseStudy: CaseStudy, rect: DOMRect) => void;
}) {
  const multi = slide.length > 1;

  // Empilhamento: a fatia sobe de baixo (translateY 100% a 0%) e assenta,
  // igual um baralho recebendo carta por cima, travada no lugar depois (ver
  // enterRange). zIndex sobe com o índice, não com isActive: a ordem de
  // empilhamento acompanha a ordem de rolagem, então a fatia N+1 sempre
  // cobre a N ao chegar, nunca o contrário.
  const { input: enterInput, output: enterOutput } = enterRange(index, windows);
  const enterT = useTransform(progress, enterInput, enterOutput);
  const slideY = useTransform(enterT, [0, 1], ["100%", "0%"]);

  // Janela inteira desta fatia em cena, da hora em que ela começa a subir
  // até a próxima terminar de cobri-la. É o relógio do paralaxe da mídia:
  // ao contrário de `enterT`, que trava em 1 assim que a fatia assenta, este
  // continua andando durante a pausa, que é justamente onde a rolagem
  // precisava de vida.
  const stayT = useTransform(
    progress,
    [windows[index].start, windows[index].end],
    [0, 1],
  );

  // A fatia que vem depois cobrindo esta: enquanto ela sobe por cima,
  // ESTA aqui encolhe um pouco, sobe um tanto e escurece, o cartão de baixo
  // recuando na pilha. A subida é o que separa "carta caindo em cima de
  // outra" de "página sendo virada": sem ela, a fatia de baixo fica parada
  // como um fundo, e a profundidade some. A última fatia nunca é coberta
  // (nada depois dela).
  const nextEnter = index < windows.length - 1 ? enterRange(index + 1, windows) : { input: [0, 1] as [number, number], output: [0, 0] as [number, number] };
  const coveringT = useTransform(progress, nextEnter.input, nextEnter.output);
  const coveredScale = useTransform(coveringT, [0, 1], [1, 0.94]);
  const coveredY = useTransform(coveringT, [0, 1], ["0%", "-4%"]);
  const coveredDim = useTransform(coveringT, [0, 1], [0, 0.45]);

  return (
    <motion.div
      aria-hidden={!isActive}
      className="absolute inset-0 h-full w-full overflow-hidden bg-black"
      style={{
        y: slideY,
        zIndex: index,
      }}
    >
      <motion.div
        style={{ scale: coveredScale, y: coveredY }}
        className="flex h-full w-full"
      >
        <motion.div
          aria-hidden
          style={{ opacity: coveredDim }}
          className="pointer-events-none absolute inset-0 z-10 bg-black"
        />
        {multi && (
          // bg-background, não bg-black: ao contrário da mídia (sempre a
          // cores, a exceção proposital do resto do arquivo), esta régua não
          // mostra nenhum projeto, é só um separador de rótulo. Sem cor
          // própria pra defender, ela acompanha o tema como o resto do
          // site, em vez de herdar o preto do painel por trás.
          <div className="flex w-8 shrink-0 items-center justify-center bg-background sm:w-10 lg:w-14">
            <span
              className="type-inktrap whitespace-nowrap text-xs uppercase tracking-widest text-muted"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {dict.cases.interactiveExperiences}
            </span>
          </div>
        )}
        {/* Lado a lado só a partir do lg: até lá (mobile e tablet, onde
            três colunas apertadas ficariam ilegíveis) o trio empilha na
            vertical, dentro do mesmo painel preso ao scroll, uma fatia só
            em vez de três. Reduz o scroll do trio a 1/3 do que seria
            empilhando cada artista na fatia dele, sem abrir mão do "lado a
            lado" onde sobra largura. */}
        <div className="flex min-w-0 flex-1 flex-col lg:flex-row">
          {slide.map(({ caseStudy, flatIndex }) => (
            <CaseColumn
              key={caseStudy.slug}
              caseStudy={caseStudy}
              flatIndex={flatIndex}
              totalCases={totalCases}
              locale={locale}
              dict={dict}
              enterT={enterT}
              stayT={stayT}
              parallax={parallax}
              isActive={isActive}
              isNearActive={isNearActive}
              isHovered={hoveredSlug === caseStudy.slug}
              multi={multi}
              dividerLeft={multi}
              onExpand={onExpand}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function CaseColumn({
  caseStudy,
  flatIndex,
  totalCases,
  locale,
  dict,
  enterT,
  stayT,
  parallax,
  isActive,
  isNearActive,
  isHovered,
  multi,
  dividerLeft,
  onExpand,
}: {
  caseStudy: CaseStudy;
  flatIndex: number;
  totalCases: number;
  locale: Locale;
  dict: Dictionary;
  enterT: MotionValue<number>;
  /** Progresso da fatia inteira em cena, incluindo a pausa depois de
   *  assentada (ver SlidePanel): só a mídia usa, pro paralaxe. */
  stayT: MotionValue<number>;
  /** Amplitude do paralaxe da mídia, em porcentagem da altura (0 = desligado). */
  parallax: number;
  isActive: boolean;
  isNearActive: boolean;
  /** Se ESTE case é o alvo do cursor agora, decidido uma vez só lá em cima
   *  em CasesGrid (ver comentário no selo que segue o cursor) em vez de
   *  cada coluna rastrear seu próprio hover: o zoom sutil da mídia usa o
   *  mesmo valor. */
  isHovered: boolean;
  /** Uma de três, não o painel cheio: título, métrica e respiro encolhem
   *  pra caber num terço do espaço (da largura no lg:, da altura antes
   *  disso, ver dividerLeft) em vez de vazar. */
  multi: boolean;
  /** Fio entre as colunas do trio, na direção que muda com o layout: em
   *  cima (empilhado, antes do lg:) ou à esquerda (lado a lado, lg:). */
  dividerLeft: boolean;
  onExpand: (caseStudy: CaseStudy, rect: DOMRect) => void;
}) {
  const metric = caseStudy.metrics[0];
  // `enterT`, não uma curva com fase de saída: o conteúdo sobe e fica,
  // continua visível mesmo depois de coberto pela próxima fatia (é a fatia
  // INTEIRA que encolhe e escurece nesse momento, ver coveredScale/
  // coveredDim em SlidePanel), em vez de desaparecer sozinho antes disso.
  const contentOpacity = useTransform(enterT, [0, 0.55], [0, 1]);

  // Máscara escalonada: cada linha sobe do zero num instante diferente
  // dentro da própria subida da fatia, em vez do bloco de texto inteiro
  // nascer junto. Título por último e com a janela mais longa, é o elemento
  // que merece mais peso na entrada.
  const kickerY = useTransform(enterT, [0.05, 0.4], ["100%", "0%"]);
  const metricY = useTransform(enterT, [0.1, 0.45], ["100%", "0%"]);
  const titleY = useTransform(enterT, [0.18, 0.58], ["100%", "0%"]);
  const tagsY = useTransform(enterT, [0.32, 0.62], ["100%", "0%"]);
  const ctaY = useTransform(enterT, [0.42, 0.7], ["100%", "0%"]);

  // Paralaxe da mídia: ela desce de +parallax% a -parallax% ao longo de toda
  // a permanência da fatia, enquanto o texto fica ancorado. É o que mantém a
  // rolagem viva durante a pausa depois que a fatia assenta, e é o que
  // separa a capa do texto em profundidade, sem sombra nem moldura (o site
  // não tem nenhuma das duas). A escala base cobre exatamente o dobro do
  // deslocamento: sem ela, o movimento revelaria a borda preta do painel.
  const mediaY = useTransform(
    stayT,
    [0, 1],
    [`${parallax}%`, `${-parallax}%`],
  );
  const mediaScale = parallax ? 1 + (parallax * 2) / 100 + 0.02 : 1;

  return (
    <motion.button
      type="button"
      data-case-slug={caseStudy.slug}
      onClick={(event) =>
        isActive && onExpand(caseStudy, event.currentTarget.getBoundingClientRect())
      }
      tabIndex={isActive ? 0 : -1}
      aria-hidden={!isActive}
      aria-label={caseStudy.title[locale]}
      className={`relative block h-full w-full flex-1 bg-black text-left ${
        dividerLeft ? "border-t border-white/15 lg:border-l lg:border-t-0" : ""
      } ${isActive ? "" : "pointer-events-none"}`}
    >
      {/* Tudo que precisa de corte (zoom da mídia, máscara do texto) vive
          aqui dentro; o selo que segue o cursor não mora mais aqui (ver
          CasesGrid: um selo só, no nível da seção, não um por coluna). */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Duas camadas de transform aninhadas, de propósito: o paralaxe é
            regido pelo scroll (MotionValue) e o zoom pelo hover (animate).
            Numa camada só, um dos dois teria que ser recalculado a cada
            quadro em função do outro. */}
        <motion.div
          style={{ y: mediaY, scale: mediaScale }}
          className="absolute inset-0"
        >
          <motion.div
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0"
          >
            {isNearActive ? (
              <MediaView
                media={caseStudy.cover}
                locale={locale}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
          </motion.div>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/45" />

        <motion.div
          style={{ opacity: contentOpacity }}
          className={`gutter relative flex h-full flex-col text-white ${
            multi
              ? "justify-end gap-2 py-4 sm:py-5 lg:justify-between lg:gap-0 lg:py-24"
              : "justify-between py-24 sm:py-28"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="overflow-hidden">
              <motion.p style={{ y: kickerY }} className="type-mono text-white/70">
                {pad(flatIndex + 1)} / {pad(totalCases)} · {caseStudy.year}
              </motion.p>
            </div>
            <div className="overflow-hidden text-right">
              <motion.p style={{ y: metricY }}>
                <span
                  className={`type-serif-display block ${
                    multi ? "text-xl sm:text-2xl lg:text-4xl" : "text-4xl sm:text-6xl"
                  }`}
                >
                  {metric.value}
                </span>
                <span className="type-mono text-white/70">
                  {metric.label[locale]}
                </span>
              </motion.p>
            </div>
          </div>

          <div>
            {/* pt-[0.16em] no PRÓPRIO h3, não no wrapper: leading-[0.9] é
                mais apertado que a altura real da Whyte Inktrap, sem esse
                respiro o overflow-hidden usado pra máscara de entrada corta
                o topo do "A" e de outras letras (mesmo ajuste do H1 na
                hero, ver Hero.tsx). Precisa estar no h3, e não no wrapper:
                em é relativo ao font-size do próprio elemento, e o wrapper
                não herda o text-[Xvw] do h3 (font-size só desce a árvore,
                não sobe), então um pt-[0.16em] nele resolvia contra o
                tamanho herdado de bem mais acima, uma fração pequena demais
                do respiro necessário. */}
            <div className="overflow-hidden">
              <motion.h3
                style={{ y: titleY }}
                className={`type-display type-inktrap pt-[0.16em] leading-[0.9] ${
                  multi ? "text-[7vw] sm:text-[5vw] lg:text-[3.4vw]" : "text-[12vw] sm:text-[6vw]"
                }`}
              >
                {caseStudy.title[locale]}
              </motion.h3>
            </div>
            <div className={`overflow-hidden ${multi ? "mt-1 lg:mt-4" : "mt-4"}`}>
              <motion.p style={{ y: tagsY }} className="type-mono text-white/70">
                {caseStudy.tags[locale].join(" • ")}
              </motion.p>
            </div>
            <div
              className={`inline-block overflow-hidden ${multi ? "mt-2 lg:mt-8" : "mt-8"}`}
            >
              <motion.span
                style={{ y: ctaY }}
                className={`type-mono inline-flex items-center gap-3 border border-white/40 backdrop-blur-sm ${
                  multi ? "px-3 py-1.5 lg:px-6 lg:py-3" : "px-6 py-3"
                }`}
              >
                {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
                <span aria-hidden>→</span>
              </motion.span>
            </div>
          </div>
        </motion.div>
      </div>

    </motion.button>
  );
}

function ExpandedCase({
  caseStudy,
  locale,
  dict,
  rect,
  onClose,
}: {
  caseStudy: CaseStudy;
  locale: Locale;
  dict: Dictionary;
  rect: DOMRect;
  onClose: () => void;
}) {
  // FLIP manual: o overlay já nasce do tamanho da viewport inteira (fixed
  // inset-0), mas o transform inicial o encolhe e posiciona exatamente sobre
  // o retângulo do painel clicado; a transição anima de volta pra identidade.
  // Como o painel em cena já ocupa quase a tela inteira, esse ajuste tende a
  // ser sutil, mas mantém a mesma lógica se um dia o gatilho vier de um
  // elemento menor. scaleX/scaleY separados porque o painel e a viewport
  // quase nunca têm a mesma proporção exata.
  const origin = useMemo(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
      x: rect.left + rect.width / 2 - vw / 2,
      y: rect.top + rect.height / 2 - vh / 2,
      scaleX: rect.width / vw,
      scaleY: rect.height / vh,
    };
  }, [rect]);

  useEffect(() => {
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.documentElement.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  // O overlay tem scroll próprio (a página de verdade fica travada acima),
  // mas continua pensado como parte do MESMO scroll da página, não como uma
  // ilha isolada dele: em vez de um data-lenis-prevent tirando este
  // contêiner de cena, ele ganha a própria instância de Lenis, presa nele em
  // vez de na janela. As duas cooperam sozinhas (Lenis já resolve isso: o
  // wheel que a instância daqui consome não chega à instância da página,
  // ver SmoothScroll.tsx), então o overlay rola com o mesmo amortecimento do
  // resto do site, em vez de cair pro scroll nativo só porque mora num
  // contêiner à parte.
  const scrollerRef = useRef<HTMLDivElement>(null);
  const reduceMotionScroller = useReducedMotion();

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || reduceMotionScroller) return;

    const lenis = new Lenis({ wrapper: el, content: el, lerp: 0.11, syncTouch: false });
    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [reduceMotionScroller]);

  return (
    <motion.div
      ref={scrollerRef}
      initial={{
        x: origin.x,
        y: origin.y,
        scaleX: origin.scaleX,
        scaleY: origin.scaleY,
        opacity: 0.7,
      }}
      animate={{ x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1 }}
      exit={{
        x: origin.x,
        y: origin.y,
        scaleX: origin.scaleX,
        scaleY: origin.scaleY,
        opacity: 0,
      }}
      transition={{ type: "spring", stiffness: 210, damping: 28 }}
      className="fixed inset-0 z-50 overflow-y-auto bg-background"
    >
      <div className="relative h-svh w-full overflow-hidden bg-black">
        {/* Zoom lento e contínuo na mídia, por cima do FLIP de entrada. */}
        <motion.div
          animate={{ scale: [1, 1.06] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="h-full w-full"
        >
          <MediaView
            media={caseStudy.cover}
            locale={locale}
            className="h-full w-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />

        <div className="gutter absolute inset-x-0 bottom-10 text-white sm:bottom-16">
          <p className="type-mono mb-4 text-white/70">
            {caseStudy.title[locale]} · {caseStudy.year}
          </p>
          <h2 className="type-display type-inktrap text-[11vw] leading-[0.92] sm:text-[6vw]">
            {caseStudy.title[locale]}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label={dict.nav.close}
          className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center border border-white/30 text-white backdrop-blur-sm transition-colors hover:bg-white/10 sm:right-8 sm:top-8"
        >
          <span aria-hidden>✕</span>
        </button>
      </div>

      <div className="gutter py-16 sm:py-20">
        <p className="type-serif-display max-w-3xl text-3xl sm:text-5xl">
          {caseStudy.statement[locale]}
        </p>

        <CaseMetrics caseStudy={caseStudy} locale={locale} className="mt-12" />

        <p className="type-mono mt-10 text-muted">
          {caseStudy.tags[locale].join(" • ")}
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="texture-noise aspect-4/3 bg-surface" />
          <div className="texture-noise aspect-4/3 bg-surface" />
        </div>

        {caseStudy.metrics.some((m) => m.illustrative) && (
          <p className="type-mono mt-8 text-muted">
            * {dict.cases.metricsDisclaimer}
          </p>
        )}

        <Link
          href={`/${locale}/work/${caseStudy.slug}/`}
          className="type-mono mt-16 inline-flex items-center gap-3 underline underline-offset-8"
        >
          {dict.cases.fullCase} →
        </Link>
      </div>
    </motion.div>
  );
}

// Versão mobile: rolagem vertical de verdade, some a partir do sm:. Já foi
// pilha presa ao scroll (empilhava mal em tela pequena: o cabeçalho fixo
// cobria o topo do painel ativo em certas posições, e o trio de artistas
// competia com a pilha), depois carrossel horizontal por gesto (o arrastar
// lateral lia fraco, e ainda ficava competindo com o resto da página, que
// rola só na vertical). Esta versão volta pro eixo natural da página: cada
// projeto é um painel quase de tela cheia (`MOBILE_CARD_HEIGHT`, o mesmo
// "destaque total" de um projeto por vez que a pilha de desktop já dá, só
// que sem prender o scroll), empilhados na ordem normal do documento, com
// uma beirada do próximo já visível acima da dobra (o respiro entre cartões,
// abaixo) como o único convite pra continuar. Rolar É a navegação, o mesmo
// princípio do resto do site: sem seta, sem ponto de posição, sem contador
// de fatia brigando com o scroll de verdade.
//
// Cada cartão ganha um pouco de profundidade PRÓPRIA conforme cruza o
// centro da tela (`useScroll` com `target` no próprio cartão, sem container:
// mede contra a janela, que é quem de fato rola aqui): a mídia sobe um tanto
// devagar em contrassenso (o mesmo paralaxe da versão de desktop, ver mediaY
// em CaseColumn) e o cartão inteiro ganha uma leve escala, maior perto do
// centro. A amplitude é pequena de propósito: o produto continua em
// destaque o tempo todo, o movimento é textura, não o assunto. O texto
// entra com o `Reveal` padrão do site (o mesmo de About/Playground), não
// mais uma máscara bespoke por linha: mobile não tem um "progresso da fatia"
// compartilhado pra reger isso (cada cartão rola no seu próprio tempo), e o
// Reveal já é a linguagem de entrada do resto da home.
//
// A mídia de cada cartão só monta perto da viewport (`useNearViewport`,
// abaixo): com vídeo mudo em loop em cada capa, deixar os seis
// simultaneamente montados tocaria todos de uma vez, gastando rede e
// bateria à toa num aparelho que só vê um por vez. Sem seletor de fatia, sem
// selo que segue o cursor (não existe hover de verdade em touch): abre a
// página do case direto, sem o overlay expandido em FLIP que a versão de
// desktop usa.

/** Altura de cada painel: perto da tela cheia (o "destaque total" pedido),
 *  mas curta o bastante pra deixar uma beirada do próximo cartão visível
 *  logo acima da dobra, o convite silencioso pra continuar rolando. */
const MOBILE_CARD_HEIGHT = "78svh";

/** true assim que o elemento entra numa margem generosa da viewport (25% de
 *  antecedência): controla o mount da mídia de cada cartão (ver MediaView),
 *  pra vídeo autoplay não ligar todos de uma vez fora de tela. Uma vez
 *  perto, fica true pra sempre: não faz sentido desmontar e recarregar a
 *  mídia de um cartão que já foi visitado. */
function useNearViewport<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [isNear, setIsNear] = useState(false);
  useEffect(() => {
    if (isNear) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsNear(true);
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [isNear, ref]);
  return isNear;
}

function MobileCaseCard({
  caseStudy,
  index,
  totalCases,
  locale,
  dict,
  reduceMotion,
}: {
  caseStudy: CaseStudy;
  index: number;
  totalCases: number;
  locale: Locale;
  dict: Dictionary;
  reduceMotion: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(cardRef);
  // offset "start end" → "end start": 0 quando o cartão entra pela base da
  // tela, 1 quando termina de sair por cima. 0.5 cai no centro, o pico da
  // escala e do paralaxe abaixo.
  const { scrollYProgress: rawProgress } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const scrollYProgress = useSpring(rawProgress, {
    stiffness: 260,
    damping: 32,
    mass: 0.4,
  });
  const progress = reduceMotion ? rawProgress : scrollYProgress;
  const scale = useTransform(progress, [0, 0.5, 1], [0.94, 1, 0.94]);
  // Contrassenso, o mesmo paralaxe da versão de desktop (mediaY em
  // CaseColumn): scale-125 no wrapper cobre a folga que o deslocamento
  // abriria nas bordas.
  const mediaY = useTransform(progress, [0, 1], ["-8%", "8%"]);
  const metric = caseStudy.metrics[0];

  return (
    <div ref={cardRef} style={{ height: MOBILE_CARD_HEIGHT }} className="relative w-full">
      <motion.div
        style={reduceMotion ? undefined : { scale }}
        className="absolute inset-0 overflow-hidden bg-black text-white"
      >
        <Link
          href={`/${locale}/work/${caseStudy.slug}/`}
          className="absolute inset-0 block"
        >
          <motion.div
            className="absolute inset-0 scale-125"
            style={reduceMotion ? undefined : { y: mediaY }}
          >
            {isNear ? (
              <MediaView
                media={caseStudy.cover}
                locale={locale}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-surface" />
            )}
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-black/45" />

          <div className="gutter absolute inset-0 flex flex-col justify-between py-10">
            <Reveal className="flex items-start justify-between gap-4">
              <p className="type-mono text-white/70">
                {pad(index + 1)} / {pad(totalCases)} · {caseStudy.year}
              </p>
              <p className="text-right">
                <span className="type-serif-display block text-4xl">
                  {metric.value}
                </span>
                <span className="type-mono text-white/70">
                  {metric.label[locale]}
                </span>
              </p>
            </Reveal>

            <Reveal delay={0.08}>
              <h3 className="type-display type-inktrap pt-[0.16em] text-[11vw] leading-[0.9]">
                {caseStudy.title[locale]}
              </h3>
              <p className="type-mono mt-3 text-white/70">
                {caseStudy.tags[locale].join(" • ")}
              </p>
              <span className="type-mono mt-6 inline-flex items-center gap-3 border border-white/40 px-6 py-3">
                {caseStudy.comingSoon ? dict.cases.comingSoon : dict.cases.viewCase}
                <span aria-hidden>→</span>
              </span>
            </Reveal>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}

function MobileCaseList({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const reduceMotion = useReducedMotion();

  // Sem respiro nem régua entre os cartões: cada um já ocupa a largura e
  // quase a altura inteira da tela (MOBILE_CARD_HEIGHT), então um espaço ou
  // uma borda entre eles só cortaria o "reel" contínuo de projeto em
  // projeto, a mesma leitura de painel cheio que a versão de desktop já
  // tem (lá também sem margem nem moldura entre fatias).
  return (
    <div className="flex flex-col sm:hidden">
      {cases.map((caseStudy, index) => (
        <MobileCaseCard
          key={caseStudy.slug}
          caseStudy={caseStudy}
          index={index}
          totalCases={cases.length}
          locale={locale}
          dict={dict}
          reduceMotion={!!reduceMotion}
        />
      ))}
    </div>
  );
}

// Ponto de entrada da seção: só decide qual versão montar. A versão de
// desktop mora inteira em `DesktopCasesGrid`, componente à parte (não um
// `if` no meio deste aqui) justamente para que o `useScroll` dela só exista
// enquanto o elemento que ela mede também existe (ver comentário no topo do
// arquivo).
export function CasesGrid({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const isDesktop = useMediaQuery("(min-width: 640px)");

  if (!isDesktop) {
    // Sem border-t: nas demais seções ela separa um bloco com respiro
    // próprio do anterior, mas aqui o primeiro cartão já entra colado ao
    // fim da hero, cheio da própria mídia (preta, de ponta a ponta), e uma
    // régua ali só recortaria essa mídia bem no topo, sem separar coisa
    // nenhuma que já não estivesse óbvio pela própria mudança de conteúdo.
    return (
      <section id="work" aria-label={dict.cases.title}>
        <MobileCaseList locale={locale} dict={dict} />
      </section>
    );
  }

  return <DesktopCasesGrid locale={locale} dict={dict} />;
}

function DesktopCasesGrid({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [expanding, setExpanding] = useState<{
    caseStudy: CaseStudy;
    rect: DOMRect;
  } | null>(null);
  // O trio de artistas sempre é uma fatia só (groupedSlides) na versão de
  // desktop: lado a lado a partir do lg:, empilhado dentro do mesmo painel
  // antes disso (ver SlidePanel). Reduz o scroll do trio a 1/3, em vez de
  // um projeto por tela inteira.
  const slides = groupedSlides;
  const { windows, total: sectionScreens } = slideWindows(slides.length);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Amortecimento da cena, não da rolagem (ver o comentário no topo do
  // arquivo). Os números foram medidos, não chutados: superamortecida o
  // suficiente pra nunca passar do ponto e voltar (passar do ponto no scroll
  // embrulha o estômago), com constante de tempo de ~0,12s, a mesma faixa do
  // lerp que as bibliotecas de scroll suave usam. Uma primeira tentativa,
  // bem mais pesada, levava mais de um segundo pra assentar depois de um
  // salto de uma tela: aí já não é inércia, é atraso, e a cena parece
  // engasgada em vez de fluida.
  //
  // restDelta explícito porque o valor amortecido aqui é um progresso de 0 a
  // 1 esticado por várias telas: o padrão do Framer (0.01) seria 1% da seção
  // INTEIRA, folga grande o bastante pra parar a mola com a fatia ainda
  // visivelmente fora do lugar.
  const reduceMotion = useReducedMotion();
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 13,
    mass: 0.35,
    restDelta: 0.0001,
  });
  const progress = reduceMotion ? scrollYProgress : smoothProgress;
  // Sem paralaxe pra quem pediu menos movimento no sistema.
  const parallax = reduceMotion ? 0 : 6;

  // A LÓGICA continua no scroll cru: qual fatia é clicável e recebe foco de
  // teclado não pode chegar uns décimos atrasada da mão de quem rola.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActiveIndex(activeSlideAt(v, windows));
  });

  // Selo "ver caso" que segue o cursor: um só pra seção inteira, não um por
  // coluna. Cada painel é absolute inset-0 (mesmo retângulo da tela pros
  // quatro), então a posição do cursor relativa à seção não muda quando o
  // scroll troca qual fatia está por cima, só o que está ATIVO embaixo dele
  // muda. Um selo por coluna, cada um com seu próprio estado de posição,
  // ficava para trás quando a rolagem trocava a fatia ativa sem o mouse se
  // mexer: o card que passava a ficar ativo nunca tinha recebido um
  // mousemove de verdade, então sua posição salva continuava a última (às
  // vezes a inicial, 0,0), o selo "pulava" pro canto errado até o próximo
  // movimento real do mouse. Centralizando aqui, a posição bruta do
  // ponteiro só é atualizada por um mousemove de verdade (sempre correta,
  // porque rolar sem mexer o mouse não muda onde ele está na tela), e o
  // alvo do hover é recalculado tanto a cada mousemove quanto sempre que a
  // fatia ativa muda (`refreshHoverAt` no efeito abaixo), usando a última
  // posição bruta conhecida.
  const pointerRawX = useMotionValue(0);
  const pointerRawY = useMotionValue(0);
  const leadX = useSpring(pointerRawX, { stiffness: 400, damping: 35, mass: 0.5 });
  const leadY = useSpring(pointerRawY, { stiffness: 400, damping: 35, mass: 0.5 });
  const labelX = useTransform(leadX, (v) => v + 80);
  const labelY = useTransform(leadY, (v) => v + 22);

  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const lastClientPos = useRef<{ x: number; y: number } | null>(null);

  const refreshHoverAt = useCallback((clientX: number, clientY: number) => {
    const el = document.elementFromPoint(clientX, clientY);
    const caseEl = el instanceof Element ? el.closest<HTMLElement>("[data-case-slug]") : null;
    setHoveredSlug(caseEl?.dataset.caseSlug ?? null);
  }, []);

  useEffect(() => {
    if (lastClientPos.current) {
      refreshHoverAt(lastClientPos.current.x, lastClientPos.current.y);
    }
  }, [activeIndex, refreshHoverAt]);

  function handleStickyMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerRawX.set(event.clientX - rect.left);
    pointerRawY.set(event.clientY - rect.top);
    lastClientPos.current = { x: event.clientX, y: event.clientY };
    refreshHoverAt(event.clientX, event.clientY);
  }

  function handleStickyMouseLeave() {
    lastClientPos.current = null;
    setHoveredSlug(null);
  }

  const hoveredCase = cases.find((c) => c.slug === hoveredSlug) ?? null;

  return (
    <section id="work" aria-label={dict.cases.title} className="border-t border-line">
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${sectionScreens * 100}vh` }}
      >
        <div
          className="sticky top-0 h-svh w-full overflow-hidden"
          onMouseMove={handleStickyMouseMove}
          onMouseLeave={handleStickyMouseLeave}
        >
          <div className="absolute inset-0">
            {slides.map((slide, index) => (
              <SlidePanel
                key={slide.map(({ caseStudy }) => caseStudy.slug).join("+")}
                slide={slide}
                totalCases={cases.length}
                locale={locale}
                dict={dict}
                index={index}
                windows={windows}
                progress={progress}
                parallax={parallax}
                isActive={index === activeIndex}
                isNearActive={Math.abs(index - activeIndex) <= 1}
                hoveredSlug={hoveredSlug}
                onExpand={(caseStudy, rect) => setExpanding({ caseStudy, rect })}
              />
            ))}
          </div>

          {/* A contagem já mora em cada card ("03 / 06", o índice do case na
              lista inteira), então o rodapé não repete outra em nível de
              fatia: só um lembrete de que rolar é a navegação, no lugar
              onde um contador "01 / 04" ficava antes. Os pontos continuam
              como leitura de posição (não navegação, não oferecem atalho de
              clique), animando a troca em vez de só saltar de um pro
              outro. */}
          <div className="gutter pointer-events-none absolute inset-x-0 bottom-8 z-20 flex items-center justify-between text-white">
            <span className="type-mono text-white/50">{dict.cases.scrollHint}</span>
            <div className="flex gap-2">
              {slides.map((slide, index) => (
                <motion.span
                  key={slide.map(({ caseStudy }) => caseStudy.slug).join("+")}
                  animate={{ scale: index === activeIndex ? 1.4 : 1 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === activeIndex ? "bg-white" : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Selo "ver caso": segue o cursor deslocado bem à direita e um
              pouco abaixo dele. Só desktop (hover real existe). O texto
              roda num letreiro horizontal contínuo, como uma placa
              luminosa antiga, na mesma mono dos fatos da hero ("UX/UI ·
              Webapps · Design Systems"): a pílula é uma janela de largura
              fixa (overflow-hidden), menor que o conteúdo, e a faixa lá
              dentro tem DUAS cópias do texto uma atrás da outra, separadas
              por um bullet com padding igual dos dois lados (não espaço
              literal, refém da fonte), andando de 0% a -50% pra sempre.
              Como as duas cópias são idênticas, o instante em que a
              primeira sai pela esquerda é exatamente o instante em que a
              segunda chega no início, o loop não tem costura. */}
          <motion.div
            aria-hidden
            style={{ x: labelX, y: labelY }}
            className="pointer-events-none absolute left-0 top-0 z-40 hidden sm:block"
          >
            <motion.div
              animate={{
                opacity: hoveredCase ? 1 : 0,
                scale: hoveredCase ? 1 : 0.6,
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-44 overflow-hidden bg-white py-2.5 text-black"
            >
              <motion.div
                className="type-mono flex w-max items-center whitespace-nowrap"
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 6, ease: "linear", repeat: Infinity }}
              >
                {[0, 1].map((copy) => (
                  <span key={copy} className="flex shrink-0 items-center">
                    <span aria-hidden className="px-3">
                      •
                    </span>
                    {hoveredCase
                      ? hoveredCase.comingSoon
                        ? dict.cases.comingSoon
                        : dict.cases.viewCase
                      : ""}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanding && (
          <ExpandedCase
            caseStudy={expanding.caseStudy}
            locale={locale}
            dict={dict}
            rect={expanding.rect}
            onClose={() => setExpanding(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
