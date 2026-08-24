// Portado de ganwalk/intranet, src/components/widgets/Tag.tsx: badge
// tokenizado do Design System real do produto (paleta --chart-* e tokens
// semânticos --success/--warning/--info/--error), não uma recriação. As
// cores do template original entram como classes utilitárias arbitrárias
// (bg-[hsl(var(--chart-1)/0.14)]) em vez de bg-emerald-100 etc.: o Tailwind
// deste site não conhece o tema do outro projeto, então os tokens precisam
// estar escritos por extenso, resolvidos pelas variáveis definidas em
// .intranet-scope (ver globals.css) qualquer que seja o wrapper em volta.

export type TagTone =
  | "green"
  | "violet"
  | "amber"
  | "blue"
  | "magenta"
  | "brick"
  | "olive"
  | "graphite"
  | "success"
  | "warning"
  | "info"
  | "error"
  | "neutral"
  | "primary";

export const tagToneClasses: Record<TagTone, string> = {
  green: "bg-[hsl(var(--chart-1)/0.14)] text-[hsl(var(--chart-1))]",
  violet: "bg-[hsl(var(--chart-2)/0.14)] text-[hsl(var(--chart-2))]",
  amber: "bg-[hsl(var(--chart-3)/0.16)] text-[hsl(var(--chart-3))]",
  blue: "bg-[hsl(var(--chart-4)/0.14)] text-[hsl(var(--chart-4))]",
  magenta: "bg-[hsl(var(--chart-5)/0.14)] text-[hsl(var(--chart-5))]",
  brick: "bg-[hsl(var(--chart-6)/0.14)] text-[hsl(var(--chart-6))]",
  olive: "bg-[hsl(var(--chart-7)/0.16)] text-[hsl(var(--chart-7))]",
  graphite: "bg-[hsl(var(--chart-8)/0.14)] text-[hsl(var(--chart-8))]",
  success: "bg-[hsl(var(--success)/0.14)] text-[hsl(var(--success))]",
  warning: "bg-[hsl(var(--warning)/0.16)] text-[hsl(var(--warning))]",
  info: "bg-[hsl(var(--info)/0.14)] text-[hsl(var(--info))]",
  error: "bg-[hsl(var(--error)/0.14)] text-[hsl(var(--error))]",
  neutral: "bg-[hsl(var(--ig-muted))] text-[hsl(var(--muted-foreground))]",
  primary: "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary-emphasis))]",
};

interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: TagTone;
}

export function Tag({ tone = "neutral", className = "", children, ...props }: TagProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tagToneClasses[tone]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
