"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Habilidades como uma fita presa ao cursor: em repouso, tags quadradas na
// grade normal (flex-wrap). O gatilho é a dobra "sobre" inteira (sectionRef),
// não só a área das tags, então o efeito funciona mesmo com o mouse passando
// por cima da bio ou do resto da coluna. Entrar na dobra não libera captura
// na hora: só depois de ACTIVATE_DELAY_MS parado ali, pra quem só está de
// passagem (rolando a página) não ver caixa nenhuma se mexer. Cada tag só
// entra na fila quando o cursor passa por CIMA da própria caixa dela
// (bounding box + uma margem pequena, não um raio largo): é o que garante
// que nenhuma tag se solte antes da hora, nem que passar perto de uma
// capture as vizinhas de carona. Cada tag capturada vira um elo de uma
// corrente que pende abaixo do mouse, ligado
// ao elo anterior por uma linha fina, cada um perseguindo a posição do elo à
// frente com o mesmo atraso (mesma mola de sempre), o que dá o chicote de
// cobra/fita reagindo à velocidade do mouse: quanto mais rápido o cursor se
// move, mais a cauda atrasa e estica. A frase aparece acima do cursor (nunca
// em cima da corrente, que pende pra baixo) por dois gatilhos, o que vier
// primeiro: 5 segundos depois da primeira captura (pra quem só brinca com
// uma ou duas tags, sem varrer a dobra inteira), ou assim que a última tag
// entra na corrente (a recompensa de quem coletou todas). As caixas têm fundo sólido
// (bg-background) de propósito: sem isso a linha por trás delas atravessa o
// meio da caixa em vez de só ligar uma à outra.
//
// rAF com escrita direta no DOM (style.transform, sem state por quadro),
// mesmo raciocínio de InteractiveGridImage e HeroTitleGL: são ~15 elementos
// animando toda hora que o cursor se move, e passar isso por state do React
// recriaria o componente inteiro a cada quadro.
// px de margem além da própria caixa da tag, pra não exigir precisão de
// pixel: precisa ficar abaixo de metade do gap-2 (8px) do flex-wrap, senão a
// margem de duas tags vizinhas na mesma linha se sobrepõe no meio do vão e
// as duas capturam juntas.
const CAPTURE_PAD = 3;
// px do mouse até a primeira caixa: maior que LINK_SPACING de propósito. O
// cursor personalizado (ver cursor/hover.webp) é uma mãozinha de 56x63 com o
// hotspot no topo, então ela ocupa quase 63px abaixo da posição real do
// mouse; com o mesmo espaçamento dos outros elos, a primeira caixa nascia
// tampada pela própria mão.
const FIRST_LINK_SPACING = 68;
const LINK_SPACING = 40; // px, distância entre os demais elos da corrente
const EASE = 0.2; // suavização por quadro: quanto maior, mais rígido; a cauda ainda atrasa porque o alvo de cada elo é a posição já suavizada do anterior
const ACTIVATE_DELAY_MS = 1000; // tempo parado na dobra antes da corrente poder capturar qualquer tag
const MESSAGE_DELAY_MS = 5000; // tempo desde a primeira captura até a frase aparecer, se a coleção completa não chegar antes
const MESSAGE_COMPLETE_DELAY_MS = 350; // tempo depois da ÚLTIMA captura até a frase aparecer, mesmo raciocínio
const MESSAGE_OFFSET = 28; // px acima do cursor
const LINE_OPACITY = 0.35;

const mobileTagVariants = {
  hidden: { opacity: 0, y: 14, rotate: -3 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { delay: i * 0.045, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export function SkillsOrbit({
  skills,
  message,
  sectionRef,
}: {
  skills: string[];
  message: string;
  sectionRef: RefObject<HTMLElement | null>;
}) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const lineRefs = useRef<(SVGLineElement | null)[]>([]);
  const messageRef = useRef<HTMLDivElement>(null);

  const [revealMessage, setRevealMessage] = useState(false);
  // Sem hover de verdade em touch, o gatilho da corrente nunca dispara: em
  // troca, telas sem ponteiro fino ganham uma entrada em cascata (cada tag
  // "pousa" na grade com seu próprio atraso), pra essa dobra não ficar tão
  // parada no mobile quanto no desktop.
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: none), (pointer: coarse)");
    const sync = () => setIsCoarsePointer(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    // Sem hover de verdade em touch, a corrente nunca capturava nada mesmo
    // antes desta checagem (mousemove/mouseenter não disparam lá), mas o
    // efeito ainda montava os listeners e o rAF à toa; agora nem monta,
    // então a linha (sempre presente no DOM, só invisível por padrão)
    // nunca corre risco de acender sozinha num evento de mouse sintético
    // que algum navegador touch dispare num toque.
    if (reduceMotion || isCoarsePointer) return;
    const section = sectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;

    let raf = 0;
    let active = false;
    let activateTimer: number | null = null;
    let revealTimer: number | null = null;
    let revealScheduled = false;
    let completeScheduled = false;

    const mouse = { x: 0, y: 0 };
    // Posição e metade do tamanho "de repouso" de cada tag, relativa ao
    // container das tags: medida de novo sempre que o mouse entra na dobra,
    // porque o layout (flex-wrap) muda com a largura da tela e não dá pra
    // confiar numa medida antiga.
    const natural: { x: number; y: number; halfW: number; halfH: number }[] = [];
    const current = skills.map(() => ({ x: 0, y: 0 }));
    const captured = new Set<number>();
    const capturedOrder: number[] = [];
    const chainPos = new Map<number, number>();

    function measureNatural() {
      const containerBox = container!.getBoundingClientRect();
      natural.length = 0;
      for (const el of tagRefs.current) {
        if (!el) continue;
        const prevTransform = el.style.transform;
        el.style.transform = "";
        const box = el.getBoundingClientRect();
        el.style.transform = prevTransform;
        natural.push({
          x: box.left - containerBox.left + box.width / 2,
          y: box.top - containerBox.top + box.height / 2,
          halfW: box.width / 2,
          halfH: box.height / 2,
        });
      }
    }

    function reset() {
      active = false;
      if (activateTimer !== null) {
        window.clearTimeout(activateTimer);
        activateTimer = null;
      }
      captured.clear();
      capturedOrder.length = 0;
      chainPos.clear();
      revealScheduled = false;
      completeScheduled = false;
      if (revealTimer !== null) {
        window.clearTimeout(revealTimer);
        revealTimer = null;
      }
      setRevealMessage(false);
    }

    function onMouseMove(event: MouseEvent) {
      const containerBox = container!.getBoundingClientRect();
      mouse.x = event.clientX - containerBox.left;
      mouse.y = event.clientY - containerBox.top;
    }

    function onMouseEnter() {
      measureNatural();
      activateTimer = window.setTimeout(() => {
        active = true;
        activateTimer = null;
      }, ACTIVATE_DELAY_MS);
    }

    function onMouseLeave() {
      reset();
    }

    function frame() {
      if (active) {
        const hadCapture = capturedOrder.length > 0;

        skills.forEach((_, i) => {
          if (captured.has(i)) return;
          const rest = natural[i];
          if (!rest) return;
          const withinX = Math.abs(mouse.x - rest.x) <= rest.halfW + CAPTURE_PAD;
          const withinY = Math.abs(mouse.y - rest.y) <= rest.halfH + CAPTURE_PAD;
          if (withinX && withinY) {
            captured.add(i);
            capturedOrder.push(i);
            chainPos.set(i, capturedOrder.length - 1);
          }
        });

        if (!hadCapture && capturedOrder.length > 0 && !revealScheduled) {
          revealScheduled = true;
          revealTimer = window.setTimeout(() => {
            if (capturedOrder.length < skills.length) setRevealMessage(true);
          }, MESSAGE_DELAY_MS);
        }

        if (capturedOrder.length === skills.length && !completeScheduled) {
          completeScheduled = true;
          window.setTimeout(() => setRevealMessage(true), MESSAGE_COMPLETE_DELAY_MS);
        }
      }

      capturedOrder.forEach((i, k) => {
        const rest = natural[i];
        if (!rest) return;
        let targetAbsX: number;
        let targetAbsY: number;
        if (k === 0) {
          targetAbsX = mouse.x;
          targetAbsY = mouse.y + FIRST_LINK_SPACING;
        } else {
          const prevI = capturedOrder[k - 1];
          const prevRest = natural[prevI];
          targetAbsX = prevRest.x + current[prevI].x;
          targetAbsY = prevRest.y + current[prevI].y + LINK_SPACING;
        }
        const targetDeltaX = targetAbsX - rest.x;
        const targetDeltaY = targetAbsY - rest.y;
        current[i].x += (targetDeltaX - current[i].x) * EASE;
        current[i].y += (targetDeltaY - current[i].y) * EASE;
      });

      skills.forEach((_, i) => {
        if (captured.has(i)) return;
        current[i].x += (0 - current[i].x) * EASE;
        current[i].y += (0 - current[i].y) * EASE;
      });

      skills.forEach((_, i) => {
        const el = tagRefs.current[i];
        if (el) el.style.transform = `translate(${current[i].x}px, ${current[i].y}px)`;

        const line = lineRefs.current[i];
        if (!line) return;
        const rest = natural[i];
        if (!rest || !captured.has(i)) {
          line.style.opacity = "0";
          return;
        }
        const k = chainPos.get(i) ?? 0;
        const absX = rest.x + current[i].x;
        const absY = rest.y + current[i].y;
        let fromX: number;
        let fromY: number;
        if (k === 0) {
          fromX = mouse.x;
          fromY = mouse.y;
        } else {
          const prevI = capturedOrder[k - 1];
          const prevRest = natural[prevI];
          fromX = prevRest.x + current[prevI].x;
          fromY = prevRest.y + current[prevI].y;
        }
        line.setAttribute("x1", String(fromX));
        line.setAttribute("y1", String(fromY));
        line.setAttribute("x2", String(absX));
        line.setAttribute("y2", String(absY));
        line.style.opacity = String(LINE_OPACITY);
      });

      const messageEl = messageRef.current;
      if (messageEl) {
        messageEl.style.transform = `translate(${mouse.x}px, ${mouse.y - MESSAGE_OFFSET}px) translate(-50%, -100%)`;
      }

      raf = requestAnimationFrame(frame);
    }

    section.addEventListener("mousemove", onMouseMove);
    section.addEventListener("mouseenter", onMouseEnter);
    section.addEventListener("mouseleave", onMouseLeave);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      if (activateTimer !== null) window.clearTimeout(activateTimer);
      if (revealTimer !== null) window.clearTimeout(revealTimer);
      section.removeEventListener("mousemove", onMouseMove);
      section.removeEventListener("mouseenter", onMouseEnter);
      section.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [skills, reduceMotion, sectionRef, isCoarsePointer]);

  // Quem pede menos movimento no sistema recebe as tags paradas na grade,
  // sem linha, sem corrente, sem mensagem: mesma vitrine, sem o movimento.
  if (reduceMotion) {
    return (
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className="type-mono inline-block border border-line bg-background px-3 py-1.5"
          >
            {skill}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-wrap gap-2">
      <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
        {skills.map((skill, i) => (
          <line
            key={skill}
            ref={(el) => {
              lineRefs.current[i] = el;
            }}
            stroke="currentColor"
            strokeWidth={1}
            className="text-muted transition-opacity duration-300"
            style={{ opacity: 0 }}
          />
        ))}
      </svg>

      {skills.map((skill, i) => (
        <motion.span
          key={skill}
          ref={(el) => {
            tagRefs.current[i] = el;
          }}
          className="type-mono relative inline-block border border-line bg-background px-3 py-1.5"
          custom={i}
          initial={isCoarsePointer ? "hidden" : false}
          whileInView={isCoarsePointer ? "visible" : undefined}
          viewport={{ once: true, amount: 0.4 }}
          variants={mobileTagVariants}
        >
          {skill}
        </motion.span>
      ))}

      <AnimatePresence>
        {revealMessage && (
          <motion.div
            aria-hidden
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute left-0 top-0 z-10"
          >
            {/* Sem .type-mono aqui de propósito (mesmo critério do tooltip
                em BoringToggle e da descrição no menu): a classe força caixa
                alta, e essa frase é comprida demais pra ler bem em versal.
                Fonte mono só no family. */}
            <div
              ref={messageRef}
              className="inline-flex items-center whitespace-nowrap border border-line bg-background px-6 py-3 font-mono text-sm tracking-wide"
            >
              {message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
