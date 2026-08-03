"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

// A grade da hero desenhada em WebGL, reagindo ao cursor: o único uso de
// WebGL do site depois que a ondulação das capas dos cases saiu (ver
// CasesGrid). Escopo mínimo, pelo mesmo critério de sempre: um triângulo
// cheio de tela e um fragment shader, sem three.js nem nenhuma biblioteca.
//
// O efeito é uma lente de verdade, não um brilho decorativo: perto do cursor
// as colunas são empurradas pra fora, como vidro convexo pousado sobre papel
// quadriculado, e ganham um pouco mais de presença. Isso dá razão física à
// lente que a hero já tem: ela inverte o texto E entorta a grade atrás,
// em vez de ser só um círculo que troca as cores.
//
// A amplitude e o alcance vêm do MESMO raio que já rege a lente do texto
// (`lensRadius`, uma mola em Hero.tsx), então tudo acontece de graça: em tela
// de toque o raio nunca sai de zero (nenhum mousemove dispara), e perto do
// CTA, onde o raio encolhe pra ceder o palco ao clique, a deformação encolhe
// junto. Nenhuma regra nova, nenhum segundo estado de cursor.
//
// A cor não é passada por prop: sai de `getComputedStyle(canvas).color`, ou
// seja, `currentColor`. Na cópia normal isso é a tinta do tema; na cópia
// dentro da lente, a regra `.lens-invert * { color: var(--background) }` que
// já existe pro texto resolve o canvas junto, sem precisar de uma segunda
// versão nem de um `invert` por cima. A intensidade sai de
// `--hero-grid-alpha` pelo mesmo caminho, então claro e escuro continuam
// calibrados em um lugar só (globals.css), junto com a versão sem WebGL.
//
// O loop dorme: só roda durante a animação de entrada e enquanto o cursor
// ainda mexe alguma coisa (posição ou raio, os dois molas). Parado, custo
// zero. Fora da tela também, via IntersectionObserver: a hero é a primeira
// dobra, quem rolou pra baixo não paga por ela.

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Coordenadas em px CSS com origem no canto superior esquerdo (gl_FragCoord
// vem em px de dispositivo e com origem embaixo, por isso a conversão).
const FRAGMENT_SRC = `
precision highp float;

uniform vec2 uSize;      // canvas em px CSS
uniform float uDpr;
uniform float uGutter;   // margem lateral, a mesma do .gutter
uniform float uColumns;
uniform vec3 uRows;      // alturas das marcas de registro, 0 a 1
uniform vec2 uMouse;     // px CSS, origem no topo
uniform float uRadius;   // raio da lente em px CSS (0 = sem cursor)
uniform float uTime;     // segundos desde a montagem
uniform vec3 uColor;
uniform float uAlpha;
uniform float uEntry;    // 1 = anima a entrada, 0 = já nasce pronta

// Braço horizontal da marca de registro. O braço vertical é a própria coluna
// passando por trás, então cada marca é um traço só, não uma cruz montada
// com dois elementos.
float registryTick(float rowY, float y, float distToColumn) {
  float arm = 1.0 - smoothstep(0.5, 1.4, abs(y - rowY));
  float span = 1.0 - smoothstep(5.0, 6.5, distToColumn);
  return arm * span;
}

void main() {
  vec2 device = gl_FragCoord.xy / uDpr;
  vec2 p = vec2(device.x, uSize.y - device.y);

  // A lente empurra as colunas pra FORA do cursor. Como o shader é
  // amostrado por pixel, o empurrão se faz lendo a grade num ponto puxado na
  // direção contrária: o que aparece em p é o que a grade tem em q.
  //
  // O perfil do empurrão precisa zerar NO cursor, não ser máximo ali: com
  // uma gaussiana pura (máxima no centro) todos os pixels em volta do ponteiro
  // são deslocados pela mesma distância em direções opostas, então muitos
  // caem no mesmo q e as linhas se juntam numa estrela no meio, artefato de
  // amostragem, não de lente. A distância vezes a gaussiana zera no centro,
  // sobe até o pico e decai: é o perfil de uma lente convexa de verdade, que
  // não desloca
  // nada exatamente no eixo ótico e desloca mais no meio do caminho até a
  // borda.
  //
  // A amplitude e o alcance saem os dois do raio, então a deformação some
  // sozinha quando o raio vai a zero (cursor fora da hero, ou tela de toque,
  // onde ele nunca sai de zero).
  vec2 toMouse = p - uMouse;
  float dist = length(toMouse);
  float sigma = max(uRadius, 1.0) * 0.65;
  float falloff = exp(-(dist * dist) / (2.0 * sigma * sigma));
  float push = (dist / sigma) * falloff;
  vec2 dir = dist > 0.001 ? toMouse / dist : vec2(0.0);
  vec2 q = p - dir * push * uRadius * 0.42;

  float columnWidth = (uSize.x - 2.0 * uGutter) / uColumns;
  float column = clamp(floor((q.x - uGutter) / columnWidth + 0.5), 0.0, uColumns);
  float distToColumn = abs(q.x - (uGutter + column * columnWidth));

  // Fio de um pixel com uma borda de antisserrilhado. Sem isso a linha
  // cintila (aparece e some) conforme a deformação a arrasta pelo pixel.
  float line = 1.0 - smoothstep(0.5, 1.35, distToColumn);

  vec3 rowsY = uRows * uSize.y;
  float tick = max(
    max(registryTick(rowsY.x, q.y, distToColumn), registryTick(rowsY.y, q.y, distToColumn)),
    registryTick(rowsY.z, q.y, distToColumn)
  );

  // Entrada: cada coluna se desenha do topo pra baixo, escalonada da
  // esquerda pra direita, e as marcas entram depois que as linhas chegam.
  // Medida em p, não em q: a coreografia de entrada é da composição, não
  // acompanha a deformação do cursor.
  float ny = p.y / uSize.y;
  float drawn = clamp((uTime - (0.2 + column * 0.06)) / 1.2, 0.0, 1.0);
  drawn = 1.0 - pow(1.0 - drawn, 3.0);
  float reveal = 1.0 - smoothstep(drawn - 0.02, drawn + 0.02, ny);
  float ticked = clamp((uTime - (0.9 + column * 0.04)) / 0.6, 0.0, 1.0);
  reveal = mix(1.0, reveal, uEntry);
  ticked = mix(1.0, ticked, uEntry);

  // Perto do cursor a grade também ganha presença: a lente não só entorta,
  // concentra. Aqui a gaussiana cheia serve (é intensidade, não
  // deslocamento), com o pico no ponteiro.
  float glow = 1.0 + falloff * 1.5;

  float ink = (line + tick * ticked) * reveal * uAlpha * glow;
  ink = clamp(ink, 0.0, 1.0);
  gl_FragColor = vec4(uColor * ink, ink);
}
`;

const ROWS: [number, number, number] = [0.28, 0.5, 0.72];
/** Depois disso a entrada acabou e o loop pode dormir se nada mais se mexe. */
const ENTRY_SECONDS = 2.6;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

/** "rgb(11, 11, 11)" para [0.043, 0.043, 0.043]. */
function parseColor(value: string): [number, number, number] {
  const parts = value.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return [0, 0, 0];
  return [Number(parts[0]) / 255, Number(parts[1]) / 255, Number(parts[2]) / 255];
}

export function HeroGridGL({
  mirrored,
  pointerX,
  pointerY,
  lensRadius,
  sectionRef,
  onUnsupported,
  onDrawing,
}: {
  /** Cópia dentro da lente: entra pronta, sem repetir a animação. */
  mirrored?: boolean;
  /** Posição do cursor relativa à SEÇÃO (as molas de Hero.tsx). */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** Raio da lente, a mesma mola que rege a inversão do texto. */
  lensRadius: MotionValue<number>;
  sectionRef: React.RefObject<HTMLElement | null>;
  /** Chamado uma vez se o WebGL não subir: quem chama volta pra grade em DOM. */
  onUnsupported: () => void;
  /** Chamado no primeiro quadro desenhado de verdade, e só então a grade em
   *  DOM some: escondê-la já no primeiro render abriria uma janela de hero
   *  sem fundo enquanto o contexto WebGL é criado. */
  onDrawing: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const gl = canvas.getContext("webgl", { antialias: false, alpha: true });
    if (!gl) {
      onUnsupported();
      return;
    }

    const program = createProgram(gl);
    if (!program) {
      onUnsupported();
      return;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uSize = uniform("uSize");
    const uDpr = uniform("uDpr");
    const uGutter = uniform("uGutter");
    const uColumns = uniform("uColumns");
    const uRows = uniform("uRows");
    const uMouse = uniform("uMouse");
    const uRadius = uniform("uRadius");
    const uTime = uniform("uTime");
    const uColor = uniform("uColor");
    const uAlpha = uniform("uAlpha");
    const uEntry = uniform("uEntry");

    gl.enable(gl.BLEND);
    // Alpha pré-multiplicado: é o que o shader emite (uColor * ink, ink) e o
    // que o compositor do navegador espera de um canvas com alpha.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let width = 0;
    let height = 0;
    let dpr = 1;
    let gutter = 0;
    let columns = 8;
    let color: [number, number, number] = [0, 0, 0];
    let alpha = 0.16;
    /** Deslocamento do canvas dentro da seção: as molas do cursor são
     *  medidas a partir da seção, e o canvas mora dentro dela. Na prática dá
     *  quase zero, mas medir é barato e não depende do layout continuar
     *  exatamente como está hoje. */
    let offsetX = 0;
    let offsetY = 0;

    let rafId = 0;
    let running = false;
    let visible = true;
    let destroyed = false;
    let start = 0;
    let lastX = Number.NaN;
    let lastY = Number.NaN;
    let lastRadius = Number.NaN;
    let announced = false;

    function readTheme() {
      if (!canvas) return;
      const style = getComputedStyle(canvas);
      color = parseColor(style.color);
      const declared = Number(style.getPropertyValue("--hero-grid-alpha"));
      if (Number.isFinite(declared) && declared > 0) alpha = declared;
    }

    function measure() {
      if (!canvas || !parent || !gl) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gutter = parseFloat(getComputedStyle(parent).paddingLeft) || 0;
      // Abaixo do breakpoint sm as colunas ímpares somem, mesma conta da
      // versão em DOM: oito colunas viram quatro em tela estreita.
      columns = window.matchMedia("(min-width: 640px)").matches ? 8 : 4;

      const section = sectionRef.current;
      if (section) {
        const canvasBox = canvas.getBoundingClientRect();
        const sectionBox = section.getBoundingClientRect();
        offsetX = canvasBox.left - sectionBox.left;
        offsetY = canvasBox.top - sectionBox.top;
      }
    }

    function draw(now: number) {
      if (destroyed || !gl || !canvas) return;
      if (!start) start = now;
      const elapsed = (now - start) / 1000;

      const x = pointerX.get() - offsetX;
      const y = pointerY.get() - offsetY;
      const radius = lensRadius.get();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uSize, width, height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform1f(uGutter, gutter);
      gl.uniform1f(uColumns, columns);
      gl.uniform3f(uRows, ROWS[0], ROWS[1], ROWS[2]);
      gl.uniform2f(uMouse, x, y);
      gl.uniform1f(uRadius, radius);
      gl.uniform1f(uTime, elapsed);
      gl.uniform3f(uColor, color[0], color[1], color[2]);
      gl.uniform1f(uAlpha, alpha);
      gl.uniform1f(uEntry, mirrored ? 0 : 1);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!announced) {
        announced = true;
        onDrawing();
      }

      // Dorme quando a entrada acabou, o cursor não mexeu nada desde o
      // quadro anterior e a lente já está fechada. Qualquer mudança nas
      // molas acorda o loop de novo (assinaturas abaixo).
      const still = x === lastX && y === lastY && radius === lastRadius;
      lastX = x;
      lastY = y;
      lastRadius = radius;
      if (still && radius < 0.5 && (mirrored || elapsed > ENTRY_SECONDS)) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(draw);
    }

    function wake() {
      if (running || destroyed || !visible) return;
      running = true;
      rafId = requestAnimationFrame(draw);
    }

    readTheme();
    measure();
    wake();

    const resizeObserver = new ResizeObserver(() => {
      measure();
      wake();
    });
    resizeObserver.observe(parent);

    // A hera é a primeira dobra: quem rolou pra baixo não paga o loop.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    // Troca de tema (claro/escuro, e o Modo Boring, que também mexe no
    // <html>): a cor e a intensidade vêm do CSS, então basta reler.
    const themeObserver = new MutationObserver(() => {
      readTheme();
      wake();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-boring"],
    });

    const unsubscribe = [
      pointerX.on("change", wake),
      pointerY.on("change", wake),
      lensRadius.on("change", wake),
    ];

    return () => {
      destroyed = true;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      for (const stop of unsubscribe) stop();
      gl.deleteProgram(program);
      gl.deleteBuffer(buffer);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [mirrored, pointerX, pointerY, lensRadius, sectionRef, onUnsupported, onDrawing]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="hero-grid-gl no-print absolute inset-0 h-full w-full"
    />
  );
}
