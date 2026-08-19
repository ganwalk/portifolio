import type { LucideIcon } from "lucide-react";
import {
  Shapes,
  LayoutGrid,
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
} from "lucide-react";

// Índice de outras 17 partes documentadas no Design System real (das 70
// listadas em cases.ts), com a descrição de verdade copiada de
// ganwalk/intranet, src/pages/DesignSystem.tsx (prop `description` de cada
// ComponentShowcase/SectionThemeToggle). Não são componentes portados como
// os de cima: é um índice, com link para abrir cada um ao vivo na Intranet
// publicada.

export interface CatalogItem {
  icon: LucideIcon;
  name: string;
  description: string;
  anchor: string;
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
        icon: Shapes,
        name: "Ícones Phosphor",
        description: "Biblioteca Phosphor Icons usada em todo o produto. Inclui variantes regular, bold e fill.",
        anchor: "icons",
      },
      {
        icon: LayoutGrid,
        name: "Layout & espaçamento",
        description: "Ritmo vertical e alinhamento baseados em múltiplos de 15px. Container max-width 1200px.",
        anchor: "layout",
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
        anchor: "floaters",
      },
      {
        icon: ChevronDown,
        name: "Dropdown / FAQ",
        description: "Accordion para páginas de vendas. Ícone de mais que gira para x na abertura.",
        anchor: "faq",
      },
      {
        icon: Route,
        name: "Jornada do herói",
        description: "Timeline interativa com pontos clicáveis, barra de progresso e painel por etapa.",
        anchor: "journey",
      },
      {
        icon: TrendingUp,
        name: "Calculadora de rendimentos",
        description: "Simulação com slider de valor, resultado animado e identidade Marca A/Marca B.",
        anchor: "site-calc",
      },
      {
        icon: ArrowLeftRight,
        name: "Calculadora de câmbio",
        description: "Conversão de moedas com cálculo automático de IOF, VET e cotação em tempo real.",
        anchor: "tool-calc",
      },
      {
        icon: MessageSquare,
        name: "Tooltips & popups",
        description: "Tooltip simples por hover, popover com conteúdo rico por clique, popup de destaque.",
        anchor: "tooltips",
      },
      {
        icon: LayoutList,
        name: "Grade curricular",
        description: "Tabs com categorias e cards de módulos.",
        anchor: "grade",
      },
    ],
  },
  {
    label: "Plataforma de ensino",
    items: [
      {
        icon: GraduationCap,
        name: "Visualização de cursos",
        description: "Grid de cursos com cards de progresso, thumbnail e botão de retomada de aula.",
        anchor: "plat-courses",
      },
      {
        icon: PlayCircle,
        name: "Interface do player",
        description: "Player de vídeo com overlay de controles, volume, fullscreen e auto-hide.",
        anchor: "plat-player",
      },
      {
        icon: ListVideo,
        name: "Lista de aulas",
        description: "Três estados visuais: assistindo (amarelo), concluído (check verde) e bloqueado (cadeado).",
        anchor: "plat-playlist",
      },
      {
        icon: LayoutDashboard,
        name: "Dashboard do aluno",
        description: "KPIs de uso, gráfico de atividade semanal e grid de conquistas desbloqueadas.",
        anchor: "plat-dashboard",
      },
      {
        icon: StickyNote,
        name: "Notas & anotações",
        description: "Bloco de notas vinculado ao timestamp do vídeo, com carimbos de tempo clicáveis.",
        anchor: "plat-notes",
      },
      {
        icon: Award,
        name: "Certificados",
        description: "Emitidos automaticamente ao concluir um módulo, com botão de download em PDF.",
        anchor: "plat-certificates",
      },
      {
        icon: MessagesSquare,
        name: "Comunidade & dúvidas",
        description: "Fórum com votos, respostas de instrutores destacadas e filtros por status.",
        anchor: "plat-community",
      },
      {
        icon: BookOpen,
        name: "Livro",
        description: "Capa 3D inspirada no Book do Geist (Vercel), para hero de módulos e trilhas.",
        anchor: "plat-livro",
      },
    ],
  },
];
