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
    whyte-inktrap/            fonte licenciada, peso Black, três destaques do site
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
| Manchete                 | Bricolage Grotesque | nome na hero, título e métrica dos cases, convite do contato, menu overlay |
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
  toque a lente fica com raio zero e nada roda. A hero desconta a altura da
  barra (`100svh` menos `3.5rem`) porque o cabeçalho é sticky e ocupa espaço
  no fluxo. `.texture-noise-animate` sobre a hero inteira dá o grão de
  filme flutuando, partículas sutis, sem vinheta nem nenhum outro efeito
  por cima.

  O fundo é a própria grade do layout, visível (`HeroGrid`): fios de um
  pixel nas divisões das colunas (oito no desktop, quatro no mobile, as
  ímpares somem por CSS puro), alinhados ao `.gutter`, mais marcas de
  registro nos cruzamentos com três alturas (28%, 50%, 72%). As linhas
  horizontais em si não são desenhadas, só o cruzamento: a grade inteira
  viraria papel quadriculado, ou seja, textura, exatamente o caminho que já
  foi tentado (textura de papel) e revertido. A escolha é estrutura, não
  superfície: o site é de um design engineer, e deixar a grade aparecer é
  mostrar o esqueleto da composição em vez de vestir o fundo. As linhas se
  desenham do topo pra baixo, escalonadas da esquerda pra direita, no mesmo
  compasso da entrada do nome, e as marcas entram em fade depois delas.
  Usam `bg-current`, então a lente as inverte de graça junto com o texto
  (dentro do círculo elas viram claras sobre tinta), sem precisar de uma
  segunda versão. Uma máscara vertical dissolve as pontas para a grade
  nunca encostar em borda dura e nunca virar moldura. Some no Modo Boring e
  na impressão.

  No mobile o H1 é um pouco maior (`14.5vw`, contra `13vw` antes) e o bloco
  de título ganha uma folga extra por cima (`mt-6`), descendo um pouco em
  relação ao cabeçalho. No desktop o retrato é posicionado em absoluto, à
  direita, alinhado ao topo do nome, e o resto (nome, subtítulo, CTA, fatos)
  fica alinhado à esquerda. No mobile o retrato deixa de ser absoluto e
  passa a ser um terceiro item do flex (via `order`), entre o bloco de
  título e o de CTA: o `justify-between` do contêiner reparte o espaço entre
  os três, então o retrato nunca sobrepõe o botão nem o subtítulo, porque
  participa da mesma conta de altura, e tudo (título, subtítulo, retrato,
  CTA, fatos) fica centralizado. O subtítulo ("Designer de [roleta]") usa
  peso 400, mais leve que o padrão (700) de `.type-serif-display`: peso
  cheio competia demais com o nome acima.

  A frase de disponibilidade ("Baseado no Brasil · Disponível para projetos
  no mundo todo") quebra no mobile nas duas orações que o "·" já separa (um
  `<br>` visível só abaixo de `sm`), e o "·" some da quebra: como marcador
  de separação ele faz sentido numa linha só, não como bullet solto no fim
  ou começo de uma linha empilhada. No desktop (`sm:inline`) ele volta,
  porque ali as duas orações continuam na mesma linha.
- **Retrato animado** (`SelfPortrait`): flipbook ao lado do nome. A volta tem
  quatro ciclos: os quadros 1 a 12 sempre iguais e o último mudando entre 13,
  14, 15 e 16, as quatro expressões, que seguram mais tempo no ar (700ms contra
  85ms) senão a expressão passa batido.

  Os quadros vivem numa folha de sprite 4x4 em `public/frames`, gerada por
  `scripts/build-frames.mjs` a partir de `frames eu/`. Uma folha em vez de
  dezesseis arquivos dá uma requisição só, elimina flicker na primeira volta e,
  porque a URL é a mesma, o bitmap decodificado é compartilhado entre a cópia
  normal e a cópia invertida que aparece dentro da lente. A animação troca de
  quadro mexendo apenas em `background-position`, sem tocar no DOM.

  O relógio mora em `src/lib/portrait-frames.ts`, fora do React: a hero
  renderiza o retrato duas vezes, e dois temporizadores independentes sairiam de
  sincronia, deixando a lente mostrar um quadro diferente do que está atrás
  dela. Com um relógio só as duas andam juntas.

  Peso: os PNGs originais somam 16,6 MB. As folhas somam 744 KB no desktop e
  169 KB no mobile, escolhidas na mão porque o meio tom do desenho é caro de
  comprimir e a qualidade só derruba o arquivo até certo ponto. `--accent`
  apontado para a tinta não ajuda aqui: o desenho é cinza dentro de uma
  silhueta de alfa binário, não uma máscara de uma cor.

- **Roleta do subtítulo** (`SubtitleRoulette`): a última palavra do subtítulo
  ("produtos") gira por uma lista que alude à atuação (experiências,
  aplicativos, interfaces, sistemas, músicas, sonhos) e descansa de novo na
  primeira ao voltar ao início. A troca é disparada pelo mesmo relógio do
  retrato: `subscribeRouletteTick`, em `portrait-frames.ts`, soma um a cada vez
  que o relógio entra num quadro final (13 a 16), no mesmo instante em que a
  expressão muda. Rosto e palavra giram juntos porque saem do mesmo pulso, sem
  precisar de um segundo temporizador nem de código de coordenação entre os
  dois componentes.

  A ordem da frase muda por idioma ("Designer de produtos" em PT, "Designer of
  products" em EN), por isso o dicionário guarda `subtitlePrefix` e
  `subtitleWords` separados, e cada idioma tem sua própria lista, coerente com
  a posição da palavra na frase.

  A troca de palavra desliza na vertical com desfoque, para lembrar as fitas
  de uma roleta física, não um crossfade comum. Uma cópia invisível da palavra
  mais longa da lista fica empilhada por baixo via grid, só para reservar a
  largura: sem ela, a rotação empurraria o texto ao lado a cada troca.

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

  O fundo de cada card é estático: só a mídia, sem deslocar com o cursor. O
  movimento que resta nela é um zoom sutil (`scale`, via `animate`), e esse
  é só no hover, não no scroll, pra não competir com a máscara de texto
  pela atenção nem parecer que o zoom "pula" cada vez que um projeto novo
  entra em cena. Só na capa que está de fato em cena (`SceneCoverMedia.tsx`),
  o hover ganha uma segunda camada por cima do zoom: uma ondulação que
  segue o cursor, com aberração cromática (cada canal RGB lê a textura com
  uma amplitude de onda diferente, então a franja de cor cresce e encolhe
  junto com a força do hover), WebGL cru (sem three.js nem nenhuma
  biblioteca, um triângulo cheio de tela e um fragment shader), o único uso
  de WebGL do site de propósito, escopo mínimo: um experimento de "lente"
  de deslocamento, não uma reescrita do vocabulário de movimento inteiro.
  A mesma capa também funde da capa anterior (mesma posição de coluna, ver
  `fromCover` em `CasesGrid.tsx`) pra si conforme a fatia sobe pelo scroll:
  o shader lê as duas texturas e cruza uma pela outra de baixo pra cima,
  com ruído na borda pra ficar orgânica, no lugar de simplesmente aparecer
  por cima. Inspirado numa referência de navegação em WebGL (Awwwards, Vero
  New York / Rodéo Studio). Só acontece quando existe uma capa anterior na
  mesma coluna (a primeira fatia da seção e as colunas novas que o trio
  ganha não têm uma); nesses casos, um aceno de estreia toca sozinho,
  centralizado, na primeira vez que o projeto entra em cena (sobe e desce
  em ~1,1s), cumprindo o mesmo papel de descoberta que a fusão cumpre nos
  outros: sem um dos dois, o efeito inteiro dependia de alguém descobrir
  que passar o mouse ali fazia diferença. O `<canvas>` fica por cima do
  `<MediaView>` de sempre (que continua renderizado, é o que aparece
  quando o WebGL não roda) e só some/aparece via `opacity`; o loop de
  desenho (`requestAnimationFrame`) só roda enquanto o cursor está de fato
  em cima, a fusão de scroll ainda está em andamento, ou durante o aceno de
  estreia, parado o resto do tempo, custo zero fora disso. Não roda no
  Modo Boring nem quando o sistema pede menos movimento
  (`prefers-reduced-motion`), e cai pro `<MediaView>` sem nenhuma
  diferença visível se o navegador não tiver WebGL: a checagem de suporte
  é só tentar criar o contexto e desistir em silêncio se vier nulo.

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
  e preview de imagem no hover de cada link. Renderiza num portal para o body,
  porque o `backdrop-blur` do cabeçalho criaria um containing block e prenderia
  o overlay dentro da barra. No mobile a mesa de controle mora aqui.
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

  Assim que o cabeçalho aparece, um tooltip aponta para o botão do Modo Boring
  com a frase da pessoa que odeia animação, e some sozinho depois de alguns
  segundos ou ao clicar (`ControlBar`, prop `tooltipArmed`). O texto do
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

No Modo Boring nada disso existe: sem lua, sem menu, sem vídeo, só a página
utilitária.

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
- `opengraph-image.tsx` (home e case, via `next/og`): cartão gerado no build,
  texto puro em preto e branco (`src/lib/og-card.tsx`), porque ainda não
  existe um retrato único, só a folha de sprite do retrato animado da hero,
  feita pra `background-position`, não pra aparecer inteira numa imagem só.
  O Next reaproveita a mesma imagem pro `twitter:image`, sem precisar de um
  `twitter-image.tsx` separado.
- `PersonJsonLd` (`src/components/seo/PersonJsonLd.tsx`), renderizado no
  layout: schema.org `Person` com nome, cargo, URL, redes (`sameAs`) e
  `worksFor`. Sem `image`, pelo mesmo motivo do cartão OG.

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
