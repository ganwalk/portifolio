"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { BoringToggle } from "@/components/controls/BoringToggle";
import { ControlBar } from "@/components/controls/ControlBar";
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
// colunas, com a assinatura centralizada; no desktop vira flex e a assinatura
// vai para a frente da fila (order-first), com o segundo cluster empurrado
// para a direita. No mobile a mesa de controle (tema/som/idioma) mora dentro
// do menu; no desktop ela se divide nos dois clusters da própria barra. Ao
// rolar, a barra encorpa (fundo mais sólido) para não sumir sobre as mídias.
// Some por completo na impressão.
//
// O Modo Boring é o único controle com uma segunda linha própria no mobile,
// e ela dura só o tempo da hero: é a oferta de saída feita de cara, na
// primeira dobra da home, quando a pessoa ainda está decidindo se quer a
// experiência lúdica ou o currículo direto. Passada a hero, quem ficou já
// escolheu ficar, e a linha extra viraria uma tarja permanente roubando
// altura de tela estreita a cada rolagem. A partir daí o botão mora dentro
// do menu, junto de tema e idioma (veja SiteMenu), que no mobile já é a
// gaveta de todos os controles. Fora da home, onde não existe hero, a
// segunda linha nem chega a aparecer: o botão nasce direto no menu. No
// desktop ela também não existe, lá o botão cabe folgado na primeira linha,
// junto do menu.
//
// A troca das duas linhas é sincronizada no mesmo ponto de scroll: no mobile,
// na home em Modo Criativo, o cabeçalho começa "reduzido" (só a linha do
// Modo Boring, sem tooltip) e a primeira linha (menu, assinatura, lua) fica
// recolhida, deixando a hero ocupar a primeira dobra quase sozinha. Passada
// a altura da tela, elas se revezam: a primeira linha abre e a segunda
// fecha, então o cabeçalho nunca mostra as duas ao mesmo tempo, e a saída
// para o Modo Boring nunca fica órfã (ela some junto com o aparecimento do
// menu que passa a guardá-la). No desktop a primeira linha é sempre visível,
// em qualquer página e desde o primeiro pixel: lá o espaço sobra, esconder a
// barra só tira acesso sem ganhar nada em troca. Em Modo Boring fora da
// home, a primeira linha também é sempre visível, em qualquer largura: sem
// hero para esconder atrás.
//
// Em Modo Boring a segunda linha é a exceção que continua sempre presente,
// em qualquer página e qualquer scroll: lá o menu não existe (a página
// utilitária é uma coluna só, veja SiteMenu), então sem essa linha não
// sobraria porta nenhuma de volta para o Modo Criativo.
//
// No mobile, na home em Modo Boring, a primeira linha some pelo mesmo
// motivo oposto: a própria BoringView já abre com o nome como H1 do próprio
// conteúdo (o "cabeçalho de currículo"), então repetir a assinatura na barra
// fixa no mesmo instante é redundância pura numa tela estreita. A linha
// reaparece assim que o scroll alcança a seção "Sobre" (`#about`, logo
// abaixo), o mesmo ponto em que a assinatura do documento já saiu da vista e
// a barra passa a ser a única referência de identidade na tela. No desktop
// a primeira linha continua sempre visível, mesmo critério de sobra de
// espaço do restante do cabeçalho.
//
// Na home em Modo Criativo o cabeçalho é `fixed`, não `sticky`: um elemento
// sticky reserva a própria altura no fluxo do documento mesmo com a primeira
// linha escondida via opacity/max-height (são propriedades visuais, não
// afetam a reserva de espaço do fixed), o que deixava uma tarja vazia no
// topo do mobile antes da hero aparecer. Fixed nunca reserva espaço, então a
// hero pode ocupar a tela inteira (100svh) e o cabeçalho flutua por cima
// dela o tempo todo, mesmo reduzido a uma linha. Fora da home (ou em
// Boring), continua sticky: essas páginas não têm hero e sempre dependeram
// do cabeçalho empurrando o conteúdo para baixo.

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

  const headerVisible = isBoringHome ? pastAbout : !isHomeHero || pastFirstFold;
  // Linha do Modo Boring no mobile: só enquanto a hero está na tela (home em
  // Modo Criativo, antes da primeira dobra passar). Em Modo Boring fica
  // sempre, é a única volta possível sem menu.
  const boringRowVisible = isBoringMode || (isHomeHero && !pastFirstFold);

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
        {/* Primeira linha: menu, assinatura, lua. No mobile, na home em Modo
            Criativo, começa recolhida (max-h-0) até o scroll passar da
            primeira dobra; max-height em vez de translate/opacity porque
            translate não retira o espaço reservado no fluxo, e aqui a linha
            é filha normal do flex-col (não teria como flutuar por cima da
            segunda linha sem empurrá-la). No desktop, ou fora dessa
            combinação específica de mobile+home+criativo, sempre expandida:
            lg:pointer-events-auto e lg:overflow-visible desfazem, só aí, o
            pointer-events-none e o overflow-hidden que a versão recolhida
            usa no mobile, senão o cabeçalho inteiro ficava inclicável e a
            tooltip cortada no desktop mesmo com max-height/opacity já
            revertidos por lg:max-h-none/lg:opacity-100. */}
        <div
          className={`grid grid-cols-[1fr_auto_1fr] items-center gap-2 overflow-hidden px-6 transition-all duration-300 sm:px-12 lg:flex lg:max-h-none lg:gap-8 lg:overflow-visible lg:opacity-100 lg:pointer-events-auto xl:px-20 ${
            headerVisible
              ? "max-h-20 py-3 opacity-100"
              : "pointer-events-none max-h-0 py-0 opacity-0"
          } ${scrolled ? "lg:py-2" : "lg:py-3"}`}
        >
          <div className="flex items-center gap-4 justify-self-start">
            <div className="hidden lg:flex">
              <BoringToggle
                dict={dict}
                showTooltip
                dismissTooltip={pastFirstFold}
              />
            </div>
            <SiteMenu locale={locale} dict={dict} />
          </div>

          <Link
            href={`/${locale}/`}
            className="wordmark justify-self-center whitespace-nowrap lg:order-first"
          >
            {profile.name}
          </Link>

          <div className="flex items-center gap-4 justify-self-end lg:ml-auto">
            <div className="hidden lg:flex">
              <ControlBar locale={locale} dict={dict} />
            </div>
            <MoonPhase className="h-5 w-5" />
          </div>
        </div>

        {/* Segunda linha: só o Modo Boring, só no mobile (no desktop já cabe
            na primeira linha), e só enquanto a hero está na tela, exceto em
            Modo Boring, onde fica sempre por falta de menu que a guarde.
            Mesmo mecanismo de recolhimento da primeira linha (max-height, e
            não translate/opacity, que não devolvem o espaço reservado no
            fluxo), inclusive a borda, que sai junto: uma borda de 1px sozinha
            sobre a borda inferior do cabeçalho leria como um risco duplo.
            Nunca mostra tooltip: é uma tarja estreita, sem espaço sobrando
            pra bolha, e enquanto ela existe é o único controle na tela, já
            autoexplicativo. */}
        <div
          className={`overflow-hidden transition-all duration-300 lg:hidden ${
            boringRowVisible
              ? "max-h-16 border-t border-line py-2 opacity-100"
              : "pointer-events-none max-h-0 py-0 opacity-0"
          }`}
        >
          <div className="flex justify-center px-6">
            <BoringToggle dict={dict} />
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {children}
      </main>

      <footer className="no-print flex flex-wrap items-center justify-between gap-4 border-t border-line px-6 py-14 sm:px-12 xl:px-20">
        <p className="type-mono text-muted">{dict.footer.rights}</p>
        <p className="type-mono text-muted">
          {new Date().getFullYear()} · {profile.name}
        </p>
      </footer>
    </div>
  );
}
