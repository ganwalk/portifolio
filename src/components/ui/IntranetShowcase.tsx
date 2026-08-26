import { Reveal } from "./Reveal";
import { Catalog } from "./intranet/Catalog";
import type { Localized } from "@/data/types";
import type { Locale } from "@/i18n/config";

// basePath não é aplicado a src montado à mão em JS (só a next/image e
// links internos do próprio Next): mesmo motivo do CONTACT_IMAGE em
// Contact.tsx e do basePath em experiments.ts.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Corpo do case da Intranet. Já teve uma bento inteira aqui (tokens de cor
// e seis componentes do Design System portados de verdade, código real
// rodando nativamente, sem imagem nem iframe): pedido explícito pra
// simplificar, a página nunca ficou satisfatória com tanto tratamento
// especial competindo entre si. No lugar da bento, um quadro com a mesma
// imagem que já serve de still pro vídeo de capa do case
// (photos/intranet-preview.webp: zoom saindo de um mosaico de telas do
// Design System até o Dashboard do Aluno), representando o site inteiro de
// uma vez. Só imagem estática, de propósito (pedido explícito): nada de
// vídeo nem iframe aqui, essa prévia é só um resumo visual, a versão viva
// continua um clique de distância ("ver o site completo", ver
// CaseDetail.tsx: mora lá agora, não mais aqui dentro, pra ficar na mesma
// fileira do link do repositório em vez de duas linhas soltas).
//
// aspect-[1440/900], a proporção NATIVA de verdade da imagem (1440×900,
// mesma resolução do vídeo original que ela representa), não um 4:3
// arredondado: um quadro 4:3 forçava esse object-cover a cortar as bordas
// laterais da imagem (1440/900 = 1.6, mais larga que 4:3 = 1.33), pedido
// explícito pra não cortar nada.
//
// As 26 partes do Design System (as seis que tinham card próprio, incluídas)
// moram todas no índice agora, sem exceção (ver Catalog.tsx e catalog.ts).

const coverAlt: Localized = {
  pt: "Zoom saindo de um mosaico de telas do Design System até o Dashboard do Aluno, com progresso e atividade semanal",
  en: "Zooming out from a mosaic of Design System screens to the Student Dashboard, showing progress and weekly activity",
  es: "Zoom que sale de un mosaico de pantallas del Design System hasta el Dashboard del Alumno, con progreso y actividad semanal",
  zh: "从设计系统屏幕的马赛克拉远到学员仪表盘，展示学习进度和每周活动",
};

const catalogHeading: Localized = {
  pt: "Índice do Design System",
  en: "Design System index",
  es: "Índice del Design System",
  zh: "设计系统索引",
};

export function IntranetShowcase({
  locale,
  className = "",
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <div className={className}>
      <Reveal>
        <div className="aspect-[1440/900] overflow-hidden rounded-2xl border border-line bg-surface">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${basePath}/photos/intranet-preview.webp`}
            alt={coverAlt[locale]}
            className="h-full w-full object-contain"
          />
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
