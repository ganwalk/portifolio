import type { Locale } from "@/i18n/config";

/** Texto localizado, todo conteúdo visível ao visitante existe nos três idiomas. */
export type Localized<T = string> = Record<Locale, T>;

export type CaseArea = "banking" | "music";

export type MediaKind = "image" | "video";

/**
 * Mídia de capa ou de vitrine. Enquanto as mídias reais não chegam, os src
 * apontam para placeholders do Pexels e do Picsum, escolhidos por afinidade
 * de tema. A troca é só substituir a URL, nenhum componente muda.
 */
export interface Media {
  kind: MediaKind;
  src: string;
  /** Quadro de capa exibido enquanto o vídeo carrega. Só para kind "video". */
  poster?: string;
  alt: Localized;
}

export interface CaseMetric {
  /** Valor exibido em número gigante na capa. "+XX%" enquanto o número real não é calibrado. */
  value: string;
  label: Localized;
  /** true enquanto o valor for placeholder/ilustrativo, exibe o disclaimer no case. */
  illustrative: boolean;
}

export interface CaseStudy {
  slug: string;
  area: CaseArea;
  title: Localized;
  /** Uma frase de resultado, em primeira pessoa, o "grito" da capa. */
  statement: Localized;
  tags: Localized<readonly string[]>;
  metrics: CaseMetric[];
  /** Mídia de fundo do painel full bleed na home e da capa do case. */
  cover: Media;
  /** Case ainda sem página completa publicada. */
  comingSoon: boolean;
  year: string;
  /**
   * Cases adjacentes com o mesmo `group` viram uma fatia só do carrossel da
   * home, lado a lado em vez de empilhados (ver CasesGrid). Não afeta a
   * página própria do case nem nenhum outro lugar que leia `cases`.
   */
  group?: string;
}

/** Um still do processo por trás de um experimento, revelado em ciclo no hover do card (ver ExperimentCard.tsx). */
export interface ProcessFrame {
  src: string;
  /** Frase curta dizendo que etapa do processo aquele still registra. */
  caption: Localized;
}

/** Um quadro de uma galeria que troca sozinha, sem precisar de hover (ver ExperimentCard.tsx). */
export interface GalleryFrame {
  src: string;
  alt: Localized;
  /** Ascii art de uma linha, mostrada na legenda que segue o mouse durante o hover. */
  asciiArt: string;
}

export interface Experiment {
  id: string;
  title: Localized;
  medium: Localized;
  media: Media;
  /** Bastidores reais, opcional: só cards com material de processo usam. Revelado só no hover. */
  process?: ProcessFrame[];
  /** Vitrine que cicla sozinha, opcional: só cards com uma série de peças usam. Troca com ou sem hover. */
  gallery?: GalleryFrame[];
}
