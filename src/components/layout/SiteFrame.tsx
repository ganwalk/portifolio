"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
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
// nessa composição; passada a hero, [menu, Armando Custodio] entram e a lua
// migra pro canto direito, o arranjo padrão do resto do site (mesmo
// layoutId na lua nas duas composições, então ela literalmente desliza de
// um lugar pro outro em vez de sumir e reaparecer). Essa troca de conteúdo é
// exclusiva do mobile: no desktop a barra sempre mostra tudo de uma vez
// (Boring+menu à esquerda, tema/idioma+lua à direita), sobra espaço e
// esconder qualquer parte só tiraria acesso sem ganhar nada em troca. Fora
// da home, ou já em Modo Boring, o mobile também já nasce direto no arranjo
// padrão (menu, assinatura, lua à direita): a composição de hero só faz
// sentido junto da própria hero.
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
            {/* Desktop: Modo Boring e menu sempre juntos, sem alternância. */}
            <div className="hidden lg:flex">
              <BoringToggle
                dict={dict}
                showTooltip
                dismissTooltip={pastFirstFold}
              />
            </div>
            {/* Mobile, hero: o Modo Boring assume o lugar do menu, mesma
                oferta de saída que a segunda linha oferecia antes, agora
                dentro da própria barra. Nunca mostra tooltip: tarja
                estreita, sem espaço sobrando pra bolha. */}
            <div className={`lg:hidden ${heroMini ? "flex" : "hidden"}`}>
              <BoringToggle dict={dict} />
            </div>
            {/* Menu de verdade: sempre visível no desktop (sem alternância,
                junto do Modo Boring acima); no mobile só fora da hero. */}
            <div className={heroMini ? "hidden lg:flex" : "flex"}>
              <SiteMenu locale={locale} dict={dict} />
            </div>
          </div>

          <div className="relative justify-self-center lg:order-first">
            {/* Mobile, hero: a lua entra aqui, entre Modo Boring e idioma.
                layoutId compartilhado com a cópia do canto direito (abaixo),
                mas as duas NUNCA ficam montadas ao mesmo tempo (ao contrário
                de uma versão anterior, que escondia uma via CSS e deixava a
                outra sempre no DOM): esconder por CSS não passa pelo ciclo
                de montagem do React, e é exatamente esse ciclo que o Framer
                Motion observa pra disparar a animação de layout
                compartilhado. Com um "if" de verdade trocando qual das duas
                está montada, o Framer reconhece a saída de uma e a entrada
                da outra com o mesmo layoutId como o MESMO elemento mudando
                de lugar, e anima a transição em vez de cortar direto. */}
            {heroMini && (
              <motion.div layoutId="mobile-header-moon" className="lg:hidden">
                <MoonPhase className="h-5 w-5" />
              </motion.div>
            )}
            {/* Assinatura: sempre visível no desktop; no mobile, só fora da
                hero (heroMini troca o lugar dela pela lua, acima). */}
            <Link
              href={`/${locale}/`}
              className={`wordmark whitespace-nowrap lg:block ${heroMini ? "hidden" : "block"}`}
            >
              {profile.name}
            </Link>
          </div>

          <div className="flex items-center gap-4 justify-self-end lg:ml-auto">
            {/* Desktop: tema/som/idioma sempre visível, sem alternância. */}
            <div className="hidden lg:flex">
              <ControlBar locale={locale} dict={dict} />
            </div>
            {/* Mobile, hero: idioma no lugar do tema (que só existe dentro
                do menu, indisponível durante a hero de qualquer forma). */}
            <div className={`lg:hidden ${heroMini ? "block" : "hidden"}`}>
              <LocaleSwitcher locale={locale} dict={dict} />
            </div>
            {/* Mobile, fora da hero: a lua, migrada do centro (mesma
                layoutId da cópia de lá; ver comentário lá em cima sobre
                montar/desmontar de verdade, não só trocar visibilidade via
                CSS). Independente da cópia lg: abaixo, que nunca faz parte
                dessa troca. */}
            {!heroMini && (
              <motion.div layoutId="mobile-header-moon" className="lg:hidden">
                <MoonPhase className="h-5 w-5" />
              </motion.div>
            )}
            <MoonPhase className="hidden h-5 w-5 lg:block" />
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

      <footer className="no-print flex flex-col flex-wrap items-center justify-center gap-4 border-t border-line px-6 py-14 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left sm:px-12 xl:px-20">
        <p className="type-mono text-muted">{dict.footer.rights}</p>
        <p className="type-mono text-muted">
          {new Date().getFullYear()} · {profile.name}
        </p>
      </footer>
    </div>
  );
}
