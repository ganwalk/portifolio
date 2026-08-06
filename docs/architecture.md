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
| Cases da AUVP       | Telas recriadas e métricas ilustrativas até autorização formal           |
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
    sections/                Hero, CasesGrid, Playground, About, Contact
    ui/Marquee.tsx           letreiro contínuo
    views/HomeView.tsx       o interruptor entre as duas experiências
  contexts/
    BoringModeContext.tsx    estado global, persiste em localStorage
  data/
    cases.ts                 cases com métricas e textos nos três idiomas
    profile.ts               dados de contato, habilidades, experiência
    experiments.ts           bloco Fora do expediente
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

O Modo Boring não usa nenhuma das duas: currículo é documento, tem densidade
própria e margem de leitura, não de vitrine.

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

  **O nome é atravessado por uma lente que segue o cursor** (`HeroTitleGL`,
  o único uso de WebGL do site). Onde o ponteiro passa, "ARMANDO CUSTODIO"
  entorta, como se houvesse um vidro convexo pousado em cima dele.

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
  a identidade).

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

  A fatia do trio ganha uma quarta coluna, estreita, à esquerda das três:
  só a frase "Experiências interativas" girada 90° (`writing-mode:
  vertical-rl`), na Whyte Inktrap (mesma fonte dos títulos, não a mono do
  resto dos rótulos), uma régua de contexto, não um case clicável.

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
- **Lua de fases** (`MoonPhase`): no canto direito do cabeçalho, percorre as
  fases da lua conforme o scroll, três lunações por página.
- **Menu overlay** (`SiteMenu`): navegação de tela cheia com tipografia gigante
  (Whyte Inktrap, via `.type-inktrap` somada ao `.type-display` que já dava
  tamanho e caixa alta), um link por caixa, separadas por linhas finas
  (`border-line`, o mesmo fio de 1px do resto do site: borda em cima só na
  primeira caixa, embaixo em todas, então a borda de baixo de uma já serve de
  cima da próxima, sem linha dobrada onde se tocam). Passar o mouse numa caixa
  inverte o tema só ali dentro (fundo vira `--foreground`, rótulo e a
  descrição curta da seção viram `--background`, mesmo par que `BoringToggle`
  já usa no próprio hover): nenhuma cor entra na conta, o destaque é preto e
  branco trocando de lugar. O fundo entra como um wipe (`scaleX` a partir da
  esquerda, não um fade), e a descrição segue um instante depois
  (`delay-100`), então a caixa sempre atravessa "fundo sem descrição" antes de
  "fundo com descrição". `group-focus-within`, e não só `group-hover`, repete
  a revelação pra quem navega por teclado. Descrições vêm de
  `dict.nav.menuDescriptions`, uma frase por seção, e a descrição some abaixo
  de `lg:` (nem sobra largura ao lado do rótulo gigante empilhado, nem existe
  hover de verdade em toque). Um preview de imagem recortada pela forma das
  próprias letras (`background-clip: text`) morou aqui antes e saiu: competia
  pela mesma área que o fundo invertido agora ocupa. Renderiza num portal para
  o body, porque o `backdrop-blur` do cabeçalho criaria um containing block e
  prenderia o overlay dentro da barra. No mobile a mesa de controle inteira
  mora aqui, Modo Boring incluído.
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

**A pilha de `CasesGrid` reage à velocidade da rolagem, não só à posição.**
Uma leve inclinação (`skewY`, ver `stackSkew`) cresce com a rapidez do gesto
e volta a zero assim que ele desacelera (`useVelocity` sobre o scroll bruto,
amortecido por outra mola), o peso físico de um baralho reagindo à mão em vez
de deslizar rígido. Contida a menos de 1,5 grau, de propósito: é textura de
movimento, não ornamento, e fica de fora dos elementos regidos pelo cursor
dentro da mesma seção (o selo "ver caso", os pontos de posição), cuja
matemática usa a posição bruta do mouse e descasaria do cursor de verdade se
herdasse a inclinação do ancestral. Some para quem pede menos movimento no
sistema.

**`ScrollProgress`** (`src/components/ui/ScrollProgress.tsx`) é uma régua de
2px presa ao topo da viewport, acima do cabeçalho, com a largura ligada ao
progresso de rolagem da página inteira (`useScroll` sem `target`, mais uma
mola leve só pra tirar o serrilhado de um salto rápido, nunca pra atrasar a
leitura). Reforça, em qualquer página, a mesma lógica de "rolar é a
navegação" que o rodapé de `CasesGrid` já escreve por extenso. Some no Modo
Boring e na impressão, mesmo critério do resto do cabeçalho.

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
num quadrado de tinta com o "A" vazado em papel. Nada além disso: a 16px, que
é o tamanho que importa numa aba, qualquer segundo elemento (a gravura, o
retrato) vira mancha. O que sobra do desenho da fonte nesse tamanho são os ink
traps do "A", que é justamente o detalhe que dá nome à família.

- `icon.svg`: o que Chrome e Firefox preferem, e o único que inverte sozinho
  conforme o tema do sistema, por uma media query DENTRO do arquivo (favicon
  em SVG honra `prefers-color-scheme` nesses dois).
- `favicon.ico`: Safari e navegador antigo, que não leem SVG. Não tem como
  inverter, então fica na versão clara, a padrão do site. Numa barra de abas
  escura o quadrado se funde ao fundo e sobra o "A" branco, que continua
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

1. Substituir os placeholders de mídia pelas colagens, telas e vídeos.
2. Calibrar as métricas dos cases com os números reais e tirar o aviso de
   métrica ilustrativa de cada uma que for confirmada.
3. Escrever o corpo dos quatro cases.
4. Completar `src/data/profile.ts`: cidade e ano de entrada na AUVP. LinkedIn,
   Instagram e WhatsApp já estão prontos (`profile.links`).
5. Ligar Microsoft Clarity e Google Analytics quando os IDs existirem.
6. Recortes de colagem em volta do nome no hero, quando chegarem.
7. Registrar domínio próprio e verificar a propriedade no Google Search
   Console e no Bing Webmaster Tools, depois de trocar `NEXT_PUBLIC_SITE_URL`.
