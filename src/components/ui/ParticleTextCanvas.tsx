"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

// Prévia leve, local, de um nome em partículas: a mesma linguagem visual
// que Ganwalk e Pink Opala usam de verdade (texto amostrado em pixels,
// virando partículas), reconstruída em Canvas 2D simples, sem WebGL. Existe
// pra tirar o peso de embutir os sites de verdade num iframe sempre montado
// no card do trio (três contextos de WebGL/Three.js/áudio simultâneos, só
// pra uma prévia) — a versão completa, com todos os efeitos de verdade,
// continua um clique de distância (LiveEmbed, no corpo do case).
//
// A física de partículas (Pink Opala, `interactive`) é a mesma de verdade
// do site publicado, portada de ganwalk/pinkopala (index.htm,
// animateSand()), não uma aproximação: velocidade acumulada por partícula
// (não um lerp direto de posição), repulsão como impulso, mola de retorno
// com constante variável (fraca perto do destino, forte longe), atrito por
// quadro, e a mesma troca de cor gradual (branco → `highlightColor`) nas
// partículas perturbadas, com a queda bem mais lenta que a subida
// (COLOR_RISE vs COLOR_DECAY) — o rastro rosa que persiste um instante
// depois do cursor já ter passado, igual no site real.
//
// Três diferenças deliberadas do site real, as três pra uma PRÉVIA pequena
// e sempre visível fazer sentido (o site inteiro é full-bleed, só reage a
// hover de verdade):
// 1. Sem o materializar de entrada (partículas espalhadas assentando na
//    primeira rodada de frames): leva vários segundos pra ficar nítido,
//    bom numa página cheia visitada uma vez, ruim num card pequeno que já
//    chega pronto (monta de cara, mesmo fora de tela, ver embaixo) e pode
//    remontar mais de uma vez numa sessão. Nasce direto no destino.
// 2. Respiro ambiente sutil (IDLE_AMPLITUDE) por cima do destino da mola,
//    mesmo fora do hover: sem ele, o cartão parado (sem interação) ficava
//    com uma imagem 100% estática, destoando do resto do trio.
// 3. Sem hover de verdade (toque, ver `hoverCapable`), o ponto de repulsão
//    vira sintético e varre a tela sozinho num Lissajous, reaproveitando a
//    mesma física — no site cheio, o próprio dedo faz esse papel via
//    touchmove; aqui, um cartão pequeno na home raramente recebe um toque
//    que caia bem em cima do texto.
//
// IntersectionObserver pausa o loop de animação fora de tela: útil aqui
// porque o card do trio monta de cara, mesmo antes do scroll alcançar
// ele (ver CasesGrid.tsx), então nada impede o visitante de nunca chegar
// perto o bastante pra essas partículas ficarem visíveis.

const GAP = 4;
const IDLE_AMPLITUDE = 1.4;
const REPULSE_RADIUS = 70;
// Física de mola/velocidade real, portada de ganwalk/pinkopala (index.htm,
// animateSand): não é a mesma coisa que um lerp direto de posição (o que
// existia aqui antes). Cada partícula acumula velocidade (impulso da
// repulsão, puxão da mola de volta à origem, atrito), então uma passada
// perto do cursor deixa rastro: a partícula continua em movimento (e ainda
// mudando de cor) por um instante depois do cursor já ter saído do raio,
// em vez de simplesmente parar.
const REPULSE_FORCE = 10;
const SPRING_FAR = 0.045;
const SPRING_NEAR = 0.003;
const SPRING_NEAR_THRESHOLD_SQ = 64; // 8px: abaixo disso, mola fraca (assentar sem trepidar)
const DAMPING = 0.88;
const COLOR_RISE = 0.15;
const COLOR_DECAY = 0.015;

interface Particle {
  ox: number;
  oy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  mass: number;
  seed: number;
  colorFactor: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function ParticleTextCanvas({
  lines,
  color,
  background,
  interactive = false,
  highlightColor,
  className = "",
}: {
  lines: string[];
  color: string;
  background: string;
  /** Repulsão de partículas perto do cursor de verdade, escutado direto
   *  neste componente (sem repasse entre janelas: tudo mora aqui). Em
   *  aparelho sem hover de verdade (toque), o ponto de repulsão vira
   *  sintético e varre a tela sozinho (ver `hoverCapable` no efeito). */
  interactive?: boolean;
  /** Cor de destaque das partículas perturbadas (ver colorFactor):
   *  interpola de `color` até esta, e volta, bem mais devagar que o
   *  assentamento físico. Sem valor, não há troca de cor (fica só em
   *  `color`, o comportamento de antes desta prop existir). */
  highlightColor?: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  // Posição do ponteiro em coordenadas de VIEWPORT (clientX/clientY crus),
  // não relativas ao container: o container pode se mover por baixo de um
  // cursor parado (paralaxe de scroll em CasesGrid, ver mediaY), e uma
  // posição relativa guardada no momento do pointermove ficaria PRESA à
  // rect de então, saindo do eixo do cursor de verdade assim que o
  // container terminasse de se mexer sem nenhum movimento novo do mouse
  // pra corrigir. Convertida pra espaço local só no momento de pintar (ver
  // paint, abaixo), contra a rect ATUAL, sempre.
  const pointerRef = useRef({ x: -9999, y: -9999 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number | null = null;
    let visible = true;
    let width = 0;
    let height = 0;
    let dpr = 1;

    function buildParticles() {
      // clientWidth/clientHeight, não getBoundingClientRect: o container
      // pode morar dentro de um ancestral com `transform: scale()` (o
      // paralaxe de scroll do card do trio, ver mediaScale em
      // CasesGrid.tsx), e getBoundingClientRect devolve o tamanho VISUAL já
      // escalado, não o de layout. Nesse card, o canvas herdava esse
      // tamanho inflado como largura/altura EXPLÍCITAS (via style, que
      // vence o h-full/w-full da classe), maior que a caixa de layout real
      // do próprio container, e a mesma escala do ancestral esticava esse
      // excesso de novo por cima: o texto acabava desenhado bem maior que
      // a janela visível, cortando "OPALA" pra fora. clientWidth/Height é
      // sempre o tamanho de LAYOUT (nunca afetado por transform, do
      // elemento ou de qualquer ancestral), então o canvas sempre cabe
      // exatamente no container, e a escala do ancestral (quando existe)
      // amplia o conjunto inteiro de forma uniforme, sem cortar nada.
      const nextWidth = Math.max(1, container!.clientWidth);
      const nextHeight = Math.max(1, container!.clientHeight);
      // ResizeObserver mede a content-box em subpixel, e ela oscila (ex.:
      // 466 vira 465.67) por causa do paralaxe de scroll na mesma coluna
      // (ver comentário acima), mesmo sem o tamanho ARREDONDADO mudar de
      // verdade. Sem essa guarda, cada disparo reconstruía o canvas do
      // zero, e reatribuir canvas.width/height LIMPA o bitmap na hora,
      // mesmo pro mesmo valor de sempre: lido como uma piscada preta toda
      // vez que o cursor entrava na prévia (o hover é o que mexe o
      // paralaxe o bastante pra cruzar um limite de subpixel).
      if (nextWidth === width && nextHeight === height && particlesRef.current.length > 0) {
        return;
      }
      width = nextWidth;
      height = nextHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = width * dpr;
      canvas!.height = height * dpr;
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;

      const off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      const offCtx = off.getContext("2d", { willReadFrequently: true });
      if (!offCtx) return;

      // Cabe de verdade, medido, não chutado: a largura real de cada linha
      // varia por fonte e por peso (glifos largos como "M" e estreitos
      // como "I" não rendem numa razão fixa de caractere-por-pixel), e um
      // fator fixo (0.62, valor antigo) cortava a última letra de "PINK"
      // pra fora do canvas sempre que a fonte de verdade ficava mais larga
      // que a estimativa. Desenha uma vez num tamanho de partida, mede a
      // linha mais larga de verdade (measureText), e escala o tamanho da
      // fonte pela razão entre o espaço disponível e essa largura medida.
      const longest = Math.max(...lines.map((l) => l.length), 1);
      let fontSize = Math.max(8, Math.round(width / (longest * 0.62)));
      offCtx.fillStyle = "#fff";
      offCtx.textAlign = "center";
      offCtx.textBaseline = "middle";

      const widthBudget = width * 0.92;
      const heightBudget = height * 0.85;
      offCtx.font = `900 ${fontSize}px "Archivo Black", "Inter", sans-serif`;
      const measuredWidth = Math.max(
        ...lines.map((line) => offCtx.measureText(line).width),
        1,
      );
      const widthScale = widthBudget / measuredWidth;
      const heightScale = heightBudget / (fontSize * 1.05 * lines.length);
      fontSize = Math.max(8, Math.floor(fontSize * Math.min(widthScale, heightScale)));
      offCtx.font = `900 ${fontSize}px "Archivo Black", "Inter", sans-serif`;

      const lineHeight = fontSize * 1.05;
      const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => offCtx.fillText(line, width / 2, startY + i * lineHeight));

      const data = offCtx.getImageData(0, 0, width, height).data;
      const particles: Particle[] = [];
      for (let y = 0; y < height; y += GAP) {
        for (let x = 0; x < width; x += GAP) {
          const alpha = data[(y * width + x) * 4 + 3];
          if (alpha > 128) {
            // Nascem já no destino, não espalhadas: o site real materializa
            // o texto assim no carregamento (ver ganwalk/pinkopala,
            // index.htm), mas aqui é uma prévia pequena, sempre visível
            // mesmo antes do scroll alcançá-la (ver CasesGrid.tsx) — um
            // texto que leva vários segundos pra ficar nítido de novo toda
            // vez que o card remonta lia como quebrado, não como efeito.
            particles.push({
              ox: x,
              oy: y,
              x,
              y,
              vx: 0,
              vy: 0,
              size: Math.random() * 1.1 + 0.9,
              mass: Math.random() * 0.6 + 0.4,
              seed: Math.random() * Math.PI * 2,
              colorFactor: 0,
            });
          }
        }
      }
      particlesRef.current = particles;
    }

    buildParticles();
    const resizeObserver = new ResizeObserver(buildParticles);
    resizeObserver.observe(container);

    function handlePointerMove(event: PointerEvent) {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    }
    function handlePointerLeave() {
      pointerRef.current = { x: -9999, y: -9999 };
    }
    // Toque não tem hover de verdade: sem isso, quem usa o celular nunca via
    // as partículas se afastarem e assentarem de novo, o efeito inteiro que
    // dá sentido a `interactive`, porque nenhum pointermove passivo chega a
    // disparar. Em vez de esperar por um cursor que não existe, o próprio
    // ponto de repulsão vira sintético e varre a tela sozinho num Lissajous
    // (duas senoides com frequências primas entre si, sem período curto que
    // se repita de forma óbvia), reaproveitando a mesma física de
    // repulsão/retorno de sempre.
    const hoverCapable =
      typeof window.matchMedia === "function" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (interactive && !reduceMotion && hoverCapable) {
      container.addEventListener("pointermove", handlePointerMove);
      container.addEventListener("pointerleave", handlePointerLeave);
    }

    const [cr, cg, cb] = hexToRgb(color);
    const [hr, hg, hb] = highlightColor ? hexToRgb(highlightColor) : [cr, cg, cb];

    function paint(now: number) {
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.fillStyle = background;
      ctx!.fillRect(0, 0, width, height);

      const t = now / 1000;
      // Convertido pra espaço local aqui, contra a rect ATUAL do container,
      // não a de quando o pointermove disparou (ver comentário em
      // pointerRef): o eixo da repulsão fica preso na ponta do cursor de
      // verdade mesmo se o container se mover por baixo dele (paralaxe de
      // scroll, ver mediaY em CasesGrid) sem nenhum movimento novo do mouse.
      //
      // Escalado por width/rect.width (e o par em Y): a MESMA paralaxe de
      // scroll também aplica um `scale()` num ANCESTRAL do container (ver
      // mediaScale em CasesGrid.tsx), então rect (que reflete esse scale,
      // por herdar de todo ancestral) fica maior que o espaço de layout
      // onde as partículas realmente vivem (clientWidth/Height, nunca
      // afetado por transform, ver comentário em buildParticles). Sem essa
      // razão, um scale de +8% já bastava pra repulsão nascer alguns
      // pixels fora da ponta real do cursor, pior nas bordas: o efeito
      // "se deforma fora do ponteiro" relatado.
      let px = -9999;
      let py = -9999;
      if (interactive && hoverCapable && pointerRef.current.x !== -9999) {
        const rect = container!.getBoundingClientRect();
        px = (pointerRef.current.x - rect.left) * (width / rect.width);
        py = (pointerRef.current.y - rect.top) * (height / rect.height);
      } else if (interactive && !hoverCapable) {
        px = width / 2 + Math.sin(t * 0.31) * width * 0.42;
        py = height / 2 + Math.sin(t * 0.23) * height * 0.38;
      }

      for (const p of particlesRef.current) {
        // Destino da mola: a origem na trama do texto, com um respiro
        // ambiente sutil por cima (não existe no site real, ver as duas
        // diferenças deliberadas no topo do arquivo) pra prévia nunca
        // ficar 100% parada fora do hover.
        const targetX = p.ox + (reduceMotion ? 0 : Math.sin(t * 0.8 + p.seed) * IDLE_AMPLITUDE);
        const targetY = p.oy + (reduceMotion ? 0 : Math.cos(t * 0.8 + p.seed) * IDLE_AMPLITUDE);

        if (reduceMotion) {
          p.x = targetX;
          p.y = targetY;
        } else {
          if (interactive) {
            const dx = px - p.x;
            const dy = py - p.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < REPULSE_RADIUS * REPULSE_RADIUS) {
              const dist = Math.sqrt(distSq) || 0.0001;
              const force = (REPULSE_RADIUS - dist) / REPULSE_RADIUS;
              const inv = 1 / dist;
              p.vx -= dx * inv * force * (REPULSE_FORCE / p.mass);
              p.vy -= dy * inv * force * (REPULSE_FORCE / p.mass);
              p.colorFactor = Math.min(1, p.colorFactor + COLOR_RISE);
            } else if (p.colorFactor > 0) {
              p.colorFactor = Math.max(0, p.colorFactor - COLOR_DECAY);
            }
          }
          // Mola de volta ao destino: mais fraca perto dele (assenta sem
          // trepidar num círculo de 8px) e mais forte longe (puxa de volta
          // com vontade depois de uma repulsão forte). Atrito (DAMPING) a
          // cada quadro, não um retorno linear: é o que dá o overshoot e o
          // rastro (ver topo do arquivo) que faltavam na versão anterior
          // (um lerp direto de posição, sem velocidade).
          const ox = targetX - p.x;
          const oy = targetY - p.y;
          const distOriginSq = ox * ox + oy * oy;
          const springK = (distOriginSq > SPRING_NEAR_THRESHOLD_SQ ? SPRING_FAR : SPRING_NEAR) * p.mass;
          p.vx = (p.vx + ox * springK) * DAMPING;
          p.vy = (p.vy + oy * springK) * DAMPING;
          p.x += p.vx;
          p.y += p.vy;
        }

        if (p.colorFactor > 0) {
          const r = Math.round(cr + (hr - cr) * p.colorFactor);
          const g = Math.round(cg + (hg - cg) * p.colorFactor);
          const b = Math.round(cb + (hb - cb) * p.colorFactor);
          ctx!.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          ctx!.fillStyle = color;
        }
        ctx!.fillRect(p.x, p.y, p.size, p.size);
      }
    }

    function frame(now: number) {
      if (!visible) {
        raf = null;
        return;
      }
      paint(now);
      raf = requestAnimationFrame(frame);
    }

    if (reduceMotion) {
      paint(0);
    } else {
      const intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          if (visible && raf === null) raf = requestAnimationFrame(frame);
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(container);
      raf = requestAnimationFrame(frame);

      return () => {
        if (raf !== null) cancelAnimationFrame(raf);
        resizeObserver.disconnect();
        intersectionObserver.disconnect();
        if (interactive) {
          container.removeEventListener("pointermove", handlePointerMove);
          container.removeEventListener("pointerleave", handlePointerLeave);
        }
      };
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [lines, color, background, interactive, highlightColor, reduceMotion]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
    </div>
  );
}
