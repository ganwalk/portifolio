# Arquitetura do portfólio

Documento vivo. Toda decisão técnica ou de direção de arte que sair da conversa
entra aqui.

## O que este site é

Portfólio de Armando Custodio, Design Engineer. Duas experiências no mesmo
conteúdo: a criativa, com textura e movimento, e a utilitária (Modo Boring),
que também serve de currículo imprimível.

## Decisões travadas

| Tema                | Decisão                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Navegação           | Home imersiva com cases em rota própria (`/[locale]/work/[slug]`)        |
| Hospedagem          | GitHub Pages agora, Vercel depois sem retrabalho                         |
| Conteúdo            | Arquivos TypeScript tipados no repositório, sem CMS                      |
| Cases da AUVP       | Autorização formal de uso das telas reais concedida: mídia e métricas reais liberadas, sem recriação nem ilustração |
| Tema padrão         | Segue o sistema operacional de quem visita                               |
| Tipografia          | Híbrida por contexto (ver abaixo)                                        |
| Brasilidade         | Calor no tom de voz, visual universal                                    |
| Habilidades extras  | Prova viva no próprio site mais um bloco compacto na home                |
| Botões              | Sempre quadrados, sem arredondamento                                     |
| Som                 | Nenhum: interface silenciosa, sem camada de áudio                        |
| Custo               | Zero, em todas as camadas                                                |

## Stack

- **Next.js 16** com App Router e `output: "export"`. Sem servidor: nada de
  middleware, rotas de API ou otimização de imagem no servidor.
- **TypeScript** em tudo, conteúdo incluído.
- **Tailwind CSS 4** com tokens declarados em `@theme inline` sobre variáveis CSS.
- **Framer Motion** para animação, sempre atrás do interruptor do Modo Boring.
- **Lenis** para a rolagem suave da página inteira (ver Rolagem, abaixo).
- **next themes** para claro e escuro.
- **Fontsource** para as fontes, servidas do próprio domínio (sem Google Fonts,
  sem requisição a terceiro, melhor privacidade e melhor tempo de carregamento).

## Estrutura de pastas

```
src/
  app/
    [locale]/
      layout.tsx          root layout: define lang, providers e moldura
      page.tsx            home, decide entre visão criativa e Modo Boring
      work/[slug]/page.tsx  case em rota própria, uma por idioma
    globals.css           tokens, temas, Modo Boring e regras de impressão
  components/
    boring/BoringView.tsx    single page utilitária, também é o currículo
    controls/ControlBar.tsx  Modo Boring, tema e idioma
    layout/SiteFrame.tsx     cabeçalho fixo, rodapé, atalho de acessibilidade
    providers/Providers.tsx  ordem dos contextos
    sections/                Hero, CasesGrid, About, Playground, Contact
    ui/Marquee.tsx           letreiro contínuo
    views/HomeView.tsx       o interruptor entre as duas experiências
  contexts/
    BoringModeContext.tsx    estado global, persiste em localStorage
  data/
    cases.ts                 cases com métricas e textos nos três idiomas
    profile.ts               dados de contato, habilidades, experiência
    experiments.ts           bloco Extras
    types.ts                 contratos de conteúdo
  fonts/
    whyte-inktrap/            fonte licenciada, peso Black, destaques do site
    array/                    fonte Fontshare, só no selo que persegue o cursor
  i18n/
    config.ts                idiomas suportados
    dictionaries/            pt (fonte da verdade), en, es
  lib/
    use-hydrated.ts           diz se o React já hidratou
    use-media-query.ts        matchMedia hidratação segura, mesmo padrão
public/
  index.html                 porta de entrada, detecta o idioma do navegador
docs/
  architecture.md            este arquivo
  tom-de-voz.md              regras de copy, inclusive a proibição de travessão
```

## Como o Modo Boring funciona

`BoringModeContext` guarda o estado, persiste em `localStorage` e escreve
`data-boring="true"` no elemento `html`. A partir daí, três camadas reagem:

1. **CSS**: os tokens viram preto e branco absoluto, texturas somem e toda
   animação é anulada, inclusive as que viessem de CSS de terceiros.
2. **Framer Motion**: `MotionConfig` recebe `reducedMotion="always"`, então nenhum
   componente anima mesmo que peça.
3. **React**: `HomeView` troca a home inteira pela `BoringView`, uma single page em
   tabela.

Fora do Modo Boring, `MotionConfig` fica em `reducedMotion="user"`, ou seja, quem
configurou menos movimento no sistema já recebe o site calmo sem precisar apertar
nada. O interruptor continua sendo escolha explícita de quem visita.

## Impressão

O Modo Boring é o currículo. `@media print` força preto no branco, esconde tudo
que é interface (`.no-print`), e imprime a URL entre parênteses depois de cada link
externo, para o papel não perder informação. Basta Ctrl/Cmd + P.

## Internacionalização

Três idiomas desde o primeiro dia: `pt` (fonte da verdade), `en` e `es`. O espaço
para chinês já existe, basta acrescentar em `src/i18n/config.ts` e criar o
dicionário: o TypeScript aponta sozinho tudo que faltar traduzir, porque `Dictionary`
é derivado do dicionário português.

Como não existe servidor, a detecção de idioma acontece em `public/index.html`, que
lê a preferência do navegador e redireciona para o idioma certo, com links visíveis
para quem estiver sem JavaScript. Cada idioma gera HTML próprio com o atributo
`lang` correto, e por isso o root layout mora dentro de `[locale]`.

Trocar de idioma no meio da leitura não deve devolver o visitante ao topo:
é reler o MESMO lugar, não ir pra outro. `LocaleSwitcher` navega pra uma
rota de verdade (outro prefixo de locale), e o `<Link>` do Next reseta a
rolagem por padrão a cada navegação; `scroll={false}` nesse Link desliga
esse reset, preservando a posição.

## Tipografia

| Papel                    | Fonte              | Onde aparece                                  |
| ------------------------ | ------------------ | ---------------------------------------------- |
| Corpo de texto           | Archivo (wdth)     | parágrafos, listas, texto corrido              |
| Manchete                 | Bricolage Grotesque | título e métrica dos cases                    |
| Destaque com ink traps   | Whyte Inktrap (licenciada) | assinatura do cabeçalho, nome na hero, rótulos do menu overlay, convite do contato |
| Mono de extrato          | IBM Plex Mono      | legendas técnicas, tags, controles             |
| Subtítulo da hero        | Switzer (Fontshare) | só o "Designer de [roleta]" abaixo do nome, combina com a Whyte Inktrap |

`--font-headline` é a variável que carrega a Bricolage Grotesque, referenciada
direto dentro de `.type-display` e `.type-serif-display` (os nomes das classes
ficaram do desenho anterior, quando eram Archivo condensada e Fraunces
respectivamente; hoje as duas apontam para a mesma fonte de manchete, cada
uma com peso e entrelinha próprios). `--font-sans`, usada pelo `body` e por
`--font-headline` como fallback, continua em Archivo: só o corpo de texto e
nada de manchete usa essa variável diretamente.

Bricolage Grotesque não tem eixo de largura nem itálico de verdade, mas o
subtítulo da hero não usa Bricolage: usa Switzer (ver `--font-switzer` em
`globals.css` e `src/fonts/switzer/`), que tem itálico desenhado de verdade,
não sintetizado pelo navegador.

## Cores

Preto e branco, e nada mais: a única cor do site vem das imagens e dos vídeos
dos projetos. A hierarquia se sustenta em tamanho, peso e no cinza intermediário
(`--muted`), não em cor.

O token `--accent` continua existindo, apontado para a tinta (`--foreground`),
para haver um lugar só caso um dia faça sentido reintroduzir cor. Por isso
nenhum componente carrega cor no código: quem precisa de ênfase usa `--muted`,
sublinhado ou opacidade.

## Respiro

A margem lateral e o ritmo vertical vivem em duas classes, `.gutter` e
`.section-y`, em vez de padding solto repetido em cada arquivo. Cabeçalho,
hero, cartas de case, seções, rodapé e páginas de case usam as mesmas, então
mudar o respiro do site inteiro é mexer em um lugar. O gutter cresce em três
degraus (1.5rem, 3rem, 5rem) e o ritmo vertical em outros três (7rem, 9rem,
11rem).

`.section-y-tight` é o mesmo ritmo, ancorado 1rem abaixo (6rem, 8rem, 10rem):
usada em Sobre e Extras, onde o respiro cheio (pensado pra dobras com
pilha/mídia, como CasesGrid e Contato) sobrava contra um conteúdo mais
compacto (texto corrido, orbit de skills, grade de mini-projetos).

**`.section-y`/`.section-y-tight` não são escritas dentro de `@layer` do
Tailwind, e por isso batem QUALQUER utilitário do Tailwind em empate de
especificidade, mesmo um escrito depois no className.** CSS Cascade Layers:
uma regra fora de camada nomeada tem prioridade sobre qualquer regra DENTRO
de uma camada, não importa a ordem de saída no arquivo final. Como o
Tailwind v4 gera suas próprias classes dentro de `@layer utilities`, um
`sm:py-0` de Contato tentando zerar o padding de `.section-y` (ambos mesma
especificidade de seletor) simplesmente perdia sempre, e o padding continuava
cheio, mesmo depois de sm:. Achado ao medir o computed style real do Contato,
não pela leitura do código (o className parecia correto). A correção não foi
lutar contra a camada, foi sair dela: a coluna de texto de Contato hoje usa
`pt-28`/`sm:pt-0`/`pb-16`/`sm:pb-0` (utilitários puros do Tailwind, mesma
camada entre si, sem `.section-y` no meio disputando prioridade) em vez de
`section-y`. `pb-16`, não os mesmos 7rem do topo: no mobile é o respiro entre
os botões de rede social e a imagem interativa logo abaixo (empilhados), e o
valor cheio de `.section-y` lia como um vão grande demais pra esse gesto.

O Modo Boring não usa nenhuma das duas: currículo é documento, tem densidade
própria e margem de leitura, não de vitrine.

**No mobile, a home fecha na foto do Contato, não no rodapé.** A grade
interativa do Contato (`InteractiveGridImage`, a foto que se distorce ao
toque) já é um fechamento de página por si só; o rodapé de texto
("feito à mão" + ano, ver `SiteFrame`) e a linha de disponibilidade dentro
do próprio Contato (repetida da hero) somem só nessa combinação (`isHome` e
abaixo do `sm:`), porque numa tela curta as duas viravam só mais linha
depois do último gesto da seção. Nas páginas de case, sem uma imagem de
fechamento própria, o rodapé continua a referência de fim de página de
sempre, em qualquer largura.

## Acessibilidade

Atalho para o conteúdo, foco visível, `aria-pressed` nos interruptores,
`prefers-reduced-motion` respeitado, contraste alto nos dois temas e o letreiro
contínuo lido como texto por leitores de tela, não como animação.

## Mídia e movimento

A home é dirigida pela mídia, não pelo texto:

A direção é minimalista: nenhuma moldura, nenhum relevo, nenhuma sombra
decorativa. O que dá vida é movimento e tipografia, não ornamento.

- **Hero com lente** (`Hero`): o nome em display gigante, uma palavra por linha,
  com um pouco de tracking (`0.015em`) pra não parecer colado numa fonte tão
  grande. A lente que segue o mouse é uma inversão: dentro dela tinta e papel
  trocam de lugar, sem nenhuma cor entrar na conta. A revelação usa máscara
  radial de borda suave, não recorte duro, então o círculo é difuso nas
  beiradas. Perto do CTA "Veja meu trabalho" o raio encolhe. Em telas de
  toque a lente fica com raio zero e nada roda.

  **A máscara sozinha não fecha a lente.** Com raio zero (nenhum cursor na
  hero: antes do primeiro movimento, depois que ele sai, e a vida inteira em
  tela de toque) o gradiente radial fica degenerado, e o Chromium, em vez de
  tratar isso como área vazia, ignora a máscara e revela a cópia inteira. O
  sintoma era a hero nascer com DOIS nomes: o de verdade subindo pela
  animação de entrada e o da cópia, que entra pronta por definição, parado no
  lugar final atrás dele. Por isso a opacidade da cópia também sai do raio
  (`lensOpacity`): fecha por fora, sem depender de como cada navegador
  resolve um gradiente de raio zero, e acompanha a mesma mola, então a lente
  abre e fecha junto com o círculo em vez de piscar.

  A hero desconta a altura da
  barra (`100svh` menos `3.5rem`) porque o cabeçalho é sticky e ocupa espaço
  no fluxo. `.texture-noise-animate` sobre a hero inteira dá o grão de
  filme flutuando, sem vinheta nem nenhum outro efeito por cima.

  **No mobile, nome, subtítulo, retrato e o bloco de CTA são QUATRO itens
  diretos do mesmo flex, todos equidistantes entre si, e o próprio
  `justify-between` calcula o respiro.** Uma primeira versão tentava
  calcular esse valor à mão (uma margem fixa pro nome/subtítulo, um gap
  igual pro contêiner, e um `mt-auto` no bloco de CTA pra empurrá-lo pro
  fim): funcionava, mas o `mt-auto` absorvia SOZINHO todo o espaço que
  sobrava depois de descontar os valores fixos, então o vão entre o
  retrato e o CTA saía muito maior que os outros dois, exatamente o
  oposto de "equidistante". A versão atual larga a conta na mão do
  próprio flex: o wrapper que agrupava nome+subtítulo vira `display:
  contents` nessa faixa (some da árvore de LAYOUT, mas continua na árvore
  de DOM, então herda `text-align` normalmente pros filhos), e os dois
  passam a ser itens do flex por conta própria, junto do retrato (que já
  virava item do flex no mobile, via `order`, ver acima) e do bloco de
  CTA. Com os quatro na mesma `justify-between`, o espaço sobrando reparte
  em partes IGUAIS entre os três vãos, sempre, em qualquer altura de tela,
  sem precisar calibrar valor nenhum à mão. `pt-16`/`pb-16` continuam
  fixos, fora dessa conta: só a segurança mínima pra não deixar o nome
  nascer atrás do cabeçalho fixo (a barra tem `3.5rem`) e uma borda solta
  simétrica embaixo. No desktop (`sm:`) o wrapper volta a ser um bloco só
  (não mais `contents`) e o retrato volta a ser absoluto (sai do fluxo do
  flex): lá o respiro nome/subtítulo volta a ser a margem fixa de sempre
  (`sm:mt-9`), porque sobra espaço ao lado da manchete e não precisa
  disputar altura com mais nada. Testado até 320×568 (a menor tela comum):
  os vãos encolhem juntos conforme a altura aperta, sem nunca sobrepor
  nada nem estourar a tela, porque é o próprio motor de flexbox recalculando
  a cada resize, não um valor fixo medido contra um único aparelho.

  `text-center`/`sm:text-left` mora no PRÓPRIO `<h1>` e no PRÓPRIO
  subtítulo agora, não só no wrapper. Já foi só no wrapper, contando com a
  herança de `text-align` atravessando o `contents` (que funciona: herança
  de CSS não olha pra árvore de layout) — mas o `<h1>` acabou ganhando um
  `text-center` PRÓPRIO sem o `sm:text-left` de volta, e como a regra do
  próprio elemento sempre vence a herdada, o nome ficou centralizado em
  QUALQUER largura, inclusive desktop, sobrepondo o retrato na faixa de
  notebook. Cada filho com a própria regra completa (as duas faixas) é mais
  chato de repetir, mas não depende de um ancestral lembrar de continuar
  por perto.

  A opacidade do grão sai por `--noise-opacity`, e na hero ela é o dobro do
  resto do site (0.10 contra 0.05). Nos cases o ruído pousa em cima de imagem,
  que já tem textura própria, e ali ele é só um véu. Na hero pousa em papel
  liso, e a 0.05 simplesmente não existia: o grão de filme é o efeito, não um
  acabamento. 0.10 é o ponto em que ele aparece sem começar a acinzentar o
  branco.

  **O fundo é papel liso, e o grão é a única textura.** Já teve gravura em
  linha, a mesma trama ondulada do retrato ampliada, e foi revertida: parada
  numa imagem ela sustentava o nome, mas na hero, com a lente passando por
  cima e o grão de filme rodando, virava mais uma coisa competindo pelo mesmo
  retângulo. É a terceira tentativa de fundo a cair pelo mesmo motivo (antes
  dela, a textura de papel e a grade de colunas em fio de um pixel, esta
  última descrita na lente do nome, logo abaixo), e as três ensinaram a mesma
  coisa: a hero não tem espaço para um segundo assunto.

  A gravura sobreviveu onde faz sentido, nas imagens sociais
  (`src/lib/engraving.ts`, ver SEO), que são paradas por definição e não
  disputam com movimento nenhum.

  **O nome incha sob uma lente que segue o cursor** (`HeroTitleGL`, o único
  uso de WebGL do site). Onde o ponteiro passa, "ARMANDO CUSTODIO" engorda,
  como se o peso da fonte subisse por um instante, sem mudar de lugar.

  A deformação já morou no fundo, numa grade de colunas do próprio layout
  desenhada em fio de um pixel. O efeito era bom e o suporte era o errado:
  fio a 14% de opacidade não tem massa suficiente pra uma lente valer a
  pena, e a grade acabou lida como papel quadriculado, ou seja, textura, o
  mesmo caminho que a textura de papel já tinha tomado antes de ser
  revertida. Aqui a lente tem o que deformar: a manchete é o maior objeto da
  página e a coisa mais preta dela.

  A amplitude e o alcance saem do MESMO raio que rege a lente de inversão,
  então tudo vem de graça: em tela de toque o raio nunca sai de zero (nenhum
  `mousemove` dispara) e perto do CTA, onde o raio encolhe pra ceder o palco
  ao clique, a deformação encolhe junto. A amplitude é contida de propósito,
  bem menor do que era na grade: aqui o alvo é a única coisa que a página
  precisa que se leia, e a régua foi que a letra sob o cursor entorte o
  suficiente pra ficar claro que tem um vidro ali, e continue sendo aquela
  letra.

  O perfil do empurrão zera exatamente no cursor e tem o pico no meio do
  caminho até a borda (distância vezes gaussiana), que é como uma lente
  convexa de verdade se comporta. Uma gaussiana pura, máxima no centro,
  deslocava todos os pixels em volta do ponteiro pela mesma distância em
  direções opostas: muitos liam o mesmo ponto e o desenho colapsava numa
  estrela no meio, artefato de amostragem, não de ótica.

  O texto não é redesenhado a cada quadro: vai uma vez pra uma textura
  (canvas 2D) e o shader só reamostra deslocando coordenadas. Fonte,
  tamanho, peso, tracking, alinhamento, `text-transform` e posição de cada
  linha são LIDOS do `<h1>` de verdade, nunca repetidos no componente, então
  a cópia não sai do lugar quando o CSS do título mudar. A medida sai do
  `<span>` externo, o que não anima: o interno é o que o Framer move na
  entrada, e o retângulo dele durante a animação é posição de passagem, não
  final. Repintar só acontece em resize, troca de tema ou quando a fonte
  termina de carregar (a Whyte Inktrap é local, e desenhar antes de
  `document.fonts.ready` gravaria a fonte de fallback na textura).

  O `<h1>` continua no DOM sempre: é ele que o leitor de tela lê, que o
  buscador indexa, que anima na entrada e de onde saem as medidas. Fica
  transparente, e não escondido, e só depois que o canvas confirma que
  desenhou. O canvas, por sua vez, nasce transparente e aparece no MESMO
  instante, nessa ordem: os dois desenhos são idênticos e sobrepô-los por um
  quadro não se vê, enquanto o inverso abriria um quadro de hero sem nome.
  Antes o canvas nascia visível e só a transparência do `<h1>` esperava, e
  com a fonte pronta cedo o texto do canvas aparecia parado no lugar final
  enquanto o `<h1>` ainda subia: mais uma versão do mesmo defeito de dois
  nomes. Nada disso é montado quando não há cursor de verdade
  (`hover: hover` e `pointer: fine`), quando o sistema pede menos movimento,
  ou quando o WebGL não sobe: nesses casos o título é só o `<h1>`, com o
  texto selecionável de sempre.

  O contexto WebGL **não** é encerrado com `WEBGL_lose_context` na limpeza.
  Perder o contexto é permanente para aquele `<canvas>`, e este é gerenciado
  pelo React: numa remontagem (o StrictMode do dev faz isso sempre, e o
  componente também monta tarde, quando a checagem de ponteiro resolve) o
  mesmo elemento volta, `getContext` devolve o contexto já morto e a partir
  dali nenhum shader compila, silenciosamente. Soltar as alocações basta.

- **Projetos em destaque presos ao scroll** (`CasesGrid`): depois de passar
  por um baralho preso ao scroll e depois por uma grade bento, a seção
  voltou a prender o scroll, mas com a lição da grade incorporada. Sai
  direto da hero, sem título nem subtítulo próprios (só um `aria-label` no
  `<section>` pra quem usa leitor de tela, reaproveitando o texto que antes
  era visível): a primeira fatia já entra prendendo o scroll, sem dobra de
  transição no meio. A seção é alta (uma tela inteira por fatia) e fica
  `sticky` enquanto o visitante rola; cada fatia entra deslizando de baixo
  pra cima (`translateY` de 100% a 0%, não `clip-path`) até assentar no
  lugar, empilhando por cima da fatia anterior como um baralho recebendo
  carta: a fatia que fica por baixo encolhe um pouco e escurece
  (`scale` e uma camada preta com `opacity` crescendo) enquanto a próxima
  sobe sobre ela, dando profundidade física à pilha (`zIndex` cresce com o
  índice, então a ordem de empilhamento sempre acompanha a ordem de
  rolagem). Uma vez assentada, a fatia não se move mais: o valor que rege a
  subida (`enterT`, ver `enterRange` em `CasesGrid.tsx`) trava em 1 depois
  de completo, mesmo quando a próxima fatia começa a cobri-la, então ela só
  recebe a próxima por cima em vez de deslizar de volta pra baixo. Duas
  transições anteriores foram tentadas e descartadas aqui: uma cortina de
  barras (abria e fechava, lida como mecânica demais) e uma íris circular
  (`clip-path: circle()`, lida como fraca demais); o empilhamento com
  profundidade é a terceira tentativa, inspirada no vocabulário de scroll
  storytelling de sites premiados (cartões que se empilham com profundidade
  em vez de um recorte abrindo e fechando no mesmo lugar). A fatia coberta
  também sobe um tanto (`coveredY`, 4%) enquanto encolhe e escurece: sem
  esse deslocamento ela fica parada como um fundo e a profundidade some;
  com ele a leitura é de página sendo virada, não de carta caindo em cima
  de outra. Rolar é a
  navegação inteira: sem seta, sem play/pause, sem índice próprio brigando
  com o scroll de verdade. Primeira e última fatia não têm a metade da
  transição que não existe (a primeira já nasce aberta, sem fase de
  entrada; a última nunca é coberta, fica aberta até o fim da seção).

  **A rolagem é amortecida, a página não.** O progresso bruto do scroll
  passa por uma mola (`useSpring` em `CasesGrid`) e é o valor amortecido que
  rege toda transformação da seção. É o mesmo lerp que as bibliotecas de
  scroll suave da vez (Lenis e companhia, hoje padrão de fato em site
  premiado) aplicam, com uma diferença que decidiu a escolha aqui: elas
  sequestram a rolagem da página inteira, trocando o scroll nativo por um
  contêiner que anda sozinho, e junto vão o comportamento da barra, do
  teclado, do toque e do "encontrar na página". Aqui a página continua
  rolando nativamente e a mola vive só do lado da animação, então o
  amortecimento é da cena, não da rolagem: ninguém perde o controle direto
  do scroll e mesmo assim a pilha desliza com inércia em vez de saltar a
  cada tique da roda. Zero dependência nova, também.

  Os números da mola foram medidos, não chutados: superamortecida (nunca
  passa do ponto e volta, o que no scroll embrulha o estômago) com constante
  de tempo de ~0,12s, a faixa em que a inércia lê como fluidez e não como
  atraso. Uma primeira tentativa, mais pesada, levava mais de um segundo
  para assentar depois de um salto de uma tela: aí a cena parece engasgada.
  `restDelta` entra explícito (0,0001) porque o valor amortecido é um
  progresso de 0 a 1 esticado por várias telas, e o padrão do Framer (0,01)
  seria 1% da seção inteira, folga bastante para a mola parar com a fatia
  ainda visivelmente fora do lugar.

  O que rege a **lógica** (qual fatia está ativa, portanto clicável e
  focável) continua sendo o progresso bruto: a mola atrasa uns décimos, e um
  índice ativo atrasado tornaria clique e foco de teclado imprecisos justo
  enquanto a cena ainda se acomoda.

  **A primeira fatia recebe menos scroll que as outras** (`slideWindows`,
  `FIRST_SLIDE_WEIGHT`). Ela é a única sem fase de entrada, já nasce no
  lugar, porque não existe nada antes dela pra subir de. Com todas as fatias
  valendo a mesma altura, essa diferença virava uma tela inteira de rolagem
  sem nada acontecendo antes da primeira transição, contra pouco mais de
  meia tela de pausa em cada fatia seguinte: a seção parecia travada logo na
  entrada e a mão de quem rolava aprendia um ritmo que a seção não cumpria
  depois. Dando à primeira só o peso da pausa (o que sobra depois da subida
  que ela não tem), a espera entre uma transição e a próxima fica igual do
  começo ao fim, e a seção encolhe de 4 para 3,55 telas.

  Cada fatia sobe durante os primeiros 45% da própria janela de scroll e
  depois fica. Esse resto, antes parado, hoje tem paralaxe: a mídia desliza
  devagar (±6% da altura, com escala base cobrindo o dobro do deslocamento
  para não revelar a borda preta do painel) enquanto o texto fica ancorado.
  Rolagem sem nada acontecendo lê como travada, mesmo quando é só uma pausa
  de composição, e o paralaxe ainda separa capa e texto em profundidade sem
  sombra nem moldura, que o site não tem em lugar nenhum. Quem pede menos
  movimento no sistema recebe o progresso bruto, sem mola e sem paralaxe.
  Clicar no projeto em cena expande pra tela cheia com os dados completos
  do case (mesmo FLIP manual descrito abaixo em "Menu overlay" e "Transição
  de modo": o overlay nasce encolhido sobre o retângulo clicado e anima até
  a identidade). Um leve `whileTap` (escala 0.98) no próprio cartão clicável
  responde ao toque no instante do gesto, não só quando o overlay termina
  de nascer; o mesmo cartão no mobile (`MobileCaseCard`, `MotionLink` =
  `motion.create(Link)`) ganha o mesmo feedback.

  **A página de destino (`/work/[slug]`) usa o MESMO tratamento visual do
  painel expandido, não um bloco de texto plano.** Antes disso, quem clicava
  num projeto via o FLIP animado da home terminar num fim de linha reto:
  texto estático, sem capa em tela cheia, sem movimento nenhum, o corte
  entre o clique animado e a página real de fato incomodava. `CaseDetail`
  (`src/components/sections/CaseDetail.tsx`, client component: framer-motion
  e `Reveal` exigem isso, `page.tsx` continua Server Component e só delega
  o corpo pra cá) reaproveita a MESMA estrutura de `ExpandedCase` — capa em
  `h-svh` com zoom lento e contínuo, gradiente, título grande por cima —
  como o topo de verdade da página, e o resto do corpo (declaração,
  métricas, tags, grade de apoio) entra com `Reveal` conforme a rolagem
  chega lá, a mesma linguagem de entrada do resto do site. `<h1>` migrou do
  texto da declaração (que ficava pesado pra esse papel) pro TÍTULO do
  case, alinhado ao que já ia no `<title>` da aba (`generateMetadata`).

  **Fatia nem sempre é um case só.** Cases adjacentes que compartilham
  `group` no dado (o trio Ganwalk/Dezert Horse/Pink Opala, hoje) sempre
  viram uma única fatia dentro da mesma pilha, em vez de três subidas
  separadas: `buildSlides` agrupa cases adjacentes de mesmo `group` numa só
  passada, direto do dado, sem depender do tamanho da tela nem de
  `matchMedia`. `SlidePanel` distribui as colunas (`CaseColumn`) empilhadas
  na vertical por padrão e lado a lado num `flex` a partir do breakpoint
  `lg:` (CSS puro: sem hook de media query, sem risco de descompasso entre
  o HTML do servidor e o do cliente). O mobile ganha o mesmo benefício do
  desktop, uma fatia por trio em vez de três, então o scroll da seção fica
  mais curto lá também. O rótulo de índice de cada coluna ("03 / 06") sempre
  conta cases da lista inteira, não fatias, então a numeração não muda com o
  agrupamento. Título e métrica encolhem (`multi`) quando a coluna é uma de
  três, pra não vazar de um terço da largura (ou da fatia vertical de altura
  empilhada, no mobile).

  Uma camada de vocabulário de agência vive em cima da pilha, atrás do
  `MotionConfig` do Modo Boring: texto em máscara escalonada. Índice,
  métrica, título, tags e o convite de "ver caso" moram cada um no seu
  próprio `overflow-hidden` e sobem do zero num instante diferente dentro
  da própria subida da fatia, em vez do bloco inteiro nascer junto num só
  fade; regidos por `enterT` (não por uma curva com fase de saída), o texto
  continua visível mesmo depois de coberto pela próxima fatia, é a fatia
  INTEIRA que encolhe e escurece nesse momento, não o texto que desaparece
  sozinho antes disso. O título tem a janela mais longa e entra por
  último, o elemento que merece mais peso na composição. O `pt-[0.16em]`
  mora no próprio `<motion.h3>` do título, não no wrapper que faz o
  `overflow-hidden`: `em` resolve contra o tamanho de fonte do próprio
  elemento, não herda do filho, então a folga só funciona no elemento que
  de fato tem a fonte grande (mesmo motivo do H1 da hero, ver acima). A
  mídia fica colorida o tempo todo, sem passar por preto e branco na
  transição: a única cor do site já vem dela.

  O fundo de cada card é a mídia e nada mais: nenhum shader, nenhum canvas.
  Uma ondulação em WebGL que seguia o cursor (com aberração cromática) e
  fundia uma capa na outra conforme a fatia subia morou aqui e saiu. O
  único WebGL do site hoje é a lente que deforma o nome na hero, onde o
  efeito É o desenho, e não uma camada por cima de um vídeo que já tem
  movimento próprio: em
  cima da capa, o shader disputava atenção com a própria mídia e com a
  máscara de texto, três movimentos ao mesmo tempo no mesmo retângulo.

  O que restou de movimento na mídia são dois, os dois discretos: um zoom
  sutil no hover (`scale`, via `animate`, não no scroll, pra não parecer
  que o zoom "pula" cada vez que um projeto novo entra em cena) e o
  paralaxe de scroll descrito abaixo.

  Um selo "ver caso" acompanha o cursor (mola só, sem rastro de partículas,
  deslocado bem à direita e um pouco abaixo da ponta: cursores grandes
  cobrem a área logo ao lado dela), quadrado como o resto dos controles do
  site (sem `rounded-full`). Um selo só pra seção inteira, rastreado em
  `CasesGrid`, não um por coluna: todo painel é `absolute inset-0` (mesmo
  retângulo da tela pros quatro), então a posição do cursor relativa à
  seção não muda quando o scroll troca qual fatia está por cima, só o alvo
  do hover muda. Um selo por coluna, cada um com seu próprio estado de
  posição, ficava pra trás quando a rolagem trocava a fatia ativa sem o
  mouse se mexer (o card que passava a ficar ativo nunca tinha recebido um
  mousemove de verdade, sua posição salva continuava a inicial, o selo
  pulava pro canto errado até o próximo movimento real do mouse);
  centralizando, a posição bruta do ponteiro só atualiza com um mousemove
  de verdade (sempre correta, porque rolar sem mexer o mouse não muda onde
  ele está na tela) e o alvo do hover é recalculado a cada mousemove e
  também sempre que a fatia ativa muda, usando a última posição bruta
  conhecida (`document.elementFromPoint`, que já respeita `pointer-events:
  none` nas colunas inativas). O texto dentro do selo roda num letreiro
  horizontal contínuo, como uma placa luminosa antiga: a pílula é uma
  janela de largura fixa e menor que o conteúdo (`overflow-hidden`), na
  mesma fonte mono dos outros rótulos técnicos do site (`.type-mono`, a
  mesma de "UX/UI · Webapps · Design Systems" na hero), com duas cópias
  idênticas do texto lado a lado, separadas por um bullet com padding igual
  dos dois lados (não espaço literal, refém da fonte: " • ver caso • ver
  caso"), andando de 0% a -50% pra sempre. Como as duas cópias são
  idênticas, o instante em que a primeira sai pela esquerda é exatamente o
  instante em que a segunda chega no início, sem costura no loop.
  Complementar ao selo estático dentro do texto (que continua ali por
  acessibilidade e por quem usa toque).

  `onMouseMove`, não `onPointerMove`, no selo e no zoom de hover: em tela
  de toque o evento não dispara, então nada disso ativa lá, mesmo
  princípio que já mantém a lente da hero parada no mobile. A contagem de
  posição já mora em cada card (`03 / 06`, o índice do case na lista
  inteira, não da fatia), então não existe uma segunda contagem em nível
  de fatia competindo com ela: o rodapé da seção tem só um lembrete de que
  rolar é a navegação ("role para navegar") e os pontos de posição
  (`gap-2`), que animam a troca em vez de só saltar de um pro outro.

  **No mobile (abaixo do sm:) a seção não prende o scroll, mas cada
  projeto ainda ocupa a tela inteira, com uma passagem dinâmica entre um e
  outro.** Já foi pilha presa ao scroll (empilhava mal em tela pequena: o
  cabeçalho fixo cobria o topo do painel ativo em certas posições, e o
  trio de artistas competia com a pilha), depois carrossel horizontal por
  gesto (o arrastar lateral lia fraco, e ainda brigava com o eixo em que o
  resto da página rola), depois rolagem vertical comum com uma leve escala
  por JS marcando o cartão mais próximo do centro (a escala encolhia a
  CAIXA visível dentro da própria célula do layout sem encolher a célula
  em si, revelando o fundo da página nas quatro bordas: um "espaço em
  branco ao redor" que não devia existir).

  A versão atual (`MobileCaseList`/`MobileCaseCard`, em `CasesGrid.tsx`)
  troca a escala por `position: sticky`, sem JS nenhum regendo a
  transição: cada cartão é `sticky top-0 h-svh` (tela cheia de verdade),
  empilhado na ordem normal do documento, sem gap. Como cada cartão sticky
  gruda no topo assim que alcança lá, e o próximo já tem a MESMA altura de
  viewport (sem sobra pra "esperar" antes de aparecer), o efeito colateral
  do próprio `position: sticky` é a passagem dinâmica: o cartão de baixo
  desliza por cima do cartão travado acima dele conforme o dedo rola, sem
  segunda camada JS decidindo escala ou z-index (a ordem de pintura já
  segue a ordem do DOM: quem vem depois cobre quem veio antes) e sem
  nenhuma borda revelando o fundo da página, porque a caixa do cartão
  nunca encolhe. O mesmo princípio que já rege a pilha de desktop (a fatia
  de cima cobre a de baixo), só que aqui é o próprio scroll nativo da
  página quem desenha a cobertura.

  A mídia de cada cartão ainda ganha um paralaxe PRÓPRIO conforme entra e
  sai da tela (`useScroll` medindo contra a janela, sem `container`), mas
  só nela, dentro do `overflow-hidden` do cartão, nunca no cartão inteiro:
  um deslocamento interno não abre nenhuma borda. A mídia de cada cartão só
  monta perto da viewport (`useNearViewport`): com vídeo mudo em loop em
  cada capa, montar os seis de uma vez tocaria todos ao mesmo tempo fora de
  tela.

  Sem gap nem borda entre os cartões, e sem `border-t` no início da seção:
  um gap ali quebraria o próprio efeito de `sticky` (uma tira do fundo da
  página apareceria entre um cartão e o outro a cada troca), e o primeiro
  cartão entra colado direto ao fim da hero, do mesmo jeito que a pilha de
  desktop também não tem margem nem moldura entre fatias.

  O topo do cartão começa com `pt-16`, não a mesma padding de baixo
  (`pb-10`): o cabeçalho é `fixed` e flutua por cima de TODA a pilha
  (`z-40`, mais alto que qualquer cartão sticky aqui embaixo), então sem
  esse respiro extra a informação do cartão travado no topo nascia
  parcialmente atrás da barra, mesmo antes do próximo cartão chegar pra
  cobri-la de verdade. `pt-16` desconta a altura da barra (3.5rem) e sobra
  um pouco de respiro, o mesmo raciocínio do `pt-24` da hero (ver acima).
  Assim a única coisa que chega a cobrir a informação de um cartão é o
  PRÓXIMO cartão chegando por cima, nunca o cabeçalho.

  **Título e métrica ficam fixos, na mesma disposição do desktop (métrica
  em cima, título embaixo), cada um entrando com o `Reveal` padrão do
  site.** Duas variantes com o texto se deslocando durante a rolagem
  chegaram a existir aqui e as duas saíram: uma trocava os dois de lugar em
  definitivo (título em cima, métrica embaixo, permanente), desalinhando o
  mobile do desktop sem necessidade; a outra mantinha a disposição final
  mas fazia o título nascer no canto da métrica e descer pro seu lugar
  perto do fim da entrada (`titleY`/`metricOpacity` via `useTransform`,
  preso ao `progress` do próprio cartão). As duas, na prática, liam pior
  que simplesmente deixar a informação parada: o movimento chamava atenção
  pra si em vez de servir o conteúdo. `Reveal` sozinho já resolve o
  problema original (o cartão sticky revela de CIMA pra BAIXO, então
  informação presa ao PÉ do cartão nasce tarde) com um delay pequeno
  (`delay={0.08}` no título) em vez de reordenar ou animar posição.
- **"Acreditam no meu trabalho" (`Brands`) mora dentro de `About`, não é
  mais dobra própria.** Já foi uma régua fina entre CasesGrid e About, com
  `<section>` e `aria-label` próprios; hoje é conteúdo comum de About,
  logo abaixo da bio e das habilidades (o marquee de logos, ver
  `ui/Marquee.tsx`, virou o último bloco do `<div>` de duas colunas). O
  rótulo trocou de um `<p>` solto pra um `<h3>`, a mesma marcação que já
  organiza "Habilidades" e "Idiomas" ao lado: os três ficam no mesmo nível
  da árvore de cabeçalhos, dentro do `<h2>` "Sobre" que os une, em vez de
  um rótulo textual desconectado da hierarquia. `border-t` fecha só esse
  bloco (não a seção inteira), o mesmo traço fino que antes separava as
  duas dobras.
- **Lua de fases** (`MoonPhase`): no canto direito do cabeçalho, percorre as
  fases da lua conforme o scroll, três lunações por página. Também é o
  seletor de tema: um clique alterna claro/escuro (não existe mais um botão
  ☀/☾ à parte, ver `ControlBar`), sem relação nenhuma com o ciclo de fases,
  que continua regido só pelo scroll.

  Virar um `<button>` (pra ser clicável) trouxe um efeito colateral: ao
  contrário de `<svg>`, que o preflight do Tailwind já reseta pra
  `display: block`, `<button>` continua com o `display: inline-block` padrão
  do navegador. Precisou de DOIS níveis de `flex items-center` pra
  resolver, não um só: o primeiro, nos três wrappers do crossfade mobile do
  cabeçalho (`SiteFrame.tsx`, os `<div>` que trocam Modo Boring/menu,
  lua/assinatura e idioma/lua), tira a CAIXA desses wrappers da conta, mas
  o filho direto de cada um é o `motion.div` do próprio `AnimatePresence`
  (com `layoutId`, na cópia da lua), que também é um `<div>` comum
  envolvendo o botão inline — a mesma "tira" de line-height reaparecia um
  nível mais fundo, e a lua continuava ancorada alguns pixels mais baixo
  que o resto da barra. O segundo `flex items-center` foi direto NESSE
  `motion.div` (via `className`, nas duas cópias com `layoutId=
  "mobile-header-moon"`), o nível que de fato encosta no botão.
- **Menu overlay** (`SiteMenu`): navegação de tela cheia com tipografia gigante
  (Whyte Inktrap, via `.type-inktrap` somada ao `.type-display` que já dava
  tamanho e caixa alta) e preview de imagem no hover de cada link. Renderiza
  num portal para o body, porque o `backdrop-blur` do cabeçalho criaria um
  containing block e prenderia o overlay dentro da barra. No mobile a mesa de
  controle inteira mora aqui, Modo Boring incluído.
- **Cabeçalho**: uma só ordem de DOM (menu, assinatura, lua) em dois arranjos.
  No mobile é grid de três colunas, com a assinatura centralizada; no desktop
  vira flex e a assinatura vai para a frente da fila (`lg:order-first`), com a
  lua empurrada para a direita. Os controles são só texto, sem moldura nem
  fundo, com uma exceção: o Modo Boring tem caixa própria (contorno mesmo em
  repouso), porque é a porta de saída do site inteiro para quem não quer ver
  nem uma animação, merece se destacar dos demais.

  Na home em Modo Criativo, o cabeçalho começa escondido (`SiteFrame`, variável
  `headerVisible`): a hero ocupa a primeira dobra sozinha, sem chrome por cima,
  e a barra desliza para dentro assim que o scroll passa de 90% da altura da
  tela. Em qualquer outra página, ou já em Modo Boring, o cabeçalho é sempre
  visível desde o primeiro pixel (`isHomeHero`, calculado via `usePathname`):
  Boring não tem hero para esconder atrás, e o botão de volta ao Criativo
  precisa estar sempre à mão, sem depender de a pessoa rolar a página até
  achá-lo.

  No mobile o Modo Boring tem uma segunda linha só dele, abaixo da primeira, e
  as duas se revezam no mesmo ponto de scroll (`boringRowVisible`, em
  `SiteFrame`): enquanto a hero está na tela aparece só o botão do Modo
  Boring, a oferta de saída feita de cara; passada a primeira dobra, a linha
  fecha junto com a abertura da primeira, e o botão passa a viver dentro do
  menu, com tema e idioma. Fora da home, onde não há hero, a segunda linha nem
  chega a aparecer. A exceção é o próprio Modo Boring: lá a linha fica sempre,
  porque o menu não existe e sem ela não sobraria volta para o Modo Criativo.
  No desktop a segunda linha não existe, o botão cabe na primeira.

  Assim que o cabeçalho aparece, um tooltip aponta para o botão do Modo Boring
  com a frase da pessoa que odeia animação, e some ao clicar ou quando o scroll
  passa da primeira dobra (`BoringToggle`, props `showTooltip` e
  `dismissTooltip`). Só a cópia do desktop mostra tooltip. O texto do
  tooltip não usa `.type-mono`: aquela classe força `text-transform: uppercase`,
  que apagaria o contraste entre "eu" minúsculo e "ODEIO" maiúsculo, a graça
  da frase.

  `Reveal` dá a entrada padrão das seções de apoio.

- **Transição de modo** (`ModeTransitionOverlay`): uma cortina cobre a tela e
  revela o novo modo por baixo ao alternar Criativo/Boring, em vez do corte
  seco de uma troca instantânea. Não pode depender de CSS `transition` nem do
  `MotionConfig` do Framer Motion: a regra global em `globals.css` que zera
  todo movimento quando `data-boring="true"` mata literalmente qualquer
  transition do documento inteiro no instante em que o atributo muda,
  incluindo indo *para* o Boring, porque é uma regra de CSS (alcança qualquer
  elemento do DOM, não importa onde ele mora na árvore React). Por isso a
  cortina anima escrevendo `opacity` a cada quadro via `requestAnimationFrame`,
  na mão: nenhuma regra de CSS intercepta uma mutação de estilo feita assim.
  Quem pediu menos movimento no sistema não vê a cortina, só a troca direta.

Toda mídia passa pelo componente `MediaView`, que decide entre `<video>` (mudo,
em loop, com poster e camada de fallback) e `<img>`. As URLs vivem nos dados
(`cases.ts`, `experiments.ts`), como placeholders do Pexels e Picsum escolhidos
por afinidade de tema; cada bloco tem um comentário com a sugestão de mídia
real. Trocar placeholder por mídia final é editar só o bloco `cover`/`media`.

**Critério de cor da mídia: colorida sim, saturada não.** A primeira leva de
placeholders era de gradiente neon e show de clube com luz roxa estourada, e
brigava com o site inteiro: aqui a única cor vem justamente da mídia, e se ela
chega em magenta e ciano puros é ela que passa a mandar na página, no lugar do
trabalho. A leva atual é toda de cor natural (concreto, telhado, areia, luz
âmbar de estúdio, nuvem de fim de tarde, papel), que convive com o preto e
branco em vez de gritar por cima dele. Vale para a mídia final também.

**Imagens próprias** (o retrato da hero, os cursores e a foto do Contato) não
são placeholder e não passam pelo `MediaView`: são convertidas na bancada por
um script em `scripts/`, com `sharp` instalado por fora
(`npm install --no-save sharp`, ele não entra no `package.json` porque é
ferramenta de quem edita, não dependência do site), e o resultado versionado
em `public/`.

As três compartilham o mesmo tratamento de gravura, linhas onduladas em meio
tom, e por isso o mesmo problema: trama fina é ruído de alta frequência, o
pior caso para qualquer compressor. A mesma foto do Contato sai com 76 KB
quando é lisa e passa de 400 KB com a trama, na mesma resolução e qualidade.
A saída é qualidade baixa (28 nos três casos): de 18 a 62 o resultado é
visualmente indistinguível, porque a trama já é quase binária e não sobra
gradiente sutil para o compressor estragar, mas o arquivo varia quase o dobro.


No Modo Boring nada disso existe: sem lua, sem menu, sem vídeo, só a página
utilitária.

## Rolagem

`SmoothScroll` (`src/components/providers/SmoothScroll.tsx`) usa
[Lenis](https://github.com/darkroomengineering/lenis) para amortecer a
rolagem da página inteira (`lerp: 0.11`, o mesmo raciocínio de constante de
tempo que já regia a versão anterior, escrita à mão, e que a mola de
`CasesGrid`, acima, aplica à cena). Substituiu um `requestAnimationFrame`
manual que cuidava só da roda do mouse: mesma ideia de amortecimento
exponencial, agora numa biblioteca dedicada, testada em produção, com
suporte nativo a elemento com scroll próprio e a `prefers-reduced-motion`.

Lenis roda por cima do scroll de verdade, não troca o documento por um
contêiner que anda sozinho: `window.scrollTo` (com `behavior: "instant"` por
baixo, para não brigar com o `scroll-behavior: smooth` do CSS) continua
sendo quem move `window.scrollY`. Tudo que já lia a rolagem nativa (`useScroll`
do `CasesGrid` e do `MoonPhase`, o listener de scroll do `SiteFrame`, o
`ModeTransitionOverlay`) segue funcionando sem mudança nenhuma: sticky, âncoras,
teclado, barra e o "encontrar na página" continuam do jeito que sempre foram.
O toque fica de fora do amortecimento de propósito (`syncTouch: false`, o
padrão da biblioteca): o momentum do próprio sistema em touch já é bom, e
sincronizar com ele é o ponto mais instável da biblioteca em iOS mais antigo.

**Rolagem PROGRAMÁTICA (não gerada por gesto do visitante) precisa passar
pela própria Lenis, não por um `window.scrollTo` cru.** A assinatura no
cabeçalho (`SiteFrame.tsx`), clicada já na home, precisa voltar ao topo da
página (um `<Link>` pra rota atual não navega nem reseta scroll sozinho).
Um `window.scrollTo({top:0, behavior:"smooth"})` direto ali não fazia
NADA visível: Lenis intercepta o scroll de verdade e, no próximo quadro do
seu próprio `raf`, reafirma a posição que ELA acha que é a certa,
descartando o pulo que acabou de acontecer por fora. A instância vive num
módulo (`activeLenis`, em `SmoothScroll.tsx`, atualizada nos mesmos
efeitos que já a criam/destroem) e exporta `scrollToTop()`: chama
`lenis.scrollTo(0, ...)` quando ela existe, cai pro `window.scrollTo` cru
(sem suavização) quando não (Modo Boring, `prefers-reduced-motion`, ou
antes do efeito rodar) — coerente, já que Lenis desligada ali significa
que menos movimento foi pedido.

**Elemento com scroll próprio não fica de fora, ganha a própria instância.**
O overlay de case em tela cheia de `CasesGrid` (`ExpandedCase`) trava o
scroll da página (`document.documentElement.style.overflow = "hidden"`)
enquanto está aberto, mas continua pensado como parte do MESMO scroll da
página: em vez de um `data-lenis-prevent` excluindo-o e deixando-o cair pro
scroll nativo, ele sobe sua PRÓPRIA instância de Lenis, presa nele
(`wrapper`/`content` apontando pro próprio elemento) em vez de na janela. As
duas cooperam sozinhas, sem configuração extra: Lenis já resolve isso
internamente (o wheel que a instância do overlay consome sinaliza o próprio
evento, e a instância da página, ao receber o mesmo evento borbulhado,
reconhece o sinal e não processa de novo), então o overlay rola com o mesmo
amortecimento do resto do site, não com um scroll nativo destoante.

Desliga por completo (a instância nem chega a existir) em Modo Boring e para
quem pede menos movimento no sistema, voltando ao scroll cru do navegador
nos dois casos, em ambas as instâncias (página e overlay).

A leitura de "quanto falta" na rolagem é só a lua do cabeçalho
(`MoonPhase`), que já atravessa as fases conforme o scroll: uma régua de
progresso à parte, presa ao topo da viewport, existiu e foi removida por
redundância com ela.

## SEO

`src/lib/site.ts` exporta `siteUrl`, a URL pública completa (domínio +
basePath), fonte de verdade de todo metadado que precisa de URL absoluta:

- `metadataBase` em `[locale]/layout.tsx`, base de toda URL relativa nos
  metadados (imagem OG incluída).
- `alternates.canonical` e `alternates.languages` (hreflang) em cada página,
  home e case: cada idioma aponta pros outros dois como versão alternativa,
  mais `x-default` apontando pro pt.
- `openGraph` e `twitter` em `generateMetadata`: título, descrição e locale
  (`ogLocale` em `i18n/config.ts`, formato underscore, diferente do
  `htmlLang` em BCP47).
- `app/robots.ts` e `app/sitemap.ts`: gerados como `robots.txt` e
  `sitemap.xml` estáticos no build (com `export const dynamic =
  "force-static"`, exigido nesta versão do Next pra rotas especiais dentro de
  `output: "export"`, mesmo sem nada de dinâmico no arquivo). O sitemap
  inclui o hreflang de cada URL, espelhando o `alternates.languages` da
  página.
- `opengraph-image.tsx` (home e case, via `next/og`): cartão gerado no build
  (`src/lib/og-card.tsx`), a hero em 1200x630. Papel, a gravura em linha no
  fundo, o título em caixa alta ocupando o quadro, legendas em mono nos
  cantos, e o retrato só na home (num case ele roubaria o assunto, que é o
  trabalho). O Next reaproveita a mesma imagem pro `twitter:image`, sem
  precisar de um `twitter-image.tsx` separado.

  Fonte não é detalhe aqui. O gerador por baixo do `ImageResponse` é o satori,
  que cai numa fonte genérica quando não recebe nenhuma, e era isso que o
  cartão vinha mostrando: o nome em Helvetica, sem relação com o site. Só que
  satori não decodifica woff2 (falta o brotli, e o pacote nem embarca o
  decodificador), e todo pacote de fonte do site é woff2. A saída é levar
  woff, que ele lê e que o Fontsource já publica ao lado: Bricolage Grotesque
  800 (a display do `.type-display`) e IBM Plex Mono, copiadas para
  `src/fonts/og/` por `scripts/build-og-assets.mjs`. As duas são OFL, então a
  cópia é uso previsto pela licença. A Whyte Inktrap do nome na hero fica de
  fora: é licenciada, e levar a fonte inteira para dentro do build por causa
  de um cartão não se justifica.

  As duas fontes são subconjunto latino, então título em chinês não é coberto
  por nenhuma e cai no mecanismo de reserva do próprio `ImageResponse`, que
  era quem já resolvia isso antes delas existirem. O `zh` continua saindo
  certo, com o latim em Plex Mono e o chinês na reserva.

  O retrato é o primeiro quadro da folha de sprite da hero (o de repouso),
  recortado pelo mesmo script para `src/lib/og/retrato.png`. Os três arquivos
  são lidos do disco no build e nunca chegam ao navegador.

  A gravura do fundo é a mesma trama ondulada do retrato, ampliada, e vem de
  `src/lib/engraving.ts`. Ela chegou a ser o fundo da hero e foi revertida de
  lá (ver Mídia e movimento, acima): aqui ficou, porque um cartão é parado por
  definição e não disputa espaço com movimento nenhum. Entra como `<img>`, e
  não como `background-image`: satori resolve background com um raster próprio
  que ignora filtro de SVG, e é filtro (`feTurbulence` somado a
  `feDisplacementMap`) que faz a onda.
- `PersonJsonLd` (`src/components/seo/PersonJsonLd.tsx`), renderizado no
  layout: schema.org `Person` com nome, cargo, URL, redes (`sameAs`) e
  `worksFor`. Ainda sem `image`: agora existe um retrato parado
  (`src/lib/og/retrato.png`), mas ele mora fora de `public/`, então não tem
  URL pública pra apontar. Publicar o recorte é o que falta.

## Favicon

Três arquivos em `src/app/`, gerados por `scripts/build-favicon.mjs`, cada um
respondendo a um navegador diferente. O desenho é o mesmo dos outros
destaques: a assinatura em Whyte Inktrap e a inversão tinta/papel da lente,
num quadrado de tinta com "A." vazado em papel, o ponto que fecha a
assinatura. Nada além disso: a 16px, que é o tamanho que importa numa aba,
qualquer segundo elemento (a gravura, o retrato) vira mancha. O que sobra do
desenho da fonte nesse tamanho são os ink traps do "A", que é justamente o
detalhe que dá nome à família. O glifo sai de `font.getPath("A.", ...)`, não
de `charToGlyph`: são dois glifos (a letra e o ponto), e é a própria fonte
quem resolve o avanço entre eles.

- `icon.svg`: o que Chrome e Firefox preferem, e o único que inverte sozinho
  conforme o tema do sistema, por uma media query DENTRO do arquivo (favicon
  em SVG honra `prefers-color-scheme` nesses dois).
- `favicon.ico`: Safari e navegador antigo, que não leem SVG. Não tem como
  inverter, então fica na versão clara, a padrão do site. Numa barra de abas
  escura o quadrado se funde ao fundo e sobra o "A." branco, que continua
  legível: num desenho vazado, um dos dois elementos sempre contrasta com o
  que está em volta. Os quadros (16, 32 e 48) vão como PNG dentro do
  contêiner ICO, que é o que todo navegador atual lê, e o script monta o
  contêiner na mão, sem dependência.
- `apple-icon.png`: tela de início do iOS, que ignora transparência e
  arredonda por conta própria, então precisa de um PNG chapado, sangrado até
  a borda.

O glifo entra como PATH, não como fonte. A Whyte é licenciada (ABC Dinamo), e
contornar uma letra para virar marca é o uso normal de um logotipo, diferente
de redistribuir a fonte inteira num formato instalável. O contorno é extraído
na bancada e escrito direto nos arquivos gerados, então nem o woff2 nem um ttf
convertido precisam ser lidos no build do site.

Tudo isso assume `siteUrl` correto. O fallback embutido em `site.ts` já bate
com o GitHub Pages atual (`https://ganwalk.github.io/portifolio`); com
domínio próprio, atualiza só o `NEXT_PUBLIC_SITE_URL` do workflow (ver
Deploy, abaixo).

## Deploy

GitHub Actions publica no GitHub Pages a cada push na branch principal. O build
define `NEXT_PUBLIC_BASE_PATH=/portifolio`, porque o site vive num subcaminho,
e `NEXT_PUBLIC_SITE_URL=https://ganwalk.github.io/portifolio`, usada nos
metadados que precisam de URL absoluta (ver SEO, acima). Com domínio próprio
ou na Vercel, basta não definir `NEXT_PUBLIC_BASE_PATH` e trocar
`NEXT_PUBLIC_SITE_URL` pelo domínio novo.

## Próximos passos

1. Dezert Horse ainda espera a captura de tela real do próprio site (usa
   WebGL/Three.js): a capa continua no placeholder do Pexels, duna de
   areia. Último placeholder de mídia restante, os outros quatro cases já
   usam mídia real (Ganwalk, Pink Opala, Intranet, Landing Pages).
2. ~~Calibrar as métricas dos cases~~ — feito: nenhuma métrica de nenhum
   case continua `illustrative: true`.
3. ~~Escrever o corpo dos cases~~ — feito, todos os cinco (o número mudou
   de quatro pra cinco quando Landing Pages virou case próprio).
4. Completar `src/data/profile.ts`: cidade (`location`) e ano de início na
   AUVP (`experience[0].period`, hoje "20XX até hoje", texto de espera
   visível de verdade no Modo Boring/currículo). LinkedIn, Instagram e
   WhatsApp já estão prontos (`profile.links`).
5. Ligar Microsoft Clarity e Google Analytics quando os IDs existirem.
6. Recortes de colagem em volta do nome no hero, quando chegarem.
7. Registrar domínio próprio e verificar a propriedade no Google Search
   Console e no Bing Webmaster Tools, depois de trocar `NEXT_PUBLIC_SITE_URL`.
