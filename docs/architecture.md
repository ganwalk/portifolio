# Arquitetura do portfólio

Documento vivo. Toda decisão técnica ou de direção de arte que sair da conversa
entra aqui.

## O que este site é

Portfólio de Armando Custodio, Design Engineer. Duas experiências no mesmo
conteúdo: a criativa, com textura, movimento e som, e a utilitária (Modo Boring),
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
| Som                 | Sintetizado no navegador, muito sutil, desligado por padrão              |
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
    controls/ControlBar.tsx  Modo Boring, tema, som e idioma
    layout/SiteFrame.tsx     cabeçalho fixo, rodapé, atalho de acessibilidade
    providers/Providers.tsx  ordem dos contextos
    sections/                Hero, CasesGrid, Playground, About, Contact
    ui/Marquee.tsx           letreiro contínuo
    views/HomeView.tsx       o interruptor entre as duas experiências
  contexts/
    BoringModeContext.tsx    estado global, persiste em localStorage
    SoundContext.tsx         camada de som, depende do Modo Boring
  data/
    cases.ts                 cases com métricas e textos nos três idiomas
    profile.ts               dados de contato, habilidades, experiência
    experiments.ts           bloco Fora do expediente
    types.ts                 contratos de conteúdo
  i18n/
    config.ts                idiomas suportados
    dictionaries/            pt (fonte da verdade), en, es
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
   tabela, e o botão de som desaparece da barra.

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

`--font-headline` é a variável que carrega a Bricolage Grotesque, referenciada
direto dentro de `.type-display` e `.type-serif-display` (os nomes das classes
ficaram do desenho anterior, quando eram Archivo condensada e Fraunces
respectivamente; hoje as duas apontam para a mesma fonte de manchete, cada
uma com peso e entrelinha próprios). `--font-sans`, usada pelo `body` e por
`--font-headline` como fallback, continua em Archivo: só o corpo de texto e
nada de manchete usa essa variável diretamente.

Bricolage Grotesque não tem eixo de largura nem itálico de verdade: onde o
subtítulo da hero pede itálico, o navegador sintetiza (oblíqua), efeito aceito
de propósito em fontes grotescas, ao contrário de uma serifa.

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

- **Hero com lente** (`Hero`): o nome em display gigante, uma palavra por linha.
  A lente que segue o mouse é uma inversão: dentro dela tinta e papel trocam de
  lugar, sem nenhuma cor entrar na conta. A revelação usa máscara radial de
  borda suave, não recorte duro, então o círculo é difuso nas beiradas. Perto
  do CTA "Veja meu trabalho" o raio encolhe. Em telas de toque a lente fica com
  raio zero e nada roda. A hero desconta a altura da barra (`100svh` menos
  `3.5rem`) porque o cabeçalho é sticky e ocupa espaço no fluxo.

  No desktop o retrato é posicionado em absoluto, à direita, alinhado ao topo
  do nome, e o resto (nome, subtítulo, CTA, fatos) fica alinhado à esquerda. No
  mobile o retrato deixa de ser absoluto e passa a ser um terceiro item do
  flex (via `order`), entre o bloco de título e o de CTA: o `justify-between`
  do contêiner reparte o espaço entre os três, então o retrato nunca sobrepõe
  o botão nem o subtítulo, porque participa da mesma conta de altura, e tudo
  (título, subtítulo, retrato, CTA, fatos) fica centralizado.
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

- **Cases em grade bento** (`CasesGrid`): a versão anterior prendia o scroll
  uma tela por vez, um baralho de cartas empilhadas em `sticky`. Efeito e
  tanto, mas cansava rápido e lia como apresentação forçada, não como
  destaque. A grade atual é conteúdo em fluxo normal: cada case é um cartão
  de tamanho próprio, dois grandes e dois pequenos alternando na diagonal
  (o padrão de `col-span` se repete a cada quatro cases, se a lista crescer),
  todos com a mesma composição interna, índice e métrica no topo, título e
  tags no pé, mídia de borda a borda dentro do próprio cartão.

  O dinamismo vem de dois lugares: a entrada em cascata (`Reveal`, um atraso
  por índice, o mesmo componente que a seção Fora do Expediente usa) e a
  resposta ao cursor dentro de cada cartão, a mídia desloca alguns pontos
  percentuais na direção do ponteiro (camada separada do parallax de
  scroll, que continua existindo, ambiente, movendo a mídia enquanto o
  cartão atravessa a viewport). `onMouseMove`, não `onPointerMove`: em tela
  de toque o evento não dispara, então a inclinação nunca ativa lá, mesmo
  princípio que já mantém a lente da hera parada no mobile. O cartão inteiro
  também cresce de leve no hover.
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

## Deploy

GitHub Actions publica no GitHub Pages a cada push na branch principal. O build
define `NEXT_PUBLIC_BASE_PATH=/portifolio`, porque o site vive num subcaminho.
Com domínio próprio ou na Vercel, basta não definir essa variável.

## Próximos passos

1. Substituir os placeholders de mídia pelas colagens, telas e vídeos.
2. Calibrar as métricas dos cases com os números reais e tirar o aviso de
   métrica ilustrativa de cada uma que for confirmada.
3. Escrever o corpo dos quatro cases.
4. Completar `src/data/profile.ts`: LinkedIn, cidade, ano de entrada na AUVP.
5. Ligar Microsoft Clarity e Google Analytics quando os IDs existirem.
6. Recortes de colagem em volta do nome no hero, quando chegarem.
