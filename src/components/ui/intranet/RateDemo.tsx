"use client";

import { useState } from "react";
import { Star } from "lucide-react";

// Portado de ganwalk/intranet, src/components/widgets/Rate.tsx: clique
// para votar, hover para pré visualizar, de verdade (estado React, não
// uma imagem de estrelas). A versão readOnly reaproveita o mesmo
// componente sem os manipuladores de clique.

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");
const SIZES = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" } as const;

function Rate({
  value,
  onChange,
  count = 5,
  allowHalf = false,
  size = "md",
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  count?: number;
  allowHalf?: boolean;
  size?: keyof typeof SIZES;
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  const pick = (e: React.MouseEvent, idx: number) => {
    if (!allowHalf) return idx + 1;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    return idx + (isHalf ? 0.5 : 1);
  };

  return (
    <div className={cx("inline-flex items-center gap-1", readOnly && "pointer-events-none")} onMouseLeave={() => setHover(null)}>
      {Array.from({ length: count }, (_, i) => {
        const fill = Math.max(0, Math.min(1, display - i));
        return (
          <button
            key={i}
            type="button"
            onClick={(e) => onChange?.(pick(e, i))}
            onMouseMove={(e) => !readOnly && setHover(pick(e, i))}
            className={cx("relative transition-transform", !readOnly && "cursor-pointer hover:scale-110")}
            aria-label={`${i + 1} estrelas`}
          >
            <Star className={cx(SIZES[size], "text-[hsl(var(--muted-foreground)/0.4)]")} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cx(SIZES[size], "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]")} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function RateDemo() {
  const [v1, setV1] = useState(3);
  const [v2, setV2] = useState(2.5);

  return (
    <div className="space-y-4 rounded-xl border bg-[hsl(var(--card))] p-5">
      <div className="flex items-center gap-4">
        <Rate value={v1} onChange={setV1} />
        <span className="font-mono text-sm text-[hsl(var(--muted-foreground))]">{v1.toFixed(1)} / 5</span>
      </div>
      <div className="flex items-center gap-4">
        <Rate value={v2} onChange={setV2} allowHalf size="lg" />
        <span className="font-mono text-sm text-[hsl(var(--muted-foreground))]">{v2.toFixed(1)} / 5 · meia estrela</span>
      </div>
      <div className="flex items-center gap-4">
        <Rate value={4.5} allowHalf readOnly />
        <span className="font-mono text-sm text-[hsl(var(--muted-foreground))]">4.5 / 5 · somente leitura</span>
      </div>
    </div>
  );
}
