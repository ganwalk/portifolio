"use client";

import { useState } from "react";

// Padrão oficial de donut chart do Design System (ganwalk/intranet,
// src/components/widgets/GraficoPizza.tsx): sempre com furo, cantos
// arredondados, paddingAngle entre fatias, cores da paleta --chart-N.
// A versão original usa a lib recharts; aqui o SVG é calculado à mão
// (stroke-dasharray por fatia), sem trazer uma dependência de gráfico só
// para uma vitrine, mas o resultado é o mesmo componente real, com hover
// sincronizado entre fatia e legenda.

const DATA = [
  { name: "Lorem", value: 42 },
  { name: "Ipsum", value: 28 },
  { name: "Dolor", value: 18 },
  { name: "Sit", value: 12 },
];

const R = 60;
const CIRC = 2 * Math.PI * R;
const GAP_DEG = 3;

export function DonutChart() {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = DATA.reduce((sum, d) => sum + d.value, 0);

  const segments = DATA.reduce<Array<{ name: string; value: number; index: number; startDeg: number; length: number }>>(
    (acc, d, i) => {
      const startDeg = acc.length === 0 ? 0 : acc[i - 1].startDeg + (acc[i - 1].value / total) * 360;
      const fractionDeg = (d.value / total) * 360 - GAP_DEG;
      const length = (fractionDeg / 360) * CIRC;
      acc.push({ ...d, index: i, startDeg, length });
      return acc;
    },
    [],
  );

  return (
    <div className="mx-auto flex flex-col items-center gap-4 rounded-xl border bg-[hsl(var(--card)/0.6)] p-6 backdrop-blur-xl sm:max-w-sm">
      <div className="flex w-full items-center justify-between">
        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Lorem ipsum dolor sit</p>
      </div>
      <svg viewBox="0 0 160 160" className="h-40 w-40">
        <g transform="translate(80,80) rotate(-90)">
          {segments.map((s) => (
            <circle
              key={s.name}
              r={R}
              fill="none"
              stroke={`hsl(var(--chart-${s.index + 1}))`}
              strokeWidth={hovered === s.index ? 24 : 20}
              strokeLinecap="round"
              strokeDasharray={`${s.length} ${CIRC}`}
              strokeDashoffset={-((s.startDeg / 360) * CIRC)}
              opacity={hovered === null || hovered === s.index ? 1 : 0.35}
              onMouseEnter={() => setHovered(s.index)}
              onMouseLeave={() => setHovered(null)}
              style={{ transition: "opacity 0.2s, stroke-width 0.2s", cursor: "pointer" }}
            />
          ))}
        </g>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {DATA.map((d, i) => (
          <button
            key={d.name}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="flex items-center gap-1.5"
            style={{ opacity: hovered === null || hovered === i ? 1 : 0.4 }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: `hsl(var(--chart-${i + 1}))` }} />
            <span className="text-[11px] text-[hsl(var(--muted-foreground))]">
              {d.name} <span className="font-medium tabular-nums text-[hsl(var(--foreground))]">{d.value}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
