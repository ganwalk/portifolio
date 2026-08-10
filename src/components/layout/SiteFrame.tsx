"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BoringToggle } from "@/components/controls/BoringToggle";
import { ControlBar } from "@/components/controls/ControlBar";
import { LocaleSwitcher } from "@/components/controls/LocaleSwitcher";
import { SiteMenu } from "@/components/nav/SiteMenu";
import { MoonPhase } from "@/components/ui/MoonPhase";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { profile } from "@/data/profile";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Moldura comum a todas as páginas.
//
// O cabeçalho muda de arranjo com a largura, mantendo uma só ordem de DOM
// (menu+Boring, assinatura, tema/som/idioma+lua): no mobile é grid de três
// colunas (minmax(0,1fr) nas duas pontas, não 1fr puro: força as duas
// colunas flanqueadoras a ficarem exatamente do mesmo tamanho mesmo quando
// o conteúdo de cada uma pede larguras mínimas diferentes, senão a coluna
// central, "Armando Custodio", centraliza contra colunas desiguais e sai do
// centro de verdade da barra); no desktop vira flex e a assinatura vai para
// a frente da fila (order-first), com o segundo cluster empurrado para a
// direita. No mobile a mesa de controle (tema/som/idioma) mora dentro do
// menu; no desktop ela se divide nos dois clusters da própria barra. Ao
// rolar, a barra encorpa (fundo mais sólido) para não sumir sobre as mídias.
// Some por completo na impressão.
//
// A barra em si é UMA linha só, sempre presente, em qualquer largura: nunca
// alterna entre duas barras diferentes. No mobile, na home em Modo Criativo,
// só o CONTEÚDO da barra muda com o scroll, trocando dinamicamente dentro da
// mesma linha (sem recolher uma pra abrir outra): durante a hero (antes da
// primeira dobra passar) ela mostra [Modo Boring, lua, idioma], a oferta de
// saída feita de cara, com a lua entre os dois porque é ali que ela nasce
// nessa composição, EQUIDISTANTE dos dois vizinhos (flex+justify-between só
// nessa composição, não a mesma grade de colunas iguais que centraliza a
// assinatura na composição normal: os dois vizinhos têm larguras bem
// diferentes, e "centro da barra" e "meio caminho entre os dois" são pontos
// diferentes); passada a hero, [menu, Armando Custodio] entram e a lua migra
// pro canto direito, o arranjo padrão do resto do site. As duas composições
// trocam com um crossfade sincronizado (AnimatePresence, mode="popLayout"
// pra quem sai não empurrar quem entra: os pares têm larguras diferentes),
// mesma duração e curva em todo mundo (HEADER_SWAP_TRANSITION) incluindo a
// lua, que usa a mesma layoutId nas duas composições e por isso desliza de
// um lugar pro outro em vez de sumir e reaparecer: um `if` de verdade monta
// só uma cópia por vez (esconder por CSS, testado antes, não passa pelo
// ciclo de montagem que o Framer observa pra disparar a animação). Essa
// troca de conteúdo é exclusiva do mobile: no desktop a barra sempre mostra
// tudo de uma vez (Boring+menu à esquerda, tema/idioma+lua à direita), sobra
// espaço e esconder qualquer parte só tiraria acesso sem ganhar nada em
// troca. Fora da home, ou já em Modo Boring, o mobile também já nasce direto
// no arranjo padrão (menu, assinatura, lua à direita): a composição de hero
// só faz sentido junto da própria hero.
//
// Em Modo Boring o cabeçalho ganha uma SEGUNDA linha, essa sim recolhível,
// com Modo Boring e idioma: lá o menu não existe (a página utilitária é uma
// coluna só, veja SiteMenu), então sem essa linha não sobraria porta nenhuma
// de volta para o Modo Criativo. Fica sempre presente, em qualquer scroll,
// só no mobile (no desktop os dois já cabem na primeira linha, junto do
// menu).
//
// No mobile, na home em Modo Boring, a PRIMEIRA linha (a barra principal)
// some por completo até o scroll alcançar a seção "Sobre" (`#about`): a
// própria BoringView já abre com o nome como H1 do próprio conteúdo (o
// "cabeçalho de currículo"), então repetir a assinatura na barra fixa no
// mesmo instante é redundância pura numa tela estreita, e só a segunda linha
// (a saída pro Modo Criativo) precisa existir ali. A barra reaparece assim
// que a assinatura do documento já saiu da vista e ela passa a ser a única
// referência de identidade na tela. No desktop a primeira linha continua
// sempre visível, mesmo critério de sobra de espaço do resto do cabeçalho.
//
// Na home em Modo Criativo o cabeçalho é `fixed`, não `sticky`: um elemento
// sticky reserva a própria altura no fluxo do documento mesmo com o
// conteúdo interno trocando via opacity/max-height (propriedades visuais,
// não afetam a reserva de espaço do fixed). Fixed nunca reserva espaço,
// então a hero pode ocupar a tela inteira (100svh) e o cabeçalho flutua por
// cima dela o tempo todo. Fora da home (ou em Boring), continua sticky:
// essas páginas não têm hero e sempre dependeram do cabeçalho empurrando o
// conteúdo para baixo.

// Transição compartilhada pela troca de conteúdo do cabeçalho mobile (ver
// heroMini, abaixo): mesma duração e curva pra lua (layoutId) e pro
// crossfade dos outros controles, então tudo se move junto, num só gesto,
// em vez de a lua deslizar num tempo e o resto cortar seco no dela.
const HEADER_SWAP_TRANSITION = { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const };

export function SiteFrame({
  children,
  locale,
  dict,
}: {
  children: ReactNode;
  locale: Locale;
  dict: Dictionary;
}) {
  const { isBoringMode } = useBoringMode();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [pastFirstFold, setPastFirstFold] = useState(false);
  const [pastAbout, setPastAbout] = useState(false);

  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const isHomeHero = !isBoringMode && isHome;
  const isBoringHome = isBoringMode && isHome;

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setPastFirstFold(window.scrollY > window.innerHeight * 0.9);
      if (isBoringHome) {
        const aboutTop = document.getElementById("about")?.getBoundingClientRect().top;
        setPastAbout(aboutTop !== undefined && aboutTop <= 80);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isBoringHome]);

  // A barra principal só some por completo em Modo Boring, antes da seção
  // Sobre (ver comentário acima); em qualquer outro caso ela fica sempre
  // visível, mesmo na hero, só trocando de conteúdo (heroMini, abaixo).
  const rowVisible = !isBoringHome || pastAbout;
  // Composição de hero, mobile only: Modo Boring, lua, idioma no lugar de
  // menu, assinatura, lua. Só existe na home em Modo Criativo, antes da
  // primeira dobra passar.
  const heroMini = isHomeHero && !pastFirstFold;
  // Segunda linha do Modo Boring: a única volta possível sem menu, por isso
  // fica sempre presente enquanto o modo dura, em qualquer scroll.
  const boringRowVisible = isBoringMode;

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="type-mono no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-foreground focus:px-3 focus:py-2 focus:text-background"
      >
        {dict.nav.skipToContent}
      </a>

      <header
        className={`no-print ${isHomeHero ? "fixed" : "sticky"} top-0 z-40 flex w-full flex-col border-b border-line backdrop-blur transition-all duration-300 ${
          scrolled ? "bg-background/95" : "bg-background/85"
        }`}
      >
        {/* Linha principal: menu+Boring, assinatura, lua+controles. Só
            recolhe (max-h-0) na combinação específica mobile+home+Boring,
            antes da seção Sobre (ver comentário no topo do arquivo); fora
            disso fica sempre com altura normal, e no mobile o CONTEÚDO de
            cada coluna troca conforme heroMini (abaixo). No desktop, lg:
            desfaz o recolhimento e o overflow-hidden que o mobile usa,
            senão o cabeçalho ficava inclicável lá mesmo com altura normal. */}
        <div
          className={`${heroMini ? "flex justify-between" : "grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]"} items-center gap-2 overflow-hidden px-6 transition-all duration-300 sm:px-12 lg:flex lg:justify-normal lg:max-h-none lg:gap-8 lg:overflow-visible lg:opacity-100 lg:pointer-events-auto xl:px-20 ${
            rowVisible
              ? "max-h-20 min-h-14 py-3 opacity-100"
              : "pointer-events-none max-h-0 py-0 opacity-0"
          } ${scrolled ? "lg:py-2" : "lg:py-3"}`}
        >
          <div className="flex items-center gap-4 justify-self-start">
            {/* Desktop: Modo Boring e menu sempre juntos, sem alternância,
                cópias próprias (nunca fazem parte do crossfade mobile
                abaixo). */}
            <div className="hidden lg:flex">
              <BoringToggle
                dict={dict}
                showTooltip
                dismissTooltip={pastFirstFold}
              />
            </div>
            <div className="hidden lg:flex">
              <SiteMenu locale={locale} dict={dict} />
            </div>
            {/* Mobile: crossfade entre Modo Boring (hero, assume o lugar do
                menu) e o menu de verdade (fora da hero). mode="popLayout"
                tira quem está saindo do fluxo assim que a saída começa, pra
                quem está entrando ocupar o lugar sem os dois brigarem por
                espaço no meio da transição (os dois têm larguras bem
                diferentes). Duração e curva batem com a da lua
                (HEADER_SWAP_TRANSITION): as duas coisas se movem juntas. */}
            <div className="relative flex items-center lg:hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                {heroMini ? (
                  <motion.div
                    key="boring-mini"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <BoringToggle dict={dict} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu-mobile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <SiteMenu locale={locale} dict={dict} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="relative justify-self-center lg:order-first">
            {/* Desktop: assinatura sempre visível, cópia própria (nunca faz
                parte do crossfade mobile abaixo). */}
            <Link
              href={`/${locale}/`}
              className="wordmark hidden whitespace-nowrap lg:block"
            >
              {profile.name}
            </Link>
            {/* Mobile: crossfade entre a lua (hero, entre Modo Boring e
                idioma) e a assinatura (fora da hero). A lua usa layoutId
                compartilhado com a cópia do canto direito (abaixo): as duas
                NUNCA ficam montadas ao mesmo tempo (um `if` de verdade, não
                CSS escondendo uma das duas), então o Framer reconhece a
                saída de uma e a entrada da outra como o MESMO elemento
                mudando de lugar, e anima a migração em vez de cortar
                direto. A assinatura, sem layoutId (não migra, só aparece/
                desaparece), crossfade simples no mesmo grupo.

                flex items-center aqui (e nos outros dois wrappers deste
                crossfade mobile, BoringToggle/menu e idioma/lua): a lua é
                um <button> desde que virou o seletor de tema (ver
                MoonPhase.tsx), e <button> não ganha o mesmo display:block
                que o preflight do Tailwind já dá a <svg>. Sem isso, o
                navegador tratava o botão como conteúdo inline dentro de um
                <div> comum, e reservava a altura de uma LINHA de texto
                inteira ao redor dele (a "tira" invisível do line-height
                herdado), maior que os 20px do próprio botão: a lua
                acabava ancorada no topo dessa tira, alguns pixels mais
                baixo que o resto da barra, em vez de centralizada. */}
            <div className="relative flex items-center lg:hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                {heroMini ? (
                  <motion.div
                    key="moon-mini"
                    layoutId="mobile-header-moon"
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <MoonPhase className="h-5 w-5" label={dict.controls.theme} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="wordmark-mobile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <Link href={`/${locale}/`} className="wordmark whitespace-nowrap">
                      {profile.name}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-self-end lg:ml-auto">
            {/* Desktop: tema/som/idioma e lua sempre visíveis, cópias
                próprias (nunca fazem parte do crossfade mobile abaixo). */}
            <div className="hidden lg:flex">
              <ControlBar locale={locale} dict={dict} />
            </div>
            <MoonPhase
              className="hidden h-5 w-5 lg:block"
              label={dict.controls.theme}
            />
            {/* Mobile: crossfade entre idioma (hero, no lugar do tema, que só
                existe dentro do menu) e a lua migrada do centro (mesma
                layoutId da cópia de lá, ver comentário acima). */}
            <div className="relative flex items-center lg:hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                {heroMini ? (
                  <motion.div
                    key="locale-mini"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <LocaleSwitcher locale={locale} dict={dict} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon-normal"
                    layoutId="mobile-header-moon"
                    transition={HEADER_SWAP_TRANSITION}
                  >
                    <MoonPhase className="h-5 w-5" label={dict.controls.theme} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Segunda linha: só em Modo Boring, Modo Boring e idioma (a única
            volta possível sem menu). Só no mobile (no desktop os dois já
            cabem na primeira linha) e sempre presente enquanto o modo dura,
            em qualquer scroll. Mesmo mecanismo de recolhimento da primeira
            linha (max-height, e não translate/opacity, que não devolvem o
            espaço reservado no fluxo), inclusive a borda, que sai junto: uma
            borda de 1px sozinha sobre a borda inferior do cabeçalho leria
            como um risco duplo. Nunca mostra tooltip: é uma tarja estreita,
            sem espaço sobrando pra bolha, e enquanto ela existe o Modo
            Boring é o único controle já autoexplicativo ali. */}
        <div
          className={`overflow-hidden transition-all duration-300 lg:hidden ${
            boringRowVisible
              ? "max-h-28 border-t border-line py-2 opacity-100"
              : "pointer-events-none max-h-0 py-0 opacity-0"
          }`}
        >
          <div className="flex flex-row flex-wrap items-center justify-center gap-3 px-6">
            <BoringToggle dict={dict} />
            <LocaleSwitcher locale={locale} dict={dict} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      {/* No mobile, na home, o rodapé de texto some: a foto que se distorce
          do Contato (InteractiveGridImage) já fecha a página sozinha, e
          repetir "feito à mão" mais o ano logo abaixo dela era só mais uma
          linha depois do último gesto da seção. Some só aí (`isHome`,
          calculado acima): nas páginas de case, sem uma imagem de fechamento
          própria, o rodapé continua a referência de fim de página de
          sempre, em qualquer largura. */}
      <footer
        className={`no-print ${isHome ? "hidden sm:flex" : "flex"} flex-col flex-wrap items-center justify-center gap-4 border-t border-line px-6 py-14 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-12 xl:px-20`}
      >
        <p className="type-mono text-muted">{dict.footer.rights}</p>
        <p className="type-mono text-muted">
          {new Date().getFullYear()} · {profile.name}
        </p>
      </footer>
    </div>
  );
}
