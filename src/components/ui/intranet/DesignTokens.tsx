"use client";

import { Check, Copy } from "lucide-react";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import { BentoCard } from "./BentoCard";
import { Tag, type TagTone } from "./Tag";
import { useCopyFeedback } from "./useCopyFeedback";

// Tokens de verdade do Design System de ganwalk/intranet (src/index.css),
// não uma paleta inventada para a vitrine: os valores HSL abaixo são cópia
// literal do :root e do .marca-b daquele arquivo. Renderizados nativamente
// aqui (sem imagem, sem iframe), porque o produto real é whitelabel: o
// mesmo conjunto de papéis semânticos (primária, sucesso, aviso...) troca
// de valor inteiro conforme a marca ativa, e ver as duas lado a lado é
// como esse sistema realmente se prova.
//
// Cada grupo (Marca A, Marca B, dataviz, Tag) mora na própria caixa da
// grid bento (ver BentoCard.tsx), e cada swatch ou tag é clicável: um
// clique copia o valor HSL de verdade pro clipboard, com um check curto de
// confirmação. Tokens não são só pra olhar, são pra usar.

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

function Swatch({
  groupId,
  token,
  copiedId,
  copiedLabel,
  onCopy,
}: {
  groupId: string;
  token: TokenSwatch;
  copiedId: string | null;
  copiedLabel: string;
  onCopy: (id: string, text: string) => void;
}) {
  const id = `${groupId}-${token.name}`;
  const copied = copiedId === id;
  return (
    <button
      type="button"
      onClick={() => onCopy(id, `hsl(${token.hsl})`)}
      className="group/swatch flex items-center gap-2 text-left"
    >
      <span
        className="relative h-8 w-8 shrink-0 overflow-hidden border border-line transition-transform duration-200 group-hover/swatch:scale-110"
        style={{ backgroundColor: `hsl(${token.hsl})` }}
      >
        <span
          className={`absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity duration-200 ${
            copied ? "opacity-100" : "group-hover/swatch:opacity-100"
          }`}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3 w-3" />}
        </span>
      </span>
      <p className="type-mono text-[10px] text-muted">{copied ? copiedLabel : token.name}</p>
    </button>
  );
}

function TokenGroup({
  groupId,
  tokens,
  copiedId,
  copiedLabel,
  onCopy,
}: {
  groupId: string;
  tokens: TokenSwatch[];
  copiedId: string | null;
  copiedLabel: string;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-3">
      {tokens.map((t) => (
        <Swatch key={t.name} groupId={groupId} token={t} copiedId={copiedId} copiedLabel={copiedLabel} onCopy={onCopy} />
      ))}
    </div>
  );
}

// Amostra do próprio Tag.tsx (ver src/components/ui/intranet/Tag.tsx): o
// mesmo componente usado no card do Roadmap, agora sozinho, mostrando as 14
// combinações tom·token de uma vez. Rótulos em lorem ipsum: aqui o texto é
// só conteúdo de exemplo pro tom da tag, não dado de caso real.
const TAG_TONES: TagTone[] = [
  "green",
  "violet",
  "amber",
  "blue",
  "magenta",
  "brick",
  "olive",
  "graphite",
  "success",
  "warning",
  "info",
  "error",
  "neutral",
  "primary",
];
const TAG_LABELS: Record<TagTone, string> = {
  green: "Lorem",
  violet: "Ipsum",
  amber: "Dolor",
  blue: "Sit",
  magenta: "Amet",
  brick: "Consectetur",
  olive: "Adipiscing",
  graphite: "Elit",
  success: "Sed do",
  warning: "Eiusmod",
  info: "Tempor",
  error: "Incididunt",
  neutral: "Labore",
  primary: "Magna",
};

const copiedLabels: Localized = { pt: "copiado", en: "copied", es: "copiado", zh: "已复制" };

const intro: Localized = {
  pt: "O produto é whitelabel: dois conjuntos de tokens semânticos e uma paleta categórica de oito cores para gráficos, todos em HSL. Clique em qualquer amostra para copiar o valor de verdade.",
  en: "The product is whitelabel: two sets of semantic tokens and an eight color categorical palette for charts, all in HSL. Click any swatch to copy the real value.",
  es: "El producto es whitelabel: dos conjuntos de tokens semánticos y una paleta categórica de ocho colores para gráficos, todos en HSL. Haz clic en cualquier muestra para copiar el valor real.",
  zh: "该产品是白标产品：两套语义令牌和一套八色图表分类色板，均为 HSL 格式。点击任意色块即可复制真实数值。",
};

const marcaATitle: Localized = { pt: "Tokens · Marca A", en: "Tokens · Brand A", es: "Tokens · Marca A", zh: "令牌 · A 品牌" };
const marcaADesc: Localized = {
  pt: "Paleta amarela, a marca padrão do produto. Sete papéis semânticos, de primária a erro.",
  en: "The yellow palette, the product's default brand. Seven semantic roles, from primary to error.",
  es: "Paleta amarilla, la marca predeterminada del producto. Siete roles semánticos, de primaria a error.",
  zh: "黄色调色板，产品的默认品牌。七种语义角色，从主色到错误色。",
};

const marcaBTitle: Localized = { pt: "Tokens · Marca B", en: "Tokens · Brand B", es: "Tokens · Marca B", zh: "令牌 · B 品牌" };
const marcaBDesc: Localized = {
  pt: "Paleta azul, a segunda marca do mesmo whitelabel. Os mesmos sete papéis, valores diferentes.",
  en: "The blue palette, the second brand on the same whitelabel. The same seven roles, different values.",
  es: "Paleta azul, la segunda marca del mismo whitelabel. Los mismos siete roles, valores diferentes.",
  zh: "蓝色调色板，同一白标产品的第二个品牌。相同的七种角色，不同的数值。",
};

const dataVizTitle: Localized = { pt: "Tokens · Dataviz", en: "Tokens · Dataviz", es: "Tokens · Dataviz", zh: "令牌 · 数据可视化" };
const dataVizDesc: Localized = {
  pt: "Paleta categórica de oito cores para gráficos, a mesma que alimenta o donut chart ao lado.",
  en: "An eight color categorical palette for charts, the same one that feeds the donut chart alongside it.",
  es: "Paleta categórica de ocho colores para gráficos, la misma que alimenta el gráfico de rosca de al lado.",
  zh: "八色图表分类色板，与旁边的环形图使用的是同一套。",
};

const tagsTitle: Localized = { pt: "Tag", en: "Tag", es: "Tag", zh: "标签" };
const tagsDesc: Localized = {
  pt: "Mesmo componente do card do Roadmap, em todos os tons de uma vez. Clique numa tag para copiar o token de cor por trás dela.",
  en: "The same component from the Roadmap card, every tone at once. Click a tag to copy the color token behind it.",
  es: "Mismo componente de la tarjeta del Roadmap, en todos los tonos a la vez. Haz clic en una etiqueta para copiar el token de color detrás de ella.",
  zh: "与路线图卡片相同的组件，一次展示全部色调。点击标签即可复制其背后的颜色令牌。",
};

const TAG_TOKEN_REF: Record<TagTone, string> = {
  green: "chart-1",
  violet: "chart-2",
  amber: "chart-3",
  blue: "chart-4",
  magenta: "chart-5",
  brick: "chart-6",
  olive: "chart-7",
  graphite: "chart-8",
  success: "success",
  warning: "warning",
  info: "info",
  error: "error",
  neutral: "muted",
  primary: "primary",
};

export function DesignTokens({ locale }: { locale: Locale }) {
  const { copiedId, copy } = useCopyFeedback();
  const copiedLabel = copiedLabels[locale];

  return (
    <div>
      <p className="text-lg text-muted">{intro[locale]}</p>
      <div className="mt-6 grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
        <BentoCard title={marcaATitle[locale]} description={marcaADesc[locale]}>
          <TokenGroup groupId="a" tokens={MARCA_A_TOKENS} copiedId={copiedId} copiedLabel={copiedLabel} onCopy={copy} />
        </BentoCard>
        <BentoCard title={marcaBTitle[locale]} description={marcaBDesc[locale]} delay={0.04}>
          <TokenGroup groupId="b" tokens={MARCA_B_TOKENS} copiedId={copiedId} copiedLabel={copiedLabel} onCopy={copy} />
        </BentoCard>
        <BentoCard title={dataVizTitle[locale]} description={dataVizDesc[locale]} delay={0.08} className="sm:col-span-2">
          <TokenGroup groupId="viz" tokens={CHART_TOKENS} copiedId={copiedId} copiedLabel={copiedLabel} onCopy={copy} />
        </BentoCard>
        <BentoCard title={tagsTitle[locale]} description={tagsDesc[locale]} delay={0.12} className="sm:col-span-2">
          <div className="intranet-scope flex flex-wrap gap-2">
            {TAG_TONES.map((tone) => {
              const id = `tag-${tone}`;
              const copied = copiedId === id;
              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => copy(id, TAG_TOKEN_REF[tone])}
                  className="transition-transform duration-200 hover:scale-110"
                >
                  <Tag tone={tone}>
                    {copied ? (
                      <>
                        <Check className="h-2.5 w-2.5" />
                        {copiedLabel}
                      </>
                    ) : (
                      TAG_LABELS[tone]
                    )}
                  </Tag>
                </button>
              );
            })}
          </div>
        </BentoCard>
      </div>
    </div>
  );
}
