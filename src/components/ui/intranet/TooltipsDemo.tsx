"use client";

// Portado de ganwalk/intranet, src/components/widgets/TooltipsPopups.tsx:
// mesmas quatro posições reais (acima, abaixo, esquerda, direita), mesmo
// visual (bordas retas, tipografia uppercase, seta apontando pro
// gatilho). Passe o mouse em qualquer "Texto de referência" abaixo.

type Pos = "top" | "bottom" | "left" | "right";

const POSITIONS: { pos: Pos; label: string }[] = [
  { pos: "top", label: "Acima" },
  { pos: "bottom", label: "Abaixo" },
  { pos: "left", label: "Esquerda" },
  { pos: "right", label: "Direita" },
];

function TooltipDemo({ pos }: { pos: Pos }) {
  const balao =
    pos === "top"
      ? "bottom-full left-1/2 -translate-x-1/2 mb-3"
      : pos === "bottom"
        ? "top-full left-1/2 -translate-x-1/2 mt-3"
        : pos === "left"
          ? "right-full top-1/2 -translate-y-1/2 mr-3"
          : "left-full top-1/2 -translate-y-1/2 ml-3";

  const seta =
    pos === "top"
      ? "-bottom-1 left-1/2 -translate-x-1/2"
      : pos === "bottom"
        ? "-top-1 left-1/2 -translate-x-1/2"
        : pos === "left"
          ? "-right-1 top-1/2 -translate-y-1/2"
          : "-left-1 top-1/2 -translate-y-1/2";

  return (
    <div className="group relative inline-block">
      <span className="cursor-default text-xs font-medium text-[hsl(var(--ig-foreground))]">Texto de referência</span>
      <div
        role="tooltip"
        className={`pointer-events-none absolute ${balao} z-10 whitespace-nowrap rounded-none bg-[hsl(var(--primary))] px-3 py-1.5 text-[10px] font-bold uppercase text-[hsl(var(--primary-foreground))] opacity-0 shadow-lg transition-all duration-150 group-hover:opacity-100`}
      >
        Clique para interagir
        <div className={`absolute ${seta} h-2 w-2 rotate-45 bg-[hsl(var(--primary))]`} />
      </div>
    </div>
  );
}

export function TooltipsDemo() {
  return (
    <div className="rounded-xl border bg-[hsl(var(--card))] p-5">
      <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
        {POSITIONS.map(({ pos, label }) => (
          <div key={pos} className="flex flex-col items-center gap-3">
            <TooltipDemo pos={pos} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
