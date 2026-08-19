// Portado de ganwalk/intranet, src/components/widgets/NovidadeCard.tsx: o
// card real do Mural de Novidades do Design System, com os mesmos dados
// (novidadesSample.ts, duas entradas reais do mural, não inventadas).
// Mesma conversão de classes do RoadmapTimeline.tsx: tokens do tema daquele
// projeto viram valores explícitos, resolvidos em .intranet-scope.

import { Check, ChevronRight } from "lucide-react";
import type { NovidadeItem } from "./novidadesSample";

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

export function NovidadeCard({ item }: { item: NovidadeItem }) {
  const temAntesDepois = Boolean(item.antes || item.depois);
  const temResultados = Boolean(item.resultados && item.resultados.length > 0);

  return (
    <div className="group/nc flex gap-3.5 rounded-xl border bg-[hsl(var(--card))] p-4 transition-[border-color,box-shadow] duration-300 sm:hover:border-[hsl(var(--primary)/0.3)] sm:hover:shadow-md">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)] text-base leading-none">
        {item.emoji}
      </span>
      <div className="min-w-0 flex-1 space-y-3">
        <div>
          <p className="mb-1 text-sm font-bold leading-snug text-[hsl(var(--foreground))]">{item.titulo}</p>
          <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{item.descricao}</p>
        </div>

        {temAntesDepois && (
          <div className={cx("grid gap-px overflow-hidden rounded-lg border bg-[hsl(var(--border))]", item.antes && item.depois && "sm:grid-cols-2")}>
            {item.antes && (
              <div className="bg-[hsl(var(--muted)/0.4)] p-3">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Antes</p>
                <p className="text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{item.antes}</p>
              </div>
            )}
            {item.depois && (
              <div className="bg-[hsl(var(--primary)/0.05)] p-3">
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">Como ficou</p>
                <p className="text-xs leading-relaxed text-[hsl(var(--foreground)/0.8)]">{item.depois}</p>
              </div>
            )}
          </div>
        )}

        {temResultados && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Resultados</p>
            <ul className="space-y-1">
              {item.resultados!.map((r, k) => (
                <li key={k} className="flex gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                  <Check className="mt-px h-3.5 w-3.5 shrink-0 text-[hsl(var(--primary))]" strokeWidth={3} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.envolvidos && item.envolvidos.length > 0 && (
          <div>
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Envolvidos na entrega</p>
            <ul className="flex flex-wrap gap-1.5">
              {item.envolvidos.map((nome, k) => (
                <li key={k} className="rounded-full border bg-[hsl(var(--muted)/0.4)] px-2.5 py-0.5 text-[11px] text-[hsl(var(--muted-foreground))]">
                  {nome}
                </li>
              ))}
            </ul>
          </div>
        )}

        {item.link && (
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] sm:hover:underline">
            Ver mais <ChevronRight className="h-3 w-3 transition-transform duration-300 sm:group-hover/nc:translate-x-0.5" />
          </a>
        )}
      </div>
    </div>
  );
}
