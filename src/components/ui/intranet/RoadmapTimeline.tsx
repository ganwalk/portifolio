"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, ExternalLink, CheckCircle2, Loader, Sparkles, CalendarClock } from "lucide-react";
import { Tag, tagToneClasses } from "./Tag";
import { marcosOrdenados, indiceMarcoAtual, type Marco, type MarcoStatus } from "./roadmapMarcos";

// Portado de ganwalk/intranet, src/components/widgets/RoadmapTimeline.tsx:
// o componente de verdade, não uma reconstrução visual. A trilha em onda
// (arrastável, navegável por setas/teclado, com o marco de "hoje" real)
// funciona aqui exatamente como no Design System da Intranet, com os
// mesmos dados de roadmap (roadmapMarcos.ts). O que muda é só a casca:
// classes utilitárias que dependiam do tailwind.config e do tema daquele
// projeto (bg-card, text-primary...) viraram valores explícitos
// (bg-[hsl(var(--card))]) resolvidos pelas variáveis reais da marca,
// escopadas em .intranet-scope (ver globals.css), então o componente
// carrega sua própria aparência sem depender de nada do resto do site. A
// navegação por rota (react-router) virou link externo para a página real.

const EASE_APPLE = "cubic-bezier(0.22, 1, 0.36, 1)";

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

interface Geo {
  stride: number;
  pad: number;
  amp: number;
  mid: number;
  h: number;
  cardW: number;
  cardH: number;
  miniW: number;
  miniH: number;
  gap: number;
}

const GEO_AMPLA: Geo = { stride: 300, pad: 168, amp: 46, mid: 238, h: 480, cardW: 232, cardH: 136, miniW: 116, miniH: 58, gap: 32 };
const GEO_COMPACTA: Geo = { stride: 224, pad: 126, amp: 42, mid: 217, h: 440, cardW: 186, cardH: 130, miniW: 110, miniH: 54, gap: 26 };

const nX = (g: Geo, i: number) => g.pad + g.stride * i;
const nY = (g: Geo, i: number) => g.mid - g.amp * (i % 2 === 0 ? 1 : -1);
const ondaY = (g: Geo, x: number, fase = 0, amp = g.amp) => g.mid - amp * Math.cos((Math.PI * (x - g.pad)) / g.stride + fase);

function caminhoOnda(g: Geo, largura: number, fase = 0, amp = g.amp): string {
  const pontos: string[] = [];
  for (let x = 0; x <= largura; x += 8) pontos.push(`${x} ${ondaY(g, x, fase, amp).toFixed(2)}`);
  pontos.push(`${largura} ${ondaY(g, largura, fase, amp).toFixed(2)}`);
  return `M ${pontos.join(" L ")}`;
}

function useGeometria(): Geo {
  const [compacta, setCompacta] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const onChange = () => setCompacta(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return compacta ? GEO_COMPACTA : GEO_AMPLA;
}

const statusConfig: Record<MarcoStatus, { label: string; icon: React.ElementType; classe: string }> = {
  concluido: { label: "Entregue", icon: CheckCircle2, classe: "text-[hsl(var(--success))]" },
  "em-andamento": { label: "Rolando", icon: Loader, classe: "text-[hsl(var(--primary))]" },
  planejado: { label: "Vem por aí", icon: Sparkles, classe: "text-[hsl(var(--muted-foreground))]" },
  adiado: { label: "Adiada", icon: CalendarClock, classe: "text-[hsl(var(--warning))]" },
};

function xDeHoje(g: Geo, hoje: string, largura: number): number {
  const passados = marcosOrdenados.filter((m) => m.data <= hoje).length;
  if (passados === 0) return 0;
  if (passados === marcosOrdenados.length) return largura;
  const t0 = new Date(marcosOrdenados[passados - 1].data).getTime();
  const t1 = new Date(marcosOrdenados[passados].data).getTime();
  const t = new Date(hoje).getTime();
  const frac = t1 === t0 ? 0 : Math.min(Math.max((t - t0) / (t1 - t0), 0), 1);
  return nX(g, passados - 1) + frac * g.stride;
}

function MarcoCard({ marco, ativo }: { marco: Marco; ativo: boolean }) {
  const cfg = statusConfig[marco.status];
  const Icon = marco.icon;
  return (
    <div
      className={cx(
        "flex h-full w-full flex-col gap-2 overflow-hidden rounded-2xl border bg-[hsl(var(--card))] p-3 text-left transition-[transform,box-shadow,border-color] duration-300 sm:p-3.5",
        ativo
          ? "-translate-y-0.5 border-[hsl(var(--primary)/0.5)] shadow-xl"
          : "sm:group-hover:-translate-y-0.5 sm:group-hover:border-[hsl(var(--primary)/0.3)] sm:group-hover:shadow-lg",
      )}
      style={{ transitionTimingFunction: EASE_APPLE }}
    >
      <div className="flex shrink-0 items-center gap-2.5">
        <span className={cx("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", tagToneClasses[marco.tone])} aria-hidden="true">
          <Icon className="h-4 w-4" />
        </span>
        <p className="min-w-0 text-[13px] font-bold leading-tight text-[hsl(var(--ig-foreground))] line-clamp-2 sm:text-sm">{marco.titulo}</p>
      </div>
      <p className="shrink-0 text-[11px] leading-snug text-[hsl(var(--muted-foreground))] line-clamp-3">{marco.descricao}</p>
      <span className="sr-only">
        {marco.quando}. {cfg.label}.
      </span>
    </div>
  );
}

function MarcoMiniCard({ marco, ativo }: { marco: Marco; ativo: boolean }) {
  const cfg = statusConfig[marco.status];
  const Icon = cfg.icon;
  return (
    <div
      className={cx(
        "flex h-full w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-xl border bg-[hsl(var(--card))] px-2 py-2 text-center transition-[border-color,box-shadow] duration-300",
        ativo ? "border-[hsl(var(--primary)/0.5)] shadow-lg" : "sm:group-hover:border-[hsl(var(--primary)/0.3)]",
      )}
      style={{ transitionTimingFunction: EASE_APPLE }}
    >
      <p className="max-w-full truncate text-[11px] font-bold leading-tight text-[hsl(var(--ig-foreground))]">{marco.periodo}</p>
      <span className={cx("inline-flex max-w-full items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wide", cfg.classe)}>
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{cfg.label}</span>
      </span>
    </div>
  );
}

export function RoadmapTimeline() {
  const marcos = marcosOrdenados;
  const total = marcos.length;
  const g = useGeometria();
  const W = g.pad * 2 + g.stride * (total - 1);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const [ativo, setAtivo] = useState(() => indiceMarcoAtual());
  const reducedMotion = useReducedMotion();

  const hoje = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const progressoX = useMemo(() => xDeHoje(g, hoje, W), [g, hoje, W]);
  const ondaPrincipal = useMemo(() => caminhoOnda(g, W), [g, W]);

  const regua = useMemo(() => {
    const vistos = new Map<string, number>();
    marcos.forEach((m, i) => {
      if (!vistos.has(m.periodo)) vistos.set(m.periodo, i);
    });
    return Array.from(vistos, ([periodo, indice]) => ({ periodo, indice }));
  }, [marcos]);

  const irPara = useCallback(
    (i: number, suave = true) => {
      const alvo = Math.min(Math.max(i, 0), total - 1);
      setAtivo(alvo);
      const el = scrollerRef.current;
      if (!el) return;
      el.scrollTo({ left: nX(g, alvo) - el.clientWidth / 2, behavior: suave && !reducedMotion ? "smooth" : "auto" });
    },
    [g, total, reducedMotion],
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = nX(g, indiceMarcoAtual()) - el.clientWidth / 2;
  }, [g]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const centro = el.scrollLeft + el.clientWidth / 2;
      const i = Math.round((centro - g.pad) / g.stride);
      setAtivo(Math.min(Math.max(i, 0), total - 1));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [g, total]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      irPara(ativo + 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      irPara(ativo - 1);
    }
  };

  const arrasto = useRef<{ x: number; scroll: number; moveu: boolean } | null>(null);
  const engolirClique = useRef(false);
  const [arrastando, setArrastando] = useState(false);
  const LIMIAR = 6;

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    const el = scrollerRef.current;
    if (!el) return;
    arrasto.current = { x: e.clientX, scroll: el.scrollLeft, moveu: false };
    engolirClique.current = false;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = arrasto.current;
    const el = scrollerRef.current;
    if (!d || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moveu) {
      if (Math.abs(dx) <= LIMIAR) return;
      d.moveu = true;
      setArrastando(true);
      el.setPointerCapture(e.pointerId);
    }
    el.scrollLeft = d.scroll - dx;
  };

  const encerrarArrasto = (e: React.PointerEvent) => {
    const d = arrasto.current;
    if (!d) return;
    engolirClique.current = d.moveu;
    arrasto.current = null;
    setArrastando(false);
    const el = scrollerRef.current;
    if (el?.hasPointerCapture?.(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (!engolirClique.current) return;
    engolirClique.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  const marcoAtivo = marcos[ativo];
  const cfgAtivo = statusConfig[marcoAtivo.status];
  const IconAtivo = cfgAtivo.icon;

  return (
    <div className="overflow-hidden rounded-3xl border bg-[hsl(var(--card))]">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--primary)/0.06)] via-transparent to-[hsl(var(--primary)/0.04)]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div className="absolute left-1/3 -top-10 h-52 w-52 rounded-full bg-[hsl(var(--primary)/0.1)] blur-3xl" />
        </div>

        <button
          onClick={() => irPara(ativo - 1)}
          disabled={ativo === 0}
          aria-label="Marco anterior"
          className="absolute left-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-[hsl(var(--ig-background)/0.8)] text-[hsl(var(--ig-foreground))] shadow-lg backdrop-blur transition-[opacity,transform,border-color] duration-300 disabled:opacity-30 sm:left-3 sm:h-11 sm:w-11 sm:hover:scale-105 sm:hover:border-[hsl(var(--primary)/0.4)]"
          style={{ transitionTimingFunction: EASE_APPLE }}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <button
          onClick={() => irPara(ativo + 1)}
          disabled={ativo === total - 1}
          aria-label="Próximo marco"
          className="absolute right-2 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border bg-[hsl(var(--ig-background)/0.8)] text-[hsl(var(--ig-foreground))] shadow-lg backdrop-blur transition-[opacity,transform,border-color] duration-300 disabled:opacity-30 sm:right-3 sm:h-11 sm:w-11 sm:hover:scale-105 sm:hover:border-[hsl(var(--primary)/0.4)]"
          style={{ transitionTimingFunction: EASE_APPLE }}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[hsl(var(--card))] to-transparent sm:w-20" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[hsl(var(--card))] to-transparent sm:w-20" aria-hidden="true" />

        <div
          ref={scrollerRef}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={encerrarArrasto}
          onPointerCancel={encerrarArrasto}
          onClickCapture={onClickCapture}
          tabIndex={0}
          role="group"
          aria-label="Trilha de marcos do Time de Produto"
          className={cx(
            "timeline-scrollbar relative overflow-x-auto overflow-y-hidden outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-inset",
            arrastando ? "cursor-grabbing select-none" : "sm:cursor-grab",
          )}
          style={{ scrollSnapType: arrastando ? "none" : "x proximity" }}
        >
          <div className="relative" style={{ width: W, height: g.h }}>
            <svg width={W} height={g.h} viewBox={`0 0 ${W} ${g.h}`} className="absolute inset-0" aria-hidden="true">
              <defs>
                <linearGradient id="rt-onda" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={W} y2="0">
                  <stop offset="0%" style={{ stopColor: "hsl(var(--brand-gradient-from))" }} />
                  <stop offset="100%" style={{ stopColor: "hsl(var(--brand-gradient-to))" }} />
                </linearGradient>
                <clipPath id="rt-feito">
                  <rect x="0" y="0" width={Math.max(progressoX, 0)} height={g.h} />
                </clipPath>
                <filter id="rt-glow" x="-20%" y="-40%" width="140%" height="180%">
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>

              <path
                d={ondaPrincipal}
                className={reducedMotion ? undefined : "roadmap-porvir"}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="1 12"
              />

              <g clipPath="url(#rt-feito)">
                <path
                  d={ondaPrincipal}
                  className={reducedMotion ? undefined : "roadmap-luz"}
                  fill="none"
                  stroke="url(#rt-onda)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  opacity="0.35"
                  filter="url(#rt-glow)"
                />
                <path d={ondaPrincipal} fill="none" stroke="url(#rt-onda)" strokeWidth="4" strokeLinecap="round" />
                {!reducedMotion && (
                  <g>
                    <circle r="15" fill="hsl(var(--brand-foreground))" opacity="0.35" filter="url(#rt-glow)" />
                    <circle r="6" fill="hsl(var(--brand-foreground))" />
                    <animateMotion dur="7s" repeatCount="indefinite" path={ondaPrincipal} />
                  </g>
                )}
              </g>

              {progressoX > 0 && progressoX < W && (
                <g>
                  <line
                    x1={progressoX}
                    y1={ondaY(g, progressoX) - 74}
                    x2={progressoX}
                    y2={ondaY(g, progressoX) + 62}
                    stroke="hsl(var(--primary))"
                    strokeWidth="1.5"
                    strokeDasharray="3 5"
                    opacity="0.5"
                  />
                  <rect x={progressoX - 25} y={ondaY(g, progressoX) - 91} width="50" height="18" rx="9" fill="hsl(var(--primary))" />
                  <text
                    x={progressoX}
                    y={ondaY(g, progressoX) - 78}
                    textAnchor="middle"
                    style={{ fill: "hsl(var(--primary-foreground))", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em" }}
                  >
                    HOJE
                  </text>
                  <circle cx={progressoX} cy={ondaY(g, progressoX)} r="5" fill="hsl(var(--primary))" />
                  <circle cx={progressoX} cy={ondaY(g, progressoX)} r="5" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.5">
                    {!reducedMotion && (
                      <>
                        <animate attributeName="r" values="5;16;5" dur="2.6s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.6s" repeatCount="indefinite" />
                      </>
                    )}
                  </circle>
                </g>
              )}

              {marcos.map((m, i) => {
                const x = nX(g, i);
                const y = nY(g, i);
                const feito = m.status === "concluido";
                const rolando = m.status === "em-andamento";
                const adiado = m.status === "adiado";
                const cheio = feito || rolando;
                const selecionado = i === ativo;
                return (
                  <g key={m.id}>
                    <line x1={x} y1={y - 11} x2={x} y2={y - g.gap} stroke={selecionado ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth="2" />
                    <line x1={x} y1={y + 11} x2={x} y2={y + g.gap} stroke={selecionado ? "hsl(var(--primary))" : "hsl(var(--border))"} strokeWidth="2" />
                    {selecionado && <circle cx={x} cy={y} r="18" fill="hsl(var(--primary))" opacity="0.16" />}
                    {rolando && !reducedMotion && (
                      <circle cx={x} cy={y} r="11" fill="none" stroke="hsl(var(--primary))" strokeWidth="2">
                        <animate attributeName="r" values="11;20;11" dur="2.4s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.4s" repeatCount="indefinite" />
                      </circle>
                    )}
                    <circle cx={x} cy={y} r="11" fill="hsl(var(--card))" />
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill={cheio ? "hsl(var(--primary))" : "hsl(var(--card))"}
                      stroke={cheio ? "hsl(var(--primary))" : adiado ? "hsl(var(--warning))" : "hsl(var(--muted-foreground))"}
                      strokeWidth="2.5"
                      strokeDasharray={adiado ? "3.5 3" : undefined}
                      opacity={cheio || adiado ? 1 : 0.55}
                    />
                    {feito && <circle cx={x} cy={y} r="3.2" fill="hsl(var(--primary-foreground))" />}
                  </g>
                );
              })}
            </svg>

            {marcos.map((m, i) => {
              const x = nX(g, i);
              const y = nY(g, i);
              const acima = i % 2 === 0;
              return (
                <React.Fragment key={m.id}>
                  <button
                    onClick={() => irPara(i)}
                    aria-current={i === ativo ? "true" : undefined}
                    className="group absolute z-10 rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
                    style={{ left: x - g.cardW / 2, top: acima ? y - g.gap - g.cardH : y + g.gap, width: g.cardW, height: g.cardH, scrollSnapAlign: "center" }}
                  >
                    <MarcoCard marco={m} ativo={i === ativo} />
                  </button>
                  <div
                    aria-hidden="true"
                    className="absolute z-10"
                    style={{ left: x - g.miniW / 2, top: acima ? y + g.gap : y - g.gap - g.miniH, width: g.miniW, height: g.miniH }}
                  >
                    <MarcoMiniCard marco={m} ativo={i === ativo} />
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <div className="border-t bg-[hsl(var(--ig-muted)/0.2)] px-3 py-2.5">
        <div className="no-scrollbar flex items-center justify-start gap-1 overflow-x-auto sm:justify-center">
          {regua.map(({ periodo, indice }) => {
            const selecionado = marcoAtivo.periodo === periodo;
            return (
              <button
                key={periodo}
                onClick={() => irPara(indice)}
                className={cx(
                  "relative shrink-0 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold transition-colors duration-300",
                  selecionado ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--muted-foreground))] sm:hover:text-[hsl(var(--ig-foreground))]",
                )}
              >
                {periodo}
                <span
                  className={cx(
                    "absolute inset-x-2 -bottom-0.5 h-0.5 origin-center rounded-full bg-[hsl(var(--primary))] transition-transform duration-300",
                    selecionado ? "scale-x-100" : "scale-x-0",
                  )}
                  style={{ transitionTimingFunction: EASE_APPLE }}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t px-4 py-5 sm:px-6">
        <div key={marcoAtivo.id} className="intranet-panel-in">
          <div className="flex flex-wrap items-start gap-3">
            <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tagToneClasses[marcoAtivo.tone])} aria-hidden="true">
              <marcoAtivo.icon className="h-5 w-5" />
            </span>
            <div className="min-w-[200px] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold leading-tight text-[hsl(var(--ig-foreground))] sm:text-lg">{marcoAtivo.titulo}</h3>
                <Tag tone={marcoAtivo.tone} className="text-[9px]">
                  <IconAtivo className="h-3 w-3" />
                  {cfgAtivo.label}
                </Tag>
              </div>
              <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
                {marcoAtivo.quando}
                {marcoAtivo.dataAssumida && <span className="ml-1.5 italic opacity-80">(data aproximada)</span>}
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{marcoAtivo.descricao}</p>

          {marcoAtivo.detalhes && (
            <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {marcoAtivo.detalhes.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-snug text-[hsl(var(--muted-foreground))]">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[hsl(var(--primary))]" />
                  {d}
                </li>
              ))}
            </ul>
          )}

          {marcoAtivo.href && (
            <div className="mt-4">
              <a
                href={marcoAtivo.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--primary))] sm:hover:underline"
              >
                Abrir na Intranet
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
