import type { LucideIcon } from "lucide-react";
import {
  Monitor,
  Palette,
  MessageSquareQuote,
  Search,
  Layers,
  Package,
  HeartHandshake,
  Accessibility,
  MessagesSquare,
  Smartphone,
  Handshake,
  Gift,
} from "lucide-react";
import type { TagTone } from "./Tag";

// Dados reais de ganwalk/intranet, src/data/roadmapMarcos.ts: os marcos de
// verdade do roadmap do produto, não uma amostra fabricada para a vitrine.
// Único ajuste: os campos `to` (rota interna da SPA da Intranet, que não
// existe aqui) viraram `href` para a página real correspondente no site
// publicado.

export type MarcoStatus = "concluido" | "em-andamento" | "planejado" | "adiado";

export interface Marco {
  id: string;
  icon: LucideIcon;
  titulo: string;
  quando: string;
  periodo: string;
  data: string;
  descricao: string;
  status: MarcoStatus;
  tone: TagTone;
  detalhes?: string[];
  href?: string;
  dataAssumida?: boolean;
  continuo?: boolean;
  semData?: boolean;
}

const INTRANET_ORIGIN = "https://ganwalk.github.io/intranet";

export const marcos: Marco[] = [
  {
    id: "hub-v1",
    icon: Monitor,
    titulo: "Lançamento da Central de Produto",
    quando: "Janeiro de 2026",
    periodo: "Jan",
    data: "2026-01-19",
    status: "concluido",
    tone: "graphite",
    descricao:
      "Primeira versão da Central de Produto: um único lugar para o time acompanhar entregas, roadmap e novidades.",
    detalhes: [
      "Acesso unificado às informações de produto em uma só tela",
      "Base que serviu de aprendizado para as próximas melhorias do Hub",
    ],
  },
  {
    id: "design-system",
    icon: Palette,
    titulo: "Design System",
    quando: "Fevereiro de 2026",
    periodo: "Fev",
    data: "2026-02-12",
    status: "concluido",
    tone: "magenta",
    descricao:
      "Tokens, componentes e padrões de interface reunidos e documentados, a base visual compartilhada por todos os produtos.",
    detalhes: [
      "Tokens de cor, tipografia e espaçamento com suporte a tema claro e escuro",
      "Biblioteca de componentes documentada e navegável dentro da Central",
      "Escala de cores adequada também para materiais impressos (CMYK)",
    ],
    href: `${INTRANET_ORIGIN}/design-system`,
  },
  {
    id: "tom-e-voz",
    icon: MessageSquareQuote,
    titulo: "Manual de Tom e Voz",
    quando: "Março de 2026",
    periodo: "Mar",
    data: "2026-03-06",
    status: "concluido",
    tone: "blue",
    descricao:
      "O jeito da empresa de falar virou guia: diretrizes de linguagem por área e por produto, para a comunicação soar como uma só voz.",
    detalhes: ["Diretrizes de linguagem para cada área da empresa", "Seções específicas por produto"],
    href: `${INTRANET_ORIGIN}/tom-e-voz`,
  },
  {
    id: "busca-global",
    icon: Search,
    titulo: "Busca global da Central",
    quando: "Março de 2026",
    periodo: "Mar",
    data: "2026-03-28",
    status: "concluido",
    tone: "violet",
    descricao:
      "Atalho de teclado que abre uma busca única para páginas, componentes, pessoas e ações, sem precisar navegar pelos menus.",
    detalhes: ["Busca por páginas, seções do Design System e do guia de soluções", "Atalho rápido para trocar de tema"],
  },
  {
    id: "solucoes",
    icon: Layers,
    titulo: "Guia de Nossas Soluções",
    quando: "Abril a junho de 2026",
    periodo: "Abr–Jun",
    data: "2026-04-08",
    status: "em-andamento",
    tone: "amber",
    continuo: true,
    descricao: "Publicação, seção por seção, do guia com a visão geral de cada produto do ecossistema.",
    detalhes: [
      "Abril: primeiras seções publicadas",
      "Maio: inclusão de recursos e condições por produto",
      "Junho: revisão geral com o time comercial",
    ],
    href: `${INTRANET_ORIGIN}/solucoes`,
  },
  {
    id: "produtos-fisicos",
    icon: Package,
    titulo: "Catálogo de Produtos Físicos",
    quando: "Maio de 2026",
    periodo: "Mai",
    data: "2026-05-21",
    status: "concluido",
    tone: "brick",
    descricao: "Portfólio com os kits, brindes e materiais impressos desenvolvidos pelo time, organizado por categoria.",
    detalhes: [
      "Filtro por categoria e destaques na página inicial",
      "Registro centralizado para consulta rápida do que já existe",
    ],
  },
  {
    id: "onboarding",
    icon: HeartHandshake,
    titulo: "Trilha de onboarding do time",
    quando: "Julho de 2026",
    periodo: "Jul",
    data: "2026-07-06",
    dataAssumida: true,
    status: "concluido",
    tone: "success",
    descricao:
      "Roteiro de boas-vindas para quem entra no time: o que ler primeiro, quem procurar em cada assunto e como usar a Central no dia a dia.",
    detalhes: ["Checklist da primeira semana", "Indicação de quem chamar em cada área do time"],
  },
  {
    id: "qa-design",
    icon: MessagesSquare,
    titulo: "Q&A de Design",
    quando: "Julho de 2026",
    periodo: "Jul",
    data: "2026-07-22",
    status: "concluido",
    tone: "info",
    descricao:
      "Rodada aberta de perguntas e respostas do time de Design com a empresa: como pedir, como priorizamos e como usar o Design System no dia a dia.",
    detalhes: [
      "Sessão aberta para tirar dúvidas sobre a esteira de Design",
      "Como abrir uma solicitação e o que o time precisa receber junto",
    ],
  },
  {
    id: "acessibilidade",
    icon: Accessibility,
    titulo: "Auditoria de acessibilidade",
    quando: "Agosto de 2026",
    periodo: "Ago",
    data: "2026-08-19",
    status: "planejado",
    tone: "warning",
    descricao:
      "Revisão dos componentes do Design System contra o checklist WCAG 2.1 AA: contraste, navegação por teclado e leitores de tela.",
    detalhes: [
      "Checklist de contraste e foco visível em todos os componentes base",
      "Ajustes priorizados por impacto no uso do dia a dia",
    ],
  },
  {
    id: "integracao-chat",
    icon: Handshake,
    titulo: "Integração com o chat do time",
    quando: "Adiada, nova data a definir",
    periodo: "Sem data",
    data: "2026-09-10",
    status: "adiado",
    tone: "neutral",
    descricao:
      "Notificações de novidades e roadmap direto no chat interno da equipe foram adiadas. Assim que a nova data fechar, ela aparece aqui.",
  },
  {
    id: "app-mobile",
    icon: Smartphone,
    titulo: "Central de Produto no celular",
    quando: "Novembro de 2026",
    periodo: "Nov",
    data: "2026-11-16",
    status: "planejado",
    tone: "primary",
    descricao: "Versão otimizada para celular, para consultar o Design System e o guia de soluções fora do computador.",
  },
  {
    id: "programa-indicacao",
    icon: Gift,
    titulo: "Programa de indicações",
    quando: "Em breve",
    periodo: "Em breve",
    data: "2027-01-01",
    semData: true,
    status: "planejado",
    tone: "graphite",
    descricao:
      "Um jeito simples de indicar novas pessoas e acompanhar o status de cada indicação, com reconhecimento para quem participa.",
  },
];

export const marcosOrdenados: Marco[] = [...marcos].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));

export function indiceMarcoAtual(ref: Date = new Date()): number {
  const hoje = ref.toISOString().slice(0, 10);
  const i = marcosOrdenados.findIndex((m) => m.data >= hoje);
  return i === -1 ? marcosOrdenados.length - 1 : i;
}
