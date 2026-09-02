# Portfólio de Armando Custodio

Design Engineer. Experiências interativas do banking à música, num site que é,
ele mesmo, a demonstração do trabalho: sem CMS, sem servidor, cada detalhe de
movimento e tipografia decidido a propósito.

Este documento explica como o site funciona por dentro. Para decisões
técnicas com o raciocínio completo por trás delas, `docs/architecture.md` é a
fonte de verdade (documento vivo, cresce a cada mudança). Regras de copy em
`docs/tom-de-voz.md`.

## Duas experiências, um conteúdo só

O site é dois sites em um, comandados pelo mesmo dado:

- **Modo Criativo**: a home imersiva, com a lente que deforma o nome na hero,
  os cases presos ao scroll, o retrato em flipbook, o grão de filme flutuando.
- **Modo Boring**: uma página só, em preto e branco absoluto, sem animação
  nenhuma. É também o currículo: `Ctrl/Cmd + P` imprime direto, com URL entre
  parênteses depois de cada link externo.

Quem decide qual das duas aparece é `BoringModeContext`, que guarda a escolha
em `localStorage` e escreve `data-boring="true"` no `<html>`. A partir daí,
três camadas reagem ao mesmo atributo, sem precisar checar estado em cada
componente:

1. **CSS** (`globals.css`): tokens de cor viram preto e branco absoluto,
   texturas somem, `transition`/`animation` são anuladas globalmente.
2. **Framer Motion**: `MotionConfig` recebe `reducedMotion="always"`, então
   nenhum componente anima mesmo que peça.
3. **React**: `HomeView` troca a home inteira pela `BoringView`.

Fora do Boring, `MotionConfig` já respeita `prefers-reduced-motion` do
sistema (`reducedMotion="user"`): quem pede menos movimento no SO recebe o
site calmo sem precisar apertar nada. O interruptor continua sendo escolha
explícita.

## Como o site é montado

Next.js 16 (App Router) com `output: "export"`: o `next build` gera HTML/CSS/
JS estáticos em `out/`, sem servidor nenhum por trás. Isso descarta
middleware, rotas de API e otimização de imagem no servidor de propósito, e
molda decisões em cascata: detecção de idioma acontece em JavaScript no
navegador (não em middleware), a imagem social é gerada uma vez no build (não
sob demanda), e assim por diante.

Conteúdo é TypeScript tipado no repositório (`src/data/`), não CMS: editar um
case, o texto do "Sobre" ou a lista de habilidades é editar um arquivo e
reconstruir. `Dictionary`, o tipo de cada dicionário de idioma, é derivado do
português (`src/i18n/dictionaries/pt.ts`), então o TypeScript aponta sozinho
qualquer chave que falte traduzir nos outros três.

Quatro idiomas: `pt` (fonte da verdade), `en`, `es`, `zh`. Cada um gera HTML
próprio, com `lang` correto, numa rota `[locale]` própria. Sem servidor para
negociar idioma, `public/index.html` (a porta de entrada, fora do Next) lê
`navigator.languages` no navegador e redireciona para o prefixo certo, com
links visíveis para quem estiver sem JavaScript.

## Pelo que a home é feita

- **Hero**: o nome em display gigante (Whyte Inktrap, fonte licenciada,
  reservada só para os destaques do site), uma lente que segue o cursor e
  incha a letra por baixo dele via WebGL (`HeroTitleGL`, o único uso de WebGL
  fora dos próprios projetos de case), e uma segunda lente que inverte tinta e
  papel dentro de um círculo. Nenhuma cor entra na conta: a inversão é preto
  virando branco e vice versa.
- **Cases em destaque** (`CasesGrid`): a seção prende o scroll e empilha os
  projetos como um baralho, cada fatia deslizando por cima da anterior, que
  encolhe e escurece por baixo. No mobile vira `position: sticky` puro, sem
  JavaScript decidindo a transição. Cases adjacentes com o mesmo `group` no
  dado (o trio de artistas: Ganwalk, Dezert Horse, Pink Opala) viram uma
  fatia só, com colunas lado a lado. Clicar expande para o caso completo
  (mesma rota que `/work/[slug]`, só que animado a partir do card clicado).
- **Sobre**: bio, a "corda" de habilidades que persegue o cursor e prende uma
  tag de cada vez que o mouse passa por cima dela, idiomas, e os logos de
  quem já confiou no trabalho.
- **Extras** (Playground): ilustração, animação e produção musical, num
  retículo de dither que revela a peça a cores no hover.
- **Contato**: uma grade de imagem interativa que se distorce com o mouse.

Toda seção usa `Reveal` (sobe e aparece ao entrar na tela, uma vez) como
entrada padrão, e toda a página rola por `Lenis`, uma camada de amortecimento
por cima do scroll nativo do navegador (não substitui o scroll, então
teclado, barra e "encontrar na página" continuam funcionando normalmente).

## Cases

Cada case (`src/data/cases.ts`) é um objeto tipado com título, texto em
primeira pessoa, métricas (quando fazem sentido: os três projetos de
artista/identidade não têm, de propósito, e mostram link de repositório e
demo no lugar), mídia de capa e, quando existe, `demoUrl`/`repoUrl`. A
página dedicada (`/work/[slug]`) reaproveita o mesmo tratamento visual do
painel expandido da home, não um bloco de texto plano.

Dois cases fogem do padrão "vídeo de capa + iframe do site":

- **Design System** (ex Intranet): mostra o próprio Design System publicado,
  embutido num iframe de verdade (scroll, arraste e teclado funcionam por
  dentro), fixo numa parte específica, mais um índice das outras 25 partes
  documentadas.
- **Landing Pages** (dentro do case Ecossistema AUVP): cada página é uma
  captura real dentro de uma simulação de janela de navegador, que rola pelo
  still inteiro no hover, com link para abrir a página publicada de verdade.

## Tipografia e cor

Preto e branco, e mais nada: a única cor do site vem da mídia dos projetos
(e mesmo essa, natural, nunca neon). Cinco fontes, cada uma com um papel só:
Archivo no corpo de texto, Bricolage Grotesque nas manchetes e métricas,
Whyte Inktrap (licenciada) nos destaques de assinatura, IBM Plex Mono nas
legendas técnicas, Switzer no subtítulo da hero. Tabela completa em
`docs/architecture.md`.

## O cartão que aparece ao compartilhar o link

A imagem de prévia (Discord, WhatsApp, Instagram) é gerada uma vez no build
(`next/og`, via `src/lib/og-card.tsx`), não é uma captura de tela. O nome/
título é contorno vetorial em Whyte Inktrap, extraído da fonte por um script
de bancada (`scripts/build-og-wordmarks.mjs`) e commitado pronto: a mesma
técnica do favicon, letra como desenho, não a fonte inteira embarcada no
build. O fundo é o mesmo grão de filme sutil que o resto do site usa.

## SEO

`src/lib/site.ts` centraliza a URL pública, usada em `metadataBase`,
`hreflang` (cada idioma aponta para os outros três), OG/Twitter card e no
sitemap. `PersonJsonLd` publica um schema.org `Person` no layout. Tudo
gerado estaticamente no build, sem rota de API.

## Acessibilidade

Atalho para o conteúdo, foco visível, `aria-pressed` nos interruptores,
`prefers-reduced-motion` respeitado em toda animação (Framer Motion e CSS),
contraste alto nos dois temas, letreiros lidos como texto por leitor de
tela.

## Onde mexer

| Quero mudar                  | Vou em                                              |
| ----------------------------- | ---------------------------------------------------- |
| Textos do site                | `src/i18n/dictionaries/pt.ts` (e en, es, zh)          |
| Cases, métricas, links        | `src/data/cases.ts`                                   |
| Contato, habilidades, cargo   | `src/data/profile.ts`                                 |
| Extras (Playground)           | `src/data/experiments.ts`                             |
| Cores, fontes, texturas       | `src/app/globals.css`                                 |
| Frames do retrato da hero     | `frames eu/`, depois `node scripts/build-frames.mjs`  |
| Cursor personalizado          | `cursor/`, depois `node scripts/build-cursors.mjs`    |
| Cartão social (imagem OG)     | `src/lib/og-card.tsx`, `scripts/build-og-wordmarks.mjs` |

Scripts de bancada (`build-frames.mjs`, `build-cursors.mjs`,
`build-og-assets.mjs`, `build-og-wordmarks.mjs`, `build-favicon.mjs`) ficam
fora do `package.json` de propósito: são ferramentas de quem edita mídia ou
fontes, não dependência do site em produção. Cada um documenta, no próprio
topo do arquivo, o `npm install --no-save` que precisa antes de rodar.

## Rodando localmente

```bash
npm install
npm run dev     # http://localhost:3000/pt/
npm run build   # gera o site estático em out/
```

## Publicação

Push na `main` publica sozinho no GitHub Pages, via GitHub Actions. O build
define `NEXT_PUBLIC_BASE_PATH=/portifolio` (o site vive num subcaminho) e
`NEXT_PUBLIC_SITE_URL`, usada nos metadados que precisam de URL absoluta. Com
domínio próprio ou outra hospedagem, basta ajustar essas duas variáveis, sem
mudar nada do código.
