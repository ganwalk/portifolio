"use client";

import { useEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { MediaView } from "@/components/ui/MediaView";
import type { Media } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Experimento único de WebGL do site (o resto é CSS/Framer Motion de
// propósito): a capa do projeto em cena ganha uma ondulação que segue o
// cursor no hover, com aberração cromática, e, enquanto a fatia ainda está
// entrando pelo scroll (`progress` sobe de 0 a 1, mesmo valor que já move a
// fatia inteira pra cima em CasesGrid), a capa funde da capa anterior
// (`fromMedia`, mesma coluna, fatia de trás) pra esta, em vez de só aparecer
// por cima dela de repente. Inspirado numa referência de navegação em WebGL
// (Awwwards, Vero New York / Rodéo Studio): o pedido era uma transição de
// verdade entre as capas ao rolar, não só o empilhamento de cartas que já
// existia. Escopo deliberadamente contido: a fusão só acontece quando existe
// uma capa anterior na MESMA posição de coluna (`fromMedia` undefined caso
// contrário, seja a primeira fatia da seção ou uma coluna nova que a fatia
// de trás não tinha), vira só o corte direto de sempre.
//
// Escopo pequeno também na ativação: só a capa ATIVA (uma por vez, três no
// máximo num trio) ganha o efeito, nunca a seção inteira, e o loop de
// desenho só roda enquanto o cursor está de fato em cima OU a fusão ainda
// está em andamento (progress < 1): custo zero parado e fora de cena. Cai
// pro <MediaView> comum (sempre presente, por baixo) sem nenhuma diferença
// visível quando o WebGL falha, é desligado no sistema
// (prefers-reduced-motion) ou estamos no Modo Boring: informação, não
// vitrine, o Boring não ganha nenhum canvas.
//
// O aceno de estreia (força de hover sobe e desce sozinha por um instante)
// só toca quando NÃO existe `fromMedia`: a fusão da capa anterior já cumpre
// o mesmo papel de descoberta nas fatias seguintes (algo visivelmente
// acontece sem precisar do mouse), repetir o aceno ali só empilharia dois
// movimentos ao mesmo tempo.

const VERTEX_SRC = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uTexture;
uniform sampler2D uFromTexture;
uniform float uHasFrom;
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uAspect;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;
uniform vec2 uFromUvScale;
uniform vec2 uFromUvOffset;
uniform float uProgress;

vec2 warp(vec2 uv, float amp) {
  vec2 toMouse = uv - uMouse;
  toMouse.x *= uAspect;
  float dist = length(toMouse);
  float falloff = smoothstep(0.55, 0.0, dist);
  float ripple = sin(dist * 10.0 - uTime * 3.6) * amp * uHover * falloff;
  vec2 dir = dist > 0.0001 ? normalize(toMouse) : vec2(0.0);
  dir.x /= uAspect;
  return uv + dir * ripple;
}

vec3 sampleWarped(sampler2D tex, vec2 uv, vec2 scale, vec2 offset) {
  float r = texture2D(tex, warp(uv, 0.055) * scale + offset).r;
  float g = texture2D(tex, warp(uv, 0.042) * scale + offset).g;
  float b = texture2D(tex, warp(uv, 0.03) * scale + offset).b;
  return vec3(r, g, b);
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
  // Aberração cromática: cada canal de cor lê a mesma ondulação com uma
  // amplitude levemente diferente, então a franja de cor cresce e encolhe
  // junto com a força do hover, sem custo extra (mesma textura, três
  // leituras).
  vec3 toColor = sampleWarped(uTexture, vUv, uUvScale, uUvOffset);

  if (uHasFrom < 0.5 || uProgress >= 0.999) {
    gl_FragColor = vec4(toColor, 1.0);
    return;
  }

  vec3 fromColor = sampleWarped(uFromTexture, vUv, uFromUvScale, uFromUvOffset);

  // Fusão de baixo pra cima (vUv.y sobe do rodapé, 0, ao topo, 1), no mesmo
  // sentido em que a fatia sobe por cima da anterior (ver slideY em
  // CasesGrid): a borda entre as duas capas sobe junto com o progresso do
  // scroll, com ruído pra ficar orgânica, não uma linha reta.
  float n = (valueNoise(vUv * 4.0 + uProgress * 1.5) - 0.5) * 0.18;
  float fromAmount = smoothstep(uProgress - 0.14, uProgress + 0.14, vUv.y + n);
  vec3 color = mix(toColor, fromColor, fromAmount);
  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
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
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SRC);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SRC);
  if (!vertexShader || !fragmentShader) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function createCoverTexture(gl: WebGLRenderingContext) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return texture;
}

type CoverSource = HTMLImageElement | HTMLVideoElement;

function sourceNaturalSize(el: CoverSource): { w: number; h: number; ready: boolean } {
  if (el instanceof HTMLVideoElement) {
    return { w: el.videoWidth, h: el.videoHeight, ready: el.readyState >= 2 };
  }
  return { w: el.naturalWidth, h: el.naturalHeight, ready: el.complete && el.naturalWidth > 0 };
}

/** Escala/deslocamento de UV pra "cover" (preenche o quadro sem distorcer,
 *  sobrando de um lado em vez de esticar), a partir da proporção real da
 *  fonte contra a proporção do canvas. */
function coverFit(canvasAspect: number, sourceAspect: number) {
  let scaleX = 1;
  let scaleY = 1;
  if (canvasAspect > sourceAspect) {
    scaleY = sourceAspect / canvasAspect;
  } else {
    scaleX = canvasAspect / sourceAspect;
  }
  return { scaleX, scaleY, offsetX: (1 - scaleX) / 2, offsetY: (1 - scaleY) / 2 };
}

export function SceneCoverMedia({
  media,
  fromMedia,
  progress,
  locale,
  className = "",
}: {
  media: Media;
  /** Capa da mesma coluna na fatia anterior, pra fundir enquanto `progress`
   *  sobe. Sem ela, o comportamento é o de sempre: só a capa própria, com
   *  ondulação de hover. */
  fromMedia?: Media;
  /** 0 a 1, mesmo valor que move a fatia pra cima em CasesGrid (`enterT`).
   *  Fica em 1 tanto na ausência de transição quanto depois que a fatia já
   *  assentou. */
  progress: MotionValue<number>;
  locale: Locale;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const fromWrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isBoringMode) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const toSourceElOrNull = container.querySelector<CoverSource>("img, video");
    if (!toSourceElOrNull) return;
    const toSourceEl = toSourceElOrNull;
    const fromSourceEl = fromMedia
      ? (fromWrapperRef.current?.querySelector<CoverSource>("img, video") ?? null)
      : null;

    const gl = canvas.getContext("webgl", { premultipliedAlpha: false });
    if (!gl) return;

    const program = createProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPosition = gl.getAttribLocation(program, "aPosition");

    const toTexture = createCoverTexture(gl);
    const fromTexture = createCoverTexture(gl);

    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uHover = gl.getUniformLocation(program, "uHover");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uUvScale = gl.getUniformLocation(program, "uUvScale");
    const uUvOffset = gl.getUniformLocation(program, "uUvOffset");
    const uFromUvScale = gl.getUniformLocation(program, "uFromUvScale");
    const uFromUvOffset = gl.getUniformLocation(program, "uFromUvOffset");
    const uTexture = gl.getUniformLocation(program, "uTexture");
    const uFromTexture = gl.getUniformLocation(program, "uFromTexture");
    const uHasFrom = gl.getUniformLocation(program, "uHasFrom");
    const uProgress = gl.getUniformLocation(program, "uProgress");

    const mouse = { x: 0.5, y: 0.5 };
    let hover = 0;
    let hoverTarget = 0;
    let running = false;
    let rafId = 0;
    let destroyed = false;
    let pulseTimer: number | null = null;

    function resize() {
      if (!container || !canvas || !gl) return;
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    }

    function draw(time: number) {
      if (destroyed || !canvas || !gl) return;
      hover += (hoverTarget - hover) * 0.15;
      const scrollProgress = progress.get();

      const canvasAspect = canvas.width / canvas.height;

      const toSize = sourceNaturalSize(toSourceEl);
      if (toSize.ready) {
        gl.bindTexture(gl.TEXTURE_2D, toTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toSourceEl);
      }
      const toAspect = toSize.w > 0 && toSize.h > 0 ? toSize.w / toSize.h : canvasAspect;
      const toFit = coverFit(canvasAspect, toAspect);

      let hasFrom = false;
      let fromFit = { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };
      if (fromSourceEl) {
        const fromSize = sourceNaturalSize(fromSourceEl);
        if (fromSize.ready) {
          gl.bindTexture(gl.TEXTURE_2D, fromTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fromSourceEl);
          fromFit = coverFit(canvasAspect, fromSize.w / fromSize.h);
          hasFrom = true;
        }
      }

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, toTexture);
      gl.uniform1i(uTexture, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, fromTexture);
      gl.uniform1i(uFromTexture, 1);

      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform1f(uAspect, canvasAspect);
      gl.uniform2f(uUvScale, toFit.scaleX, toFit.scaleY);
      gl.uniform2f(uUvOffset, toFit.offsetX, toFit.offsetY);
      gl.uniform2f(uFromUvScale, fromFit.scaleX, fromFit.scaleY);
      gl.uniform2f(uFromUvOffset, fromFit.offsetX, fromFit.offsetY);
      gl.uniform1f(uHasFrom, hasFrom ? 1 : 0);
      gl.uniform1f(uProgress, scrollProgress);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const transitioning = hasFrom && scrollProgress < 0.999;
      const settled = hoverTarget === 0 && Math.abs(hover) < 0.001 && !transitioning;
      if (settled) {
        running = false;
        return;
      }
      rafId = requestAnimationFrame(draw);
    }

    function ensureLoop() {
      if (!running) {
        running = true;
        rafId = requestAnimationFrame(draw);
      }
    }

    function onMove(event: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) / rect.width;
      mouse.y = 1 - (event.clientY - rect.top) / rect.height;
    }

    function onEnter() {
      hoverTarget = 1;
      canvas!.style.opacity = "1";
      ensureLoop();
    }

    function onLeave() {
      hoverTarget = 0;
      // Só apaga o canvas se não houver fusão em andamento: senão a
      // transição sumiria no meio se o mouse passasse por cima e saísse de
      // novo antes dela assentar.
      if (!fromMedia || progress.get() >= 0.999) {
        canvas!.style.opacity = "0";
      }
      ensureLoop();
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);

    // A fusão é dirigida pelo scroll, não pelo cursor: o canvas precisa
    // acordar (e ficar visível) toda vez que `progress` muda, não só no
    // hover.
    const unsubscribeProgress = progress.on("change", () => {
      canvas.style.opacity = "1";
      ensureLoop();
    });

    if (fromMedia && progress.get() < 0.999) {
      canvas.style.opacity = "1";
      ensureLoop();
    } else if (!fromMedia) {
      // Aceno de estreia: só quando não há fusão de scroll pra cumprir o
      // mesmo papel de descoberta (ver comentário no topo do arquivo).
      mouse.x = 0.5;
      mouse.y = 0.5;
      hoverTarget = 1;
      canvas.style.opacity = "1";
      ensureLoop();
      pulseTimer = window.setTimeout(() => {
        if (destroyed) return;
        hoverTarget = 0;
        canvas.style.opacity = "0";
        ensureLoop();
      }, 1100);
    }

    return () => {
      destroyed = true;
      if (pulseTimer !== null) window.clearTimeout(pulseTimer);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      unsubscribeProgress();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
      gl.deleteProgram(program);
      gl.deleteTexture(toTexture);
      gl.deleteTexture(fromTexture);
      gl.deleteBuffer(positionBuffer);
      const loseContext = gl.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    };
  }, [isBoringMode, media.src, fromMedia, progress]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <MediaView media={media} locale={locale} className="absolute inset-0 h-full w-full object-cover" />
      {fromMedia && (
        <div
          ref={fromWrapperRef}
          aria-hidden
          className="pointer-events-none absolute h-px w-px overflow-hidden opacity-0"
        >
          <MediaView media={fromMedia} locale={locale} className="h-px w-px object-cover" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
