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
  /**
   * Variante vertical, só para kind "video": troca `src`/`poster` por essa
   * a partir do mesmo breakpoint que decide mobile/desktop no resto do
   * site (ver MediaView.tsx). Opcional: mídia sem variante própria mostra a
   * mesma em qualquer tela, o comportamento de sempre.
   */
  srcMobile?: string;
  posterMobile?: string;
  alt: Localized;
  /**
   * Ponto de ancoragem do `object-cover` (ver MediaView.tsx). Padrão
   * "center". "top" força qualquer corte a preferir manter o topo do
   * quadro visível: usado por mídia onde o essencial já mora ali (ex.: um
   * still recém-cortado por baixo, ver o case de Landing Pages).
   */
  objectPosition?: "center" | "top";
}

export interface CaseMetric {
  /** Valor exibido em número gigante na capa. "+XX%" enquanto o número real não é calibrado. */
  value: string;
  label: Localized;
  /** true enquanto o valor for placeholder/ilustrativo, exibe o disclaimer no case. */
  illustrative: boolean;
}

/**
 * Statement de um case, em duas partes: `headline` é o "grito" curto, em
 * primeira pessoa, que carrega o peso tipográfico grande; `detail` é a
 * elaboração (o que exatamente, com o quê), numa coluna mais larga mas com
 * tipografia bem menor (ver CaseStatement.tsx). Duas frases separadas, não
 * uma só cortada ao meio: cada idioma pode reorganizar a ênfase como for
 * mais natural nele, sem depender de achar o mesmo ponto de corte.
 */
export interface CaseStatement {
  headline: Localized;
  detail: Localized;
}

export interface CaseStudy {
  slug: string;
  area: CaseArea;
  title: Localized;
  statement: CaseStatement;
  /**
   * Texto do selo que segue o cursor no hover (ver CasesGrid): pode ser
   * específico do case ("Ouvir o álbum") ou só "Veja mais", quando não faz
   * sentido prometer uma ação específica antes de abrir a página. Opcional:
   * sem ele, o selo cai pro texto padrão de dict.cases.viewCase (ou
   * comingSoon, se o case ainda não tiver página).
   */
  hoverLabel?: Localized;
  tags: Localized<readonly string[]>;
  metrics: CaseMetric[];
  /** Mídia de fundo do painel full bleed na home e da capa do case. */
  cover: Media;
  /** Case ainda sem página completa publicada. */
  comingSoon: boolean;
  /**
   * URL do repositório público no GitHub. Opcional: o botão "ver
   * repositório" do card só aparece quando o campo existe (ver CasesGrid).
   */
  repoUrl?: string;
  /**
   * URL do projeto publicado e ao vivo (GitHub Pages, Vercel etc). Opcional:
   * quando existe, o corpo do case (CaseDetail e ExpandedCase) embute essa
   * URL num iframe de verdade, navegável, no lugar das duas caixas de
   * still ainda vazias (ver LiveEmbed.tsx). Só faz sentido pra projeto que já
   * está no ar; cases sem hospedagem própria continuam com as caixas.
   */
  demoUrl?: string;
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
  /**
   * Comentário curto na legenda que segue o mouse durante o hover, sem
   * trocar a vitrine por nenhum still (ao contrário de `process`): pra
   * cards em que a mídia já fala por si, e o hover só acrescenta uma
   * observação à parte (ver ExperimentCard.tsx).
   */
  hoverNote?: Localized;
  /**
   * Vitrine nasce com um retículo de meio-tom por cima (preto e branco,
   * mistura em overlay) e a mídia em cinza, contraste puxado: um efeito de
   * dither, não a mídia "de verdade". O hover dissolve os dois de volta ao
   * normal (ver ExperimentCard.tsx). Opcional: só quem pede.
   */
  dither?: boolean;
}

/** Uma marca no carrossel "Marcas com que já trabalhei" (ver Brands.tsx). */
export interface Brand {
  name: Localized;
  /**
   * Logo real, em preto e branco (ver scripts/build-brand-logos.mjs).
   * Opcional: só o convite final ("Sua marca") fica sem.
   */
  logo?: string;
  /**
   * true só no convite final ("Sua marca"): ganha caixa pontilhada em vez de
   * nome sólido, a mesma linguagem de vaga aberta do resto do site.
   */
  isInvite?: boolean;
  /**
   * Compensa logo quadrada ou com margem transparente própria (a arte
   * original menor que a moldura do arquivo), que numa altura fixa igual
   * às retangulares (AUVP, Defensoria) acaba ocupando bem menos largura,
   * pesando visualmente menos no letreiro. "large": Minuto Indie, Hits
   * Perdidos. "xl": Mais Saúde, Boi Verde, ambas com margem própria maior
   * ainda, precisando de mais altura que "large" já dava pra emparelhar
   * com o resto. Sem o campo, altura padrão.
   */
  size?: "large" | "xl";
}
