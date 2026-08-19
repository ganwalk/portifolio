import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import { SimboloIcon } from "./simboloPath";

// Tokens de verdade do Design System de ganwalk/intranet (src/index.css),
// não uma paleta inventada para a vitrine: os valores HSL abaixo são cópia
// literal do :root e do .marca-b daquele arquivo. Renderizados nativamente
// aqui (sem imagem, sem iframe), porque o produto real é whitelabel: o
// mesmo conjunto de papéis semânticos (primária, sucesso, aviso...) troca
// de valor inteiro conforme a marca ativa, e ver as duas lado a lado é
// como esse sistema realmente se prova.

interface TokenSwatch {
  name: string;
  hsl: string;
}

const MARCA_A_TOKENS: TokenSwatch[] = [
  { name: "primary", hsl: "42 96% 46%" },
  { name: "secondary", hsl: "42 55% 20%" },
  { name: "accent", hsl: "40 95% 32%" },
  { name: "success", hsl: "142 72% 29%" },
  { name: "warning", hsl: "35 95% 42%" },
  { name: "info", hsl: "210 90% 42%" },
  { name: "error", hsl: "0 78% 50%" },
];

const MARCA_B_TOKENS: TokenSwatch[] = [
  { name: "primary", hsl: "217 85% 60%" },
  { name: "secondary", hsl: "217 60% 52%" },
  { name: "accent", hsl: "217 83% 58%" },
  { name: "success", hsl: "36 90% 32%" },
  { name: "warning", hsl: "35 95% 42%" },
  { name: "info", hsl: "190 85% 35%" },
  { name: "error", hsl: "0 78% 52%" },
];

const CHART_TOKENS: TokenSwatch[] = [
  { name: "chart-1", hsl: "42 75% 42%" },
  { name: "chart-2", hsl: "270 60% 55%" },
  { name: "chart-3", hsl: "38 92% 55%" },
  { name: "chart-4", hsl: "199 89% 48%" },
  { name: "chart-5", hsl: "150 55% 38%" },
  { name: "chart-6", hsl: "300 55% 45%" },
  { name: "chart-7", hsl: "90 55% 40%" },
  { name: "chart-8", hsl: "220 30% 35%" },
];

function Swatch({ token }: { token: TokenSwatch }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 shrink-0 border border-line" style={{ backgroundColor: `hsl(${token.hsl})` }} />
      <p className="type-mono text-[10px] text-muted">{token.name}</p>
    </div>
  );
}

function PaletteRow({ label, tokens }: { label: string; tokens: TokenSwatch[] }) {
  return (
    <div>
      <p className="type-mono text-muted">{label}</p>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
        {tokens.map((t) => (
          <Swatch key={`${label}-${t.name}`} token={t} />
        ))}
      </div>
    </div>
  );
}

function Monograma({ fill, bg, label }: { fill: string; bg: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-line p-2" style={{ backgroundColor: bg }}>
        <SimboloIcon fill={fill} className="h-full w-full" />
      </div>
      <p className="type-mono text-[10px] text-muted">{label}</p>
    </div>
  );
}

const heading: Localized = {
  pt: "Tokens de design",
  en: "Design tokens",
  es: "Tokens de diseño",
  zh: "设计令牌",
};

const intro: Localized = {
  pt: "O produto é whitelabel: dois conjuntos de tokens semânticos (Marca A, amarela, e Marca B, azul) e uma paleta categórica de oito cores para gráficos, todos em HSL. Valores reais, renderizados aqui direto, sem imagem nem iframe.",
  en: "The product is whitelabel: two sets of semantic tokens (Brand A, yellow, and Brand B, blue) and an eight color categorical palette for charts, all in HSL. Real values, rendered here directly, no image, no iframe.",
  es: "El producto es whitelabel: dos conjuntos de tokens semánticos (Marca A, amarilla, y Marca B, azul) y una paleta categórica de ocho colores para gráficos, todos en HSL. Valores reales, renderizados aquí directamente, sin imagen ni iframe.",
  zh: "该产品是白标产品：两套语义令牌（黄色的 A 品牌和蓝色的 B 品牌）以及一套八色图表分类色板，均为 HSL 格式。这里直接渲染真实数值，没有图片，也没有 iframe。",
};

const brandLabel: Localized = {
  pt: "Marca (o mesmo monograma, cor de acento própria por marca)",
  en: "Brand mark (same monogram, own accent color per brand)",
  es: "Marca (el mismo monograma, color de acento propio por marca)",
  zh: "品牌标志（相同的字标，每个品牌各自的强调色）",
};

export function DesignTokens({ locale }: { locale: Locale }) {
  return (
    <div>
      <p className="text-lg text-muted">{intro[locale]}</p>
      <div className="mt-6 space-y-6">
        <PaletteRow label={`${heading[locale]} · Marca A`} tokens={MARCA_A_TOKENS} />
        <PaletteRow label={`${heading[locale]} · Marca B`} tokens={MARCA_B_TOKENS} />
        <PaletteRow label={`${heading[locale]} · dataviz`} tokens={CHART_TOKENS} />
        <div>
          <p className="type-mono text-muted">{brandLabel[locale]}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
            <Monograma fill="#111111" bg="#f4f4f4" label="preto" />
            <Monograma fill="#ffffff" bg="#111111" label="branco" />
            <Monograma fill="#E6A205" bg="#111111" label="acento · A" />
            <Monograma fill="#2B76EE" bg="#111111" label="acento · B" />
          </div>
        </div>
      </div>
    </div>
  );
}
