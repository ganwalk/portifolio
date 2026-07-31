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
// em QUALQUER página (Boring incluso): depois de passar por dentro do menu
// hamburguer (visível demais escondido) e por um botão flutuante solto num
// canto (achado estranho), a linha extra ficou sendo o meio termo, sempre
// visível sem competir por espaço com menu, assinatura e lua na primeira
// linha. No desktop essa segunda linha não existe, o botão já cabe folgado
// na primeira, junto do menu.
//
// No mobile, na home em Modo Criativo, o cabeçalho começa "reduzido": só a
// segunda linha (o botão do Modo Boring, sem tooltip) fica visível, a
// primeira linha (menu, assinatura, lua) some até o scroll passar da altura
// da tela, e a hero fica livre pra ocupar a primeira dobra quase sozinha. A
// segunda linha nunca fica totalmente ausente: sem ela, sair do Modo
// Criativo exigiria abrir o menu primeiro, e essa é a única porta de saída
// de quem não quer ver nem uma animação. No desktop a primeira linha é
// sempre visível, em qualquer página e desde o primeiro pixel: lá o espaço
// sobra, esconder a barra só tira acesso sem ganhar nada em troca. Em Modo
// Boring, ou fora da home, a primeira linha também é sempre visível, em
// qualquer largura: sem hero para esconder atrás.
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

  const isHomeHero =
    !isBoringMode && (pathname === `/${locale}` || pathname === `/${locale}/`);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setPastFirstFold(window.scrollY > window.innerHeight * 0.9);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const headerVisible = !isHomeHero || pastFirstFold;

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
            <SiteMenu locale={locale} dict={dict} />
            <div className="hidden lg:flex">
              <BoringToggle
                dict={dict}
                showTooltip
                dismissTooltip={pastFirstFold}
              />
            </div>
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

        {/* Segunda linha: só o Modo Boring, sempre presente no mobile (em
            qualquer página, em qualquer modo), sumindo no desktop porque lá
            já cabe na primeira linha. Nunca mostra tooltip: é uma tarja
            estreita, sem espaço sobrando pra bolha, e é o único controle
            visível na tela reduzida pré rolagem, já autoexplicativo. */}
        <div className="flex justify-center border-t border-line px-6 py-2 lg:hidden">
          <BoringToggle dict={dict} />
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
