import type { Localized } from "./types";

// Landing pages reais do ecossistema, linkadas uma a uma conforme ficam
// prontas (ver LandingPagesShowcase.tsx, que renderiza cada entrada numa
// simulação de janela de navegador: barra de endereço, still da própria
// página e link direto pra abrir ela de verdade). Lista vazia até a primeira
// entrada chegar, não um placeholder solto: o case (slug "ecossistema-auvp"
// em cases.ts) já existe e mostra as métricas reais, só o mosaico de
// páginas em si espera as URLs.
//
// `image`: still real da própria LP (screenshot da página publicada), não
// uma ilustração. `url`: link direto, abre em nova aba a partir do card.

export interface LandingPage {
  title: Localized;
  description: Localized;
  url: string;
  image: string;
}

export const landingPages: LandingPage[] = [];
