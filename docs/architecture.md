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
| Display de cartaz        | Archivo (wdth)  | manchete do hero, momentos lúdicos            |
| Serif de impresso        | Fraunces        | métricas gigantes, títulos de case            |
| Mono de extrato          | IBM Plex Mono   | legendas técnicas, tags, controles            |

O eixo de largura da Archivo é o que dá o ar de ingresso antigo, por isso a
importação é do arquivo `wdth.css` e a classe usa `font-stretch`, não o eixo padrão.

## Cores

Base neutra de papel e tinta, com turquesa como único acento, usado com parcimônia:
links, marcadores, estado ativo. No Modo Boring o acento é abolido, resta preto e
branco.

## Acessibilidade

Atalho para o conteúdo, foco visível, `aria-pressed` nos interruptores,
`prefers-reduced-motion` respeitado, contraste alto nos dois temas e o letreiro
contínuo lido como texto por leitores de tela, não como animação.

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
6. Colagens que vazam do grid no hero, quando os recortes chegarem.
