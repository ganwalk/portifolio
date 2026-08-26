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
} from "lucide-react";

// Índice de outras 20 partes documentadas no Design System real (das 70
// listadas em cases.ts), com a descrição de verdade copiada de
// ganwalk/intranet, src/pages/DesignSystem.tsx (prop `description` de cada
// ComponentShowcase/SectionThemeToggle). Não são componentes portados como
// os de cima: é um índice, com link para abrir cada um ao vivo na Intranet
// publicada.
//
// Manual de Tom e Voz e Nossas Soluções (grupo "Conteúdo" abaixo) moravam
// num bloco à parte, com still e link (ver histórico de IntranetShowcase.tsx):
// pedido explícito pra virarem só mais duas entradas do índice, como
// qualquer uma das outras 18, não um tratamento especial. `path` aponta pra
// fora de /design-system nesses dois casos (são páginas próprias, não uma
// seção da página do Design System), por isso o campo é o caminho inteiro,
// não só um anchor dentro dela.

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
