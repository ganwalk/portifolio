import type { LucideIcon } from "lucide-react";
import {
  Shapes,
  LayoutGrid,
  Layers,
  MessageCircle,
  ChevronDown,
  Route,
  TrendingUp,
  ArrowLeftRight,
  MessageSquare,
  LayoutList,
  GraduationCap,
  PlayCircle,
  ListVideo,
  LayoutDashboard,
  StickyNote,
  Award,
  MessagesSquare,
  BookOpen,
  Megaphone,
  Blocks,
  Palette,
  Tag,
  Clock,
  DollarSign,
  Newspaper,
} from "lucide-react";

// Índice de 26 partes documentadas no Design System real (das 70 listadas
// em cases.ts), com a descrição de verdade copiada de ganwalk/intranet,
// src/pages/DesignSystem.tsx (prop `description` de cada
// ComponentShowcase/SectionThemeToggle). Um índice só, sem tratamento de
// destaque pra nenhuma entrada: Trilha do roadmap, Mural de novidades,
// Cores, Badges & Tags, Contagem regressiva e Tabela de preços tinham cada
// uma o próprio card interativo (código real portado, ver histórico de
// IntranetShowcase.tsx e BentoCard.tsx) num bloco de bento antes desta
// entrada única de página, pedido explícito pra virar só mais seis linhas
// do índice, como qualquer outra: a página estava carregada demais, cada
// tratamento especial competindo com os outros.
//
// Manual de Tom e Voz e Nossas Soluções (grupo "Conteúdo" abaixo) também já
// não têm mais still e link à parte, mesmo motivo. `path` aponta pra fora
// de /design-system nesses dois casos (são páginas próprias, não uma seção
// da página do Design System), por isso o campo é o caminho inteiro, não
// só um anchor dentro dela.

/** Origem do site publicado da Intranet: `path` de cada item é relativo a ela (ver Catalog.tsx e IntranetShowcase.tsx). */
export const INTRANET_ORIGIN = "https://ganwalk.github.io/intranet";

export interface CatalogItem {
  icon: LucideIcon;
  name: string;
  description: string;
  path: string;
}

export interface CatalogGroup {
  label: string;
  items: CatalogItem[];
}

export const catalogGroups: CatalogGroup[] = [
  {
    label: "Fundamentos",
    items: [
      {
        icon: Palette,
        name: "Cores",
        description:
          "Paleta de cores semânticas por marca (Marca A amarela, Marca B azul), mais a paleta categórica de oito cores que alimenta os gráficos.",
        path: "/design-system#colors",
      },
      {
        icon: Shapes,
        name: "Ícones Phosphor",
        description: "Biblioteca Phosphor Icons usada em todo o produto. Inclui variantes regular, bold e fill.",
        path: "/design-system#icons",
      },
      {
        icon: LayoutGrid,
        name: "Layout & espaçamento",
        description: "Ritmo vertical e alinhamento baseados em múltiplos de 15px. Container max-width 1200px.",
        path: "/design-system#layout",
      },
      {
        icon: Layers,
        name: "Sombras & elevação",
        description: "Escala de sombras para hierarquia de profundidade, do mais sutil ao mais elevado.",
        path: "/design-system#elevation",
      },
      {
        icon: Tag,
        name: "Badges & Tags",
        description:
          "Badge para status simples; Tag tokenizada para categorias e estados, usa os tokens de gráfico e semânticos, adaptando-se a light/dark e às marcas Marca A/Marca B.",
        path: "/design-system#tags-badges",
      },
    ],
  },
  {
    label: "Marketing & conversão",
    items: [
      {
        icon: MessageCircle,
        name: "Widgets flutuantes",
        description: "Botões flutuantes fixos com animação pulse contínua e z-index elevado.",
        path: "/design-system#floaters",
      },
      {
        icon: ChevronDown,
        name: "Dropdown / FAQ",
        description: "Accordion para páginas de vendas. Ícone de mais que gira para x na abertura.",
        path: "/design-system#faq",
      },
      {
        icon: Route,
        name: "Jornada do herói",
        description: "Timeline interativa com pontos clicáveis, barra de progresso e painel por etapa.",
        path: "/design-system#journey",
      },
      {
        icon: TrendingUp,
        name: "Calculadora de rendimentos",
        description: "Simulação com slider de valor, resultado animado e identidade Marca A/Marca B.",
        path: "/design-system#site-calc",
      },
      {
        icon: ArrowLeftRight,
        name: "Calculadora de câmbio",
        description: "Conversão de moedas com cálculo automático de IOF, VET e cotação em tempo real.",
        path: "/design-system#tool-calc",
      },
      {
        icon: MessageSquare,
        name: "Tooltips & popups",
        description: "Tooltip simples por hover, popover com conteúdo rico por clique, popup de destaque.",
        path: "/design-system#tooltips",
      },
      {
        icon: Clock,
        name: "Contagem regressiva",
        description:
          "Widget de countdown dinâmico focado em escassez. Cards com backdrop-blur e transparência. Exibe dias, horas, minutos e segundos em tempo real.",
        path: "/design-system#countdown",
      },
      {
        icon: DollarSign,
        name: "Tabela de preços",
        description:
          "Toggle animado com cards translúcidos, badge de desconto percentual e CTA primário em destaque.",
        path: "/design-system#pricing",
      },
    ],
  },
  {
    label: "Plataforma de ensino",
    items: [
      {
        icon: LayoutList,
        name: "Grade curricular",
        description: "Tabs com categorias e cards de módulos.",
        path: "/design-system#grade",
      },
      {
        icon: GraduationCap,
        name: "Visualização de cursos",
        description: "Grid de cursos com cards de progresso, thumbnail e botão de retomada de aula.",
        path: "/design-system#plat-courses",
      },
      {
        icon: PlayCircle,
        name: "Interface do player",
        description: "Player de vídeo com overlay de controles, volume, fullscreen e auto-hide.",
        path: "/design-system#plat-player",
      },
      {
        icon: ListVideo,
        name: "Lista de aulas",
        description: "Três estados visuais: assistindo (amarelo), concluído (check verde) e bloqueado (cadeado).",
        path: "/design-system#plat-playlist",
      },
      {
        icon: LayoutDashboard,
        name: "Dashboard do aluno",
        description: "KPIs de uso, gráfico de atividade semanal e grid de conquistas desbloqueadas.",
        path: "/design-system#plat-dashboard",
      },
      {
        icon: StickyNote,
        name: "Notas & anotações",
        description: "Bloco de notas vinculado ao timestamp do vídeo, com carimbos de tempo clicáveis.",
        path: "/design-system#plat-notes",
      },
      {
        icon: Award,
        name: "Certificados",
        description: "Emitidos automaticamente ao concluir um módulo, com botão de download em PDF.",
        path: "/design-system#plat-certificates",
      },
      {
        icon: MessagesSquare,
        name: "Comunidade & dúvidas",
        description: "Fórum com votos, respostas de instrutores destacadas e filtros por status.",
        path: "/design-system#plat-community",
      },
      {
        icon: BookOpen,
        name: "Livro",
        description: "Capa 3D inspirada no Book do Geist (Vercel), para hero de módulos e trilhas.",
        path: "/design-system#plat-livro",
      },
    ],
  },
  {
    label: "Componentes especiais",
    items: [
      {
        icon: Route,
        name: "Trilha do roadmap",
        description: "Trilha em onda dos marcos de produto. Arraste, use as setas ou o teclado para navegar.",
        path: "/design-system#roadmap-timeline",
      },
      {
        icon: Newspaper,
        name: "Mural de novidades",
        description: "Card de uma entrega do mural, com blocos opcionais de antes/depois, resultados e envolvidos.",
        path: "/design-system#mural-novidades",
      },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      {
        icon: Megaphone,
        name: "Manual de Tom e Voz",
        description:
          "Guia de comunicação por área da empresa (dez ao todo, do atendimento ao jurídico) e por produto, com exemplos reais de erro e correção lado a lado.",
        path: "/tom-e-voz#fundador",
      },
      {
        icon: Blocks,
        name: "Nossas Soluções",
        description: "Guia dos cinco produtos do ecossistema, cada um com sua própria seção, terminando numa tabela comparativa.",
        path: "/solucoes#resumo",
      },
    ],
  },
];
