"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

// O nome da hero atravessado por uma lente que segue o cursor: onde o
// ponteiro passa, "ARMANDO CUSTODIO" entorta como se houvesse um vidro
// convexo pousado em cima dele. Único uso de WebGL do site, escopo mínimo de
// sempre (um triângulo cheio de tela e um fragment shader, sem three.js nem
// nenhuma biblioteca).
//
// A deformação já morou no fundo da hero, numa grade de colunas. O efeito era
// bom e o suporte era o errado: fio de um pixel a 14% de opacidade não tem
// massa suficiente pra uma lente valer a pena, e a grade em si acabou lida
// como papel quadriculado. Aqui a lente tem o que deformar: a manchete é o
// maior objeto da página e a coisa mais preta dela.
//
// A amplitude e o alcance vêm do MESMO raio que já rege a lente de inversão
// (`lensRadius`, uma mola em Hero.tsx), então tudo acontece de graça: em tela
// de toque o raio nunca sai de zero (nenhum mousemove dispara), e perto do
// CTA, onde o raio encolhe pra ceder o palco ao clique, a deformação encolhe
// junto. Nenhuma regra nova, nenhum segundo estado de cursor.
//
// O texto não é redesenhado a cada quadro: vai UMA vez pra uma textura (canvas
// 2D, com a mesma fonte, tamanho, tracking e posição que o <h1> de verdade
// tem no layout) e o shader só reamostra essa textura deslocando as
// coordenadas. Redesenhar só acontece em resize, troca de tema ou quando a
// fonte termina de carregar.
//
// O <h1> continua no DOM, sempre: é ele que o leitor de tela lê, que o
// buscador indexa e que anima na entrada. O canvas só assume DEPOIS que a
// animação de entrada termina, e aí o <h1> fica transparente. Sem WebGL, sem
// fonte carregada ou com menos movimento pedido no sistema, nada disso
// acontece e o título é só o <h1>, como sempre foi.

const VERTEX_SRC = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision highp float;

uniform sampler2D uTexture;
uniform vec2 uSize;     // canvas em px CSS
uniform float uDpr;
uniform vec2 uMouse;    // px CSS, origem no topo
uniform float uRadius;  // raio da lente em px CSS (0 = sem cursor)

void main() {
  vec2 device = gl_FragCoord.xy / uDpr;
  vec2 p = vec2(device.x, uSize.y - device.y);

  // A lente empurra o desenho pra FORA do cursor. Como o shader é amostrado
  // por pixel, o empurrão se faz LENDO a textura num ponto puxado na direção
  // contrária: o que aparece em p é o que o texto tem em q.
  //
  // O perfil precisa zerar NO cursor, não ser máximo ali: com uma gaussiana
  // pura (máxima no centro) todos os pixels em volta do ponteiro são
  // deslocados pela mesma distância em direções opostas, então muitos leem o
  // mesmo ponto da textura e o desenho colapsa numa estrela no meio,
  // artefato de amostragem, não de ótica. A distância vezes a gaussiana zera
  // no centro, sobe até o pico e decai: é o perfil de uma lente convexa de
  // verdade, que não desloca nada no eixo ótico e desloca mais no meio do
  // caminho até a borda.
  //
  // A amplitude e o alcance saem os dois do raio, então a deformação some
  // sozinha quando o raio vai a zero (cursor fora da hero, ou tela de toque,
  // onde ele nunca sai de zero).
  //
  // A amplitude é contida de propósito. Numa grade de fios finos dava pra
  // exagerar sem custo; aqui o alvo é a única coisa que a página PRECISA que
  // se leia, e passar do ponto transforma o nome em borrão. A régua foi
  // essa: a letra sob o cursor entorta o suficiente pra ficar claro que tem
  // um vidro ali, e continua sendo aquela letra.
  vec2 toMouse = p - uMouse;
  float dist = length(toMouse);
  float sigma = max(uRadius, 1.0) * 0.7;
  float falloff = exp(-(dist * dist) / (2.0 * sigma * sigma));
  float push = (dist / sigma) * falloff;
  vec2 dir = dist > 0.001 ? toMouse / dist : vec2(0.0);
  vec2 q = p - dir * push * uRadius * 0.3;

  vec4 texel = texture2D(uTexture, q / uSize);
  gl_FragColor = vec4(texel.rgb * texel.a, texel.a);
}
`;

/** `textContent` devolve o texto CRU do DOM, e o nome vem do dado em caixa
 *  mista ("Armando Custodio"); quem coloca em versal é o CSS
 *  (`text-transform` de `.type-display`), que não existe pro canvas 2D.
 *  Sem isto o nome sai em caixa mista na cópia desenhada. */
function applyTextTransform(text: string, transform: string) {
  if (transform.startsWith("uppercase")) return text.toUpperCase();
  if (transform.startsWith("lowercase")) return text.toLowerCase();
  if (transform.startsWith("capitalize")) {
    return text.replace(/\p{L}\S*/gu, (word) => word[0].toUpperCase() + word.slice(1));
  }
  return text;
}

/** Quanto tempo a animação de entrada do <h1> leva pra terminar (ver Hero.tsx:
 *  0,1s de atraso, mais 0,13s por palavra, mais 0,95s de duração), com folga.
 *  Antes disso o canvas não assume: o texto ficaria parado no lugar final
 *  enquanto o DOM ainda o traz de baixo. */
const ENTRY_MS = 1500;

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

export function HeroTitleGL({
  mirrored,
  pointerX,
  pointerY,
  lensRadius,
  sectionRef,
  titleRef,
  onDrawing,
  onUnsupported,
}: {
  /** Cópia dentro da lente de inversão: mesma textura, cor invertida. */
  mirrored?: boolean;
  /** Posição do cursor relativa à SEÇÃO (as molas de Hero.tsx). */
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  /** Raio da lente, a mesma mola que rege a inversão do texto. */
  lensRadius: MotionValue<number>;
  sectionRef: React.RefObject<HTMLElement | null>;
  /** O <h1> de verdade: é dele que saem fonte, tamanho, tracking e posição. */
  titleRef: React.RefObject<HTMLHeadingElement | null>;
  /** Chamado quando o canvas assume de fato, e só então o <h1> fica
   *  transparente: escondê-lo antes abriria uma janela de hero sem nome. */
  onDrawing: () => void;
  /** Chamado se o WebGL não subir: quem chama deixa o <h1> como está. */
  onUnsupported: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const title = titleRef.current;
    if (!canvas || !parent || !title) return;

    const gl = canvas.getContext("webgl", { antialias: false });
    if (!gl) {
      onUnsupported();
      return;
    }
    const program = createProgram(gl);
    if (!program) {
      onUnsupported();
      return;
    }

    // UNPACK_FLIP_Y fica DESLIGADO (o padrão) de propósito. Ele existe pra
    // reconciliar a convenção do navegador (linha 0 no topo) com a do WebGL
    // (v=0 no rodapé), e é o que a maioria dos casos quer. Aqui não: as
    // coordenadas do shader já são convertidas pra origem no topo, porque é
    // assim que o layout do <h1> é medido, então a textura precisa ficar na
    // mesma orientação do canvas 2D que a gerou. Com o flip ligado, o nome
    // aparecia espelhado na vertical.
    gl.enable(gl.BLEND);
    // O shader emite alpha pré-multiplicado (rgb * a, a), que é o que o
    // compositor do navegador espera de um canvas com alpha.
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const positions = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positions);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPosition = gl.getAttribLocation(program, "aPosition");

    const uTexture = gl.getUniformLocation(program, "uTexture");
    const uSize = gl.getUniformLocation(program, "uSize");
    const uDpr = gl.getUniformLocation(program, "uDpr");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uRadius = gl.getUniformLocation(program, "uRadius");

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // CLAMP_TO_EDGE: a deformação pode ler fora da textura, e a borda dela é
    // transparente, então esticar a borda não desenha nada. REPEAT traria o
    // outro lado do texto pra dentro do quadro.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const scratch = document.createElement("canvas");
    const paint = scratch.getContext("2d");
    if (!paint) {
      onUnsupported();
      return;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let offsetX = 0;
    let offsetY = 0;
    let rafId = 0;
    let running = false;
    let visible = true;
    let destroyed = false;
    let announced = false;
    let entered = false;
    let painted = false;
    let lastX = Number.NaN;
    let lastY = Number.NaN;
    let lastRadius = Number.NaN;

    /** Copia o <h1> pra uma textura: cada palavra desenhada com a fonte, o
     *  tamanho, o tracking, o alinhamento e a posição que ela TEM no layout,
     *  lidos do próprio elemento em vez de repetidos aqui. Assim a versão em
     *  canvas não sai do lugar quando o CSS do título mudar.
     *
     *  A medida sai do <span> de fora, o que NÃO anima: o de dentro é o que o
     *  Framer move na entrada, e o retângulo dele durante a animação é a
     *  posição de passagem, não a final. */
    function repaint() {
      if (!paint || !canvas || !title || !gl) return;
      const canvasBox = canvas.getBoundingClientRect();
      const color = getComputedStyle(canvas).color;

      scratch.width = Math.max(1, Math.round(width * dpr));
      scratch.height = Math.max(1, Math.round(height * dpr));
      paint.setTransform(dpr, 0, 0, dpr, 0, 0);
      paint.clearRect(0, 0, width, height);
      paint.fillStyle = color;

      for (const line of title.querySelectorAll<HTMLElement>("[data-title-line]")) {
        const box = line.getBoundingClientRect();
        const style = getComputedStyle(line);
        const text = applyTextTransform(line.textContent ?? "", style.textTransform);
        if (!text) continue;

        paint.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        paint.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;

        // A caixa de linha começa depois do padding que o <h1> usa pra não
        // deixar o overflow-hidden cortar o topo das letras (ver Hero.tsx).
        const padTop = parseFloat(style.paddingTop) || 0;
        const lineHeight = parseFloat(style.lineHeight) || box.height;
        const top = box.top - canvasBox.top + padTop;

        // Mesma conta que o CSS faz pra centrar o glifo na caixa de linha
        // (half leading): a sobra entre a altura da linha e a altura da fonte
        // vai metade pra cima, metade pra baixo.
        const metrics = paint.measureText(text);
        const ascent = metrics.fontBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent;
        const baseline = top + (lineHeight - (ascent + descent)) / 2 + ascent;

        const centered = style.textAlign === "center";
        paint.textAlign = centered ? "center" : "left";
        const x = box.left - canvasBox.left + (centered ? box.width / 2 : 0);
        paint.fillText(text, x, baseline);
      }

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
    }

    let failed = false;

    function measure() {
      if (!canvas || !parent || !gl || failed) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      height = parent.clientHeight;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);

      // As molas do cursor são medidas a partir da seção, e o canvas mora
      // dentro dela. Na prática dá quase zero, mas medir é barato e não
      // depende do layout continuar exatamente como está hoje.
      const section = sectionRef.current;
      if (section) {
        const canvasBox = canvas.getBoundingClientRect();
        const sectionBox = section.getBoundingClientRect();
        offsetX = canvasBox.left - sectionBox.left;
        offsetY = canvasBox.top - sectionBox.top;
      }
      // Copiar o <h1> depende de APIs de canvas 2D que nem todo navegador
      // implementa igual (letterSpacing, fontBoundingBox*). Se qualquer uma
      // faltar, o certo é desistir e deixar o <h1> de verdade em cena, não
      // mostrar um título torto.
      try {
        repaint();
      } catch {
        failed = true;
        onUnsupported();
      }
    }

    function draw() {
      if (failed) return;
      if (destroyed || !gl || !canvas) return;
      const x = pointerX.get() - offsetX;
      const y = pointerY.get() - offsetY;
      const radius = lensRadius.get();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positions);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTexture, 0);
      gl.uniform2f(uSize, width, height);
      gl.uniform1f(uDpr, dpr);
      gl.uniform2f(uMouse, x, y);
      gl.uniform1f(uRadius, radius);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (!announced && entered && painted) {
        announced = true;
        onDrawing();
      }

      // Dorme quando o cursor não mexeu nada desde o quadro anterior e a
      // lente já está fechada. Qualquer mudança nas molas acorda de novo
      // (assinaturas abaixo).
      const still = x === lastX && y === lastY && radius === lastRadius;
      lastX = x;
      lastY = y;
      lastRadius = radius;
      if (still && radius < 0.5) {
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

    // Duas condições independentes pro canvas assumir, cada uma no seu tempo.
    //
    // A fonte da manchete é local (Whyte Inktrap) e pode não estar pronta no
    // primeiro quadro: desenhar antes disso grava a fonte de fallback na
    // textura, e ela ficaria congelada ali. Por isso a textura só é pintada
    // depois de `document.fonts.ready`.
    //
    // A contagem da entrada, essa, corre a partir da montagem, não do fim do
    // carregamento da fonte: as duas coisas não têm relação nenhuma, e
    // encadear uma na outra atrasava o canvas por todo o tempo que a fonte
    // levasse. O <h1> só fica transparente quando as DUAS já aconteceram, que
    // é o que `announced` cobra no laço.
    document.fonts.ready.then(() => {
      if (destroyed) return;
      painted = true;
      measure();
      wake();
    });

    const entryTimer = window.setTimeout(() => {
      if (destroyed) return;
      entered = true;
      // Remede: a animação do <h1> não muda o retângulo que serve de
      // referência, mas o layout pode ter assentado nesse meio tempo.
      measure();
      wake();
    }, ENTRY_MS);

    const resizeObserver = new ResizeObserver(() => {
      measure();
      wake();
    });
    resizeObserver.observe(parent);

    // A hero é a primeira dobra: quem rolou pra baixo não paga o loop.
    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) wake();
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    // Troca de tema (e o Modo Boring, que também mexe no <html>): a cor do
    // texto vem do CSS, então basta repintar a textura.
    const themeObserver = new MutationObserver(() => {
      repaint();
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
      window.clearTimeout(entryTimer);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      for (const stop of unsubscribe) stop();
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positions);
      // Sem WEBGL_lose_context aqui, de propósito. Perder o contexto é
      // permanente PARA AQUELE <canvas>, e este é gerenciado pelo React: numa
      // remontagem (o StrictMode do dev faz isso sempre, e o componente
      // também monta tarde, quando a checagem de ponteiro resolve) o mesmo
      // elemento volta, `getContext` devolve o contexto já morto, e a partir
      // daí nenhum shader compila. Soltar as alocações basta; o contexto vai
      // junto com o canvas quando ele sai do DOM.
    };
  }, [mirrored, pointerX, pointerY, lensRadius, sectionRef, titleRef, onDrawing, onUnsupported]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="no-print pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
