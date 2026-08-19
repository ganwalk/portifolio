// Duas entradas reais do Mural de Novidades de ganwalk/intranet
// (src/data/novidades.ts, edições de julho e junho de 2026), escolhidas por
// cobrirem as duas categorias opcionais do card (antes/depois, resultados),
// não uma amostra fabricada para a vitrine.

export interface NovidadeItem {
  emoji: string;
  titulo: string;
  descricao: string;
  antes?: string;
  depois?: string;
  resultados?: string[];
  envolvidos?: string[];
  link?: string;
}

export const novidadesSample: NovidadeItem[] = [
  {
    emoji: "🖥️",
    titulo: "Nova versão do Hub",
    descricao:
      "A nova versão do Hub já está disponível para todos os usuários. Desenvolvemos um visual mais moderno, com funcionalidades pensadas para facilitar ao máximo o acesso a todas as soluções no dia a dia.",
    antes: "O Hub reunia os produtos numa interface antiga, pensada quando o catálogo era bem menor.",
    depois: "Visual novo e funcionalidades que facilitam o acesso a todas as soluções em um só lugar.",
    envolvidos: ["Colaborador 1", "Colaborador 4", "Colaborador 7"],
  },
  {
    emoji: "📊",
    titulo: "[Produto A] completamente regravado",
    descricao:
      "A gente sempre acompanha os feedbacks de vocês e sabe que manter o conteúdo atualizado é essencial para a experiência de aprendizagem. Por isso, concluímos a regravação integral de todas as aulas do treinamento.",
    antes: "Aulas gravadas em versões anteriores, com o conteúdo internacional concentrado em uma única aula.",
    depois: "Treinamento inteiro regravado, com conteúdo 100% atualizado e dividido em partes menores para facilitar o estudo.",
    resultados: [
      "Módulo avançado dividido em partes menores, focadas em análise setorial",
      "Novo módulo sobre o mercado internacional",
      "Último módulo com o conteúdo 100% repaginado",
    ],
    envolvidos: ["Colaborador 3", "Colaborador 6", "Colaborador 9"],
  },
];
