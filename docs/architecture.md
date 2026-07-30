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

| Papel                    | Fonte           | Onde aparece                                  |
| ------------------------ | --------------- | --------------------------------------------- |
| Display de cartaz        | Archivo (wdth)  | nome na hero, títulos de case                 |
| Serif de impresso        | Fraunces        | subtítulo da hero, métricas gigantes          |
| Mono de extrato          | IBM Plex Mono   | legendas técnicas, tags, controles            |

O eixo de largura da Archivo é o que dá o ar de ingresso antigo, por isso a
importação é do arquivo `wdth.css` e a classe usa `font-stretch`, não o eixo padrão.

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

- **Hero com lente** (`Hero`): o nome em display gigante, uma palavra por linha
  e alinhado à esquerda, com o subtítulo em serif itálica logo abaixo. A lente
  que segue o mouse é uma inversão: dentro dela tinta e papel trocam de lugar,
  sem nenhuma cor entrar na conta. A revelação usa máscara radial de borda
  suave, não recorte duro, então o círculo é difuso nas beiradas. Perto do CTA
  "Veja meu trabalho" o raio encolhe. Em telas de toque a lente fica com raio
  zero e nada roda. A hero desconta a altura da barra (`100svh` menos
  `3.5rem`) porque o cabeçalho é sticky e ocupa espaço no fluxo.
- **Cases como baralho** (`CasePanels`): todas as cartas usam a mesma
  composição, mídia de borda a borda com índice e métrica no topo e título no
  pé, porque a repetição aqui é ritmo, não monotonia: o que muda de uma carta
  para a outra é a mídia. Cada painel tem exatamente uma tela de altura e gruda
  no topo, então a carta seguinte começa a subir no mesmo instante em que a
  atual fixa, e a sobreposição vira um movimento contínuo, sem pausas. A carta
  coberta encolhe e escurece, e um fio de luz no topo de cada uma marca a
  passagem. A mídia corre em parallax dentro da carta.

  O conteúdo da carta tem folga generosa no topo (`pt-24`): a carta fixa em
  `top-0` para a mídia sangrar até a borda da tela, e sem essa folga a linha de
  índice e ano ficaria escondida atrás da barra sticky.
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
  fundo. `Reveal` dá a entrada padrão das seções de apoio.

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
