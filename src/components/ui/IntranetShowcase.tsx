"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Reveal } from "./Reveal";
import { RepoLink } from "./RepoLink";
import { Catalog } from "./intranet/Catalog";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Corpo do case da Intranet. Já teve uma bento inteira aqui (tokens de cor
// e seis componentes do Design System portados de verdade, código real
// rodando nativamente, sem imagem nem iframe): pedido explícito pra
// simplificar, a página nunca ficou satisfatória com tanto tratamento
// especial competindo entre si (ver histórico de BentoCard.tsx e
// DesignTokens.tsx, removidos). Depois disso, um quadro estático com o
// still do vídeo de capa (intranet-preview.webp) ocupou o lugar por um
// tempo. Agora esse quadro também sai: no lugar dele, um índice de
// verdade (abrir o site ao vivo, ir direto pro repositório) mais o lembrete
// de que a documentação do Design System é portável pra qualquer stack via
// IA, com um prompt pronto pra copiar. A versão viva do site continua um
// clique de distância, só que agora no topo da própria vitrine, não mais
// escondida atrás de uma imagem estática.
//
// As 26 partes do Design System (as seis que tinham card próprio, incluídas)
// moram todas no índice abaixo (ver Catalog.tsx e catalog.ts).

const languagesHeading: Localized = {
  pt: "Design System em qualquer linguagem",
  en: "Design System in any language",
  es: "Design System en cualquier lenguaje",
  zh: "适用于任何语言的设计系统",
};

const languagesIntro: Localized = {
  pt: "O código de produção é React, mas cada componente documentado carrega tokens e comportamento o bastante pra qualquer IA recriar a mesma peça em outra linguagem. Copie o prompt abaixo e cole numa IA de sua confiança.",
  en: "The production code is React, but every documented component carries enough tokens and behavior for any AI to recreate the same piece in another language. Copy the prompt below and paste it into an AI you trust.",
  es: "El código de producción es React, pero cada componente documentado lleva tokens y comportamiento suficientes para que cualquier IA recree la misma pieza en otro lenguaje. Copia el prompt de abajo y pégalo en una IA de tu confianza.",
  zh: "生产代码是用React写的，但每个已归档的组件都带有足够的样式标记和行为说明，任何AI都能用它在别的语言里重建同一个组件。复制下面的提示词，粘贴到你信任的AI里即可。",
};

const copyLabel: Localized = {
  pt: "Copiar prompt",
  en: "Copy prompt",
  es: "Copiar prompt",
  zh: "复制提示词",
};

const copiedLabel: Localized = {
  pt: "Prompt copiado",
  en: "Prompt copied",
  es: "Prompt copiado",
  zh: "提示词已复制",
};

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

function promptFor(locale: Locale, repoUrl: string): string {
  const templates: Localized = {
    pt: `Você é um engenheiro de front-end. Com base no Design System documentado em ${repoUrl} (cores semânticas por marca, espaçamento em múltiplos de 15px, escala de sombras e mais de 70 componentes catalogados), recrie [componente ou tela] na linguagem ou framework que eu indicar (React, Vue, Flutter, SwiftUI, HTML puro etc.), preservando os tokens visuais e o comportamento original, adaptados à sintaxe idiomática de cada stack.`,
    en: `You're a front-end engineer. Based on the Design System documented at ${repoUrl} (brand semantic colors, spacing in multiples of 15px, an elevation scale and more than 70 cataloged components), recreate [component or screen] in the language or framework I specify (React, Vue, Flutter, SwiftUI, plain HTML etc.), preserving the original visual tokens and behavior, adapted to each stack's idiomatic syntax.`,
    es: `Eres un ingeniero front-end. Con base en el Design System documentado en ${repoUrl} (colores semánticos por marca, espaciado en múltiplos de 15px, escala de sombras y más de 70 componentes catalogados), recrea [componente o pantalla] en el lenguaje o framework que indique (React, Vue, Flutter, SwiftUI, HTML puro etc.), preservando los tokens visuales y el comportamiento original, adaptados a la sintaxis idiomática de cada stack.`,
    zh: `你是一名前端工程师。基于${repoUrl}中记录的设计系统（按品牌划分的语义色彩、以15px为倍数的间距、阴影层级，以及七十多个已归档组件），请用我指定的语言或框架（React、Vue、Flutter、SwiftUI、纯HTML等）重建[组件或页面名称]，保留原始的视觉标记和行为，并适配每种技术栈的惯用语法。`,
  };
  return templates[locale];
}

export function IntranetShowcase({
  locale,
  demoUrl,
  repoUrl,
  title,
  dict,
  className = "",
}: {
  locale: Locale;
  demoUrl: string;
  repoUrl: string;
  title: string;
  dict: Dictionary;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const prompt = promptFor(locale, repoUrl);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Permissão de clipboard negada ou API indisponível: o botão só não
      // confirma a cópia, o texto do prompt continua selecionável à mão.
    }
  }

  return (
    <div className={className}>
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between gap-6 border-b border-line px-6 py-5 sm:px-8 sm:py-6">
            <a
              href={demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="type-mono inline-flex items-center gap-2 text-foreground transition-colors hover:text-muted"
            >
              {dict.cases.openDemo}
              <span aria-hidden>↗</span>
            </a>
            <RepoLink repoUrl={repoUrl} title={title} dict={dict} />
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <p className="type-mono text-muted">{languagesHeading[locale]}</p>
            <p className="mt-3 text-lg text-muted">{languagesIntro[locale]}</p>

            <div className="relative mt-5">
              <pre className="type-mono overflow-x-auto whitespace-pre-wrap rounded-xl border border-line bg-background p-4 pr-14 text-xs leading-relaxed text-muted sm:text-sm">
                {prompt}
              </pre>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? copiedLabel[locale] : copyLabel[locale]}
                className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted transition-colors hover:text-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.08} className="mt-14">
        <p className="type-mono text-muted">{catalogHeading[locale]}</p>
        <div className="mt-3">
          <Catalog locale={locale} />
        </div>
      </Reveal>
    </div>
  );
}
