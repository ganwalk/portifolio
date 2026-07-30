// Desliga a restauração automática de rolagem do navegador. Sem isso, ao
// recarregar a página (ou voltar por ela no histórico) depois de ter rolado,
// o navegador pula direto pra aquela posição antiga, ignorando o layout
// inicial da hero (cabeçalho escondido até a primeira dobra etc.) e dando a
// impressão de que a página "abriu" na segunda dobra. Precisa rodar antes da
// primeira pintura, antes que o navegador aplique a própria restauração;
// mesmo princípio do BoringBootScript, um script inline separado porque a
// preocupação aqui não tem nada a ver com Modo Boring.

const script = `try{if('scrollRestoration' in history){history.scrollRestoration='manual'}}catch(e){}`;

export function ScrollRestorationScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
