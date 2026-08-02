"use client";

import { useEffect, useRef } from "react";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { MediaView } from "@/components/ui/MediaView";
import type { Media } from "@/data/types";
import type { Locale } from "@/i18n/config";

// Experimento único de WebGL do site (o resto é CSS/Framer Motion de
// propósito): uma ondulação que segue o cursor sobre a capa do projeto em
// cena, com aberração cromática (cada canal de cor lê a textura com uma
// amplitude de onda diferente, então a franja de cor cresce e encolhe junto
// com a força do hover), no lugar do zoom plano que existia antes. Escopo
// deliberadamente pequeno: só a capa ATIVA (uma por vez, três no máximo num
// trio) ganha o efeito, nunca a seção inteira, e o loop de desenho só roda
// enquanto o cursor está de fato em cima (custo zero parado). Um aceno de
// estreia toca sozinho, centralizado, na primeira vez que cada projeto
// entra em cena (sobe e desce em ~1.1s): sem ele o efeito inteiro dependia
// de alguém descobrir que passar o mouse ali fazia diferença, fácil de
// nunca acontecer. Cai pro <MediaView> comum (sempre presente, por baixo) sem
// nenhuma diferença visível quando o WebGL falha, é desligado no sistema
// (prefers-reduced-motion) ou estamos no Modo Boring: informação, não
// vitrine, o Boring não ganha nenhum canvas nem aceno.

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
uniform vec2 uMouse;
uniform float uHover;
uniform float uTime;
uniform float uAspect;
uniform vec2 uUvScale;
uniform vec2 uUvOffset;

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

void main() {
  // Aberração cromática: cada canal de cor amostra a mesma ondulação com
  // uma amplitude levemente diferente, então a franja de cor cresce e
  // encolhe junto com a força do hover, um efeito bem mais "tecnológico"
  // do que só empurrar os pixels juntos, sem custo extra (mesma textura,
  // três leituras).
  float r = texture2D(uTexture, warp(vUv, 0.055) * uUvScale + uUvOffset).r;
  float g = texture2D(uTexture, warp(vUv, 0.042) * uUvScale + uUvOffset).g;
  float b = texture2D(uTexture, warp(vUv, 0.03) * uUvScale + uUvOffset).b;
  gl_FragColor = vec4(r, g, b, 1.0);
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

export function HoverWarpMedia({
  media,
  locale,
  className = "",
}: {
  media: Media;
  locale: Locale;
  className?: string;
}) {
  const { isBoringMode } = useBoringMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isBoringMode) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const sourceElOrNull = container.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    if (!sourceElOrNull) return;
    const sourceEl = sourceElOrNull;

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

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uHover = gl.getUniformLocation(program, "uHover");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uAspect = gl.getUniformLocation(program, "uAspect");
    const uUvScale = gl.getUniformLocation(program, "uUvScale");
    const uUvOffset = gl.getUniformLocation(program, "uUvOffset");
    const uTexture = gl.getUniformLocation(program, "uTexture");

    const mouse = { x: 0.5, y: 0.5 };
    let hover = 0;
    let hoverTarget = 0;
    let running = false;
    let rafId = 0;
    let destroyed = false;

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

      const naturalW =
        sourceEl instanceof HTMLVideoElement ? sourceEl.videoWidth : sourceEl.naturalWidth;
      const naturalH =
        sourceEl instanceof HTMLVideoElement ? sourceEl.videoHeight : sourceEl.naturalHeight;
      const sourceReady =
        sourceEl instanceof HTMLVideoElement
          ? sourceEl.readyState >= 2
          : sourceEl.complete && naturalW > 0;

      if (sourceReady) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sourceEl);
      }

      const canvasAspect = canvas.width / canvas.height;
      const texAspect = naturalW > 0 && naturalH > 0 ? naturalW / naturalH : canvasAspect;
      let scaleX = 1;
      let scaleY = 1;
      if (canvasAspect > texAspect) {
        scaleY = texAspect / canvasAspect;
      } else {
        scaleX = canvasAspect / texAspect;
      }

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(uTexture, 0);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform1f(uHover, hover);
      gl.uniform1f(uTime, time * 0.001);
      gl.uniform1f(uAspect, canvasAspect);
      gl.uniform2f(uUvScale, scaleX, scaleY);
      gl.uniform2f(uUvOffset, (1 - scaleX) / 2, (1 - scaleY) / 2);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      const settled = hoverTarget === 0 && Math.abs(hover) < 0.001;
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
      canvas!.style.opacity = "0";
      ensureLoop();
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    container.addEventListener("mousemove", onMove);
    container.addEventListener("mouseenter", onEnter);
    container.addEventListener("mouseleave", onLeave);

    // Aceno de estreia: a primeira vez que um projeto entra em cena, o
    // efeito se apresenta sozinho por um instante (centro do card, força
    // sobe e desce), em vez de ficar inteiramente escondido atrás da
    // descoberta de passar o mouse por cima. Só essa vez; hover de verdade
    // manda depois.
    mouse.x = 0.5;
    mouse.y = 0.5;
    hoverTarget = 1;
    canvas.style.opacity = "1";
    ensureLoop();
    const pulseTimer = window.setTimeout(() => {
      if (destroyed) return;
      hoverTarget = 0;
      canvas.style.opacity = "0";
      ensureLoop();
    }, 1100);

    return () => {
      destroyed = true;
      window.clearTimeout(pulseTimer);
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      container.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseenter", onEnter);
      container.removeEventListener("mouseleave", onLeave);
      gl.deleteProgram(program);
      gl.deleteTexture(texture);
      gl.deleteBuffer(positionBuffer);
      const loseContext = gl.getExtension("WEBGL_lose_context");
      loseContext?.loseContext();
    };
  }, [isBoringMode, media.src]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <MediaView media={media} locale={locale} className="absolute inset-0 h-full w-full object-cover" />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
