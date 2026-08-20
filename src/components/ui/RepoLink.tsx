import { GitHubIcon } from "./icons/GitHubIcon";
import type { Dictionary } from "@/i18n/dictionaries";

// Link do repositório de um case: mora só na página dedicada (/work/[slug])
// e no overlay expandido do carrossel na home (ver ExpandedCase em
// CasesGrid.tsx), mesmo motivo de CaseStatement/CaseMetrics, um bloco só,
// não duas cópias divergindo com o tempo. Os cartões de prévia da home
// (CaseColumn, MobileCaseCard) não mostram mais nada além do nome do
// projeto e do botão "ver case": índice, métrica, tags e este link viraram
// conteúdo só da página/overlay de cada projeto, não da vitrine.

export function RepoLink({
  repoUrl,
  title,
  dict,
  className = "",
}: {
  repoUrl: string;
  title: string;
  dict: Dictionary;
  className?: string;
}) {
  return (
    <a
      href={repoUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${dict.cases.repo} · ${title}`}
      className={`type-mono inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground ${className}`}
    >
      <GitHubIcon className="h-3.5 w-3.5" />
      {dict.cases.repo}
    </a>
  );
}
