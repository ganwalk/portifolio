"use client";

import { useEffect, useState } from "react";

// Portado de ganwalk/intranet, src/components/widgets/ContagemRegressiva.tsx:
// countdown de verdade, com setInterval ticando a cada segundo, não um
// GIF nem um print do relógio parado. Simplificado (sem o bloco de
// imagem, decorativo, que a página de documentação original só reserva
// como placeholder "[Imagem]").

const TARGET = new Date("2026-10-01T09:00:00").getTime();

function useCountdown(target: number) {
  const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      setT({
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

export function CountdownDemo() {
  const t = useCountdown(TARGET);
  const units: Array<[keyof typeof t, string]> = [
    ["days", "Dias"],
    ["hours", "Horas"],
    ["minutes", "Minutos"],
    ["seconds", "Segundos"],
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[hsl(var(--accent)/0.2)] blur-3xl" />
      <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-[hsl(var(--accent)/0.1)] blur-3xl" />
      <div className="relative rounded-xl border bg-[hsl(var(--card)/0.85)] p-6 backdrop-blur-xl sm:p-8">
        <span className="mb-3 inline-block rounded-lg border border-[hsl(var(--accent)/0.2)] bg-[hsl(var(--accent)/0.1)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--accent))]">
          Lorem ipsum dolor sit amet
        </span>
        <h3 className="m-0 mb-2 text-2xl font-black uppercase tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
          Consectetur adipiscing
        </h3>
        <p className="mb-6 max-w-md text-sm text-[hsl(var(--muted-foreground))]">
          Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </p>
        <div className="grid max-w-md grid-cols-4 gap-2 sm:gap-3">
          {units.map(([key, label]) => (
            <div key={label} className="flex flex-col items-center rounded-xl border bg-[hsl(var(--card)/0.6)] py-3">
              <span className="text-2xl font-black leading-none text-[hsl(var(--foreground))] sm:text-3xl">
                {String(t[key]).padStart(2, "0")}
              </span>
              <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--accent))]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
