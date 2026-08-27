import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";
import { catalogGroups, INTRANET_ORIGIN } from "./catalog";

// Índice de 26 partes documentadas no Design System real (das 70 listadas
// em cases.ts): nome, ícone e a descrição de verdade de cada uma, com link
// para abrir ao vivo na Intranet publicada. Um índice só, sem porta de
// código nem tratamento de destaque pra nenhuma entrada (ver catalog.ts):
// cobre a variedade do sistema (plataforma de ensino, jornadas,
// calculadoras, a trilha do roadmap, o manual de tom e voz, o guia de
// soluções...) numa página só, sem competir consigo mesma.

const intro: Localized = {
  pt: "26 partes do Design System (das 70 documentadas), cada uma com link direto para abrir ao vivo na Intranet publicada.",
  en: "26 parts of the Design System (out of the 70 documented), each linking straight to the live one on the published Intranet.",
  es: "26 partes del Design System (de las 70 documentadas), cada una con enlace directo para abrirla en vivo en la Intranet publicada.",
  zh: "设计系统的 26 个部分（共 70 个已归档），每个都直接链接到已发布内网上的实际版本。",
};

export function Catalog({ locale }: { locale: Locale }) {
  return (
    <div>
      <p className="text-lg text-muted">{intro[locale]}</p>
      <div className="mt-6 space-y-8">
        {catalogGroups.map((group) => (
          <div key={group.label}>
            <p className="type-mono text-muted">{group.label}</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={`${INTRANET_ORIGIN}${item.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-3 border border-line bg-background p-4 transition-colors hover:bg-surface"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-foreground" strokeWidth={1.5} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold">{item.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
