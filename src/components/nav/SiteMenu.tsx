"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BoringToggle } from "@/components/controls/BoringToggle";
import { ControlBar } from "@/components/controls/ControlBar";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Navegação lúdica: botão no cabeçalho abre um overlay de tela cheia com os
// links em tipografia gigante. Passar o mouse em cada link varre uma barra
// sólida por trás da linha inteira (bg-foreground, o mesmo preto/branco do
// resto do site, sem cor nova), invertendo rótulo e índice para a cor do
// fundo por cima dela (mesma lógica de hover já usada no Modo Boring, ver
// BoringToggle: bg-foreground + text-background), e revela ao lado uma frase
// curta contando do que aquela seção trata (dict.nav.menuDescriptions, só no
// lg: onde sobra largura ao lado do rótulo gigante). Os rótulos vão na Whyte
// Inktrap (.type-inktrap), a mesma dos outros destaques do site. No Modo
// Boring o menu não existe: a página utilitária é uma coluna só.

const listVariants = {
  open: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  closed: {},
};

const itemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
  closed: { y: "60%", opacity: 0 },
};

export function SiteMenu({
  locale,
  dict,
}: {
  locale: Locale;
  dict: Dictionary;
}) {
  const { isBoringMode } = useBoringMode();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  if (isBoringMode) return null;

  type MenuItemId = keyof Dictionary["nav"]["menuDescriptions"];
  const items: { id: MenuItemId; label: string }[] = [
    { id: "work", label: dict.nav.work },
    { id: "about", label: dict.nav.about },
    { id: "playground", label: dict.playground.title },
    { id: "contact", label: dict.nav.contact },
  ];

  const toggle = (next: boolean) => setOpen(next);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        className="type-mono cursor-pointer text-foreground transition-opacity hover:opacity-60"
        onClick={() => toggle(true)}
      >
        {dict.nav.menu}
      </button>

      {/* Portal para o body: o backdrop-blur do cabeçalho cria um containing
          block e prenderia o overlay fixed dentro da barra. Só existe depois
          da hidratação, no prerender estático não há document. */}
      {hydrated &&
        createPortal(
        <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-background"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="gutter flex h-full flex-col py-3">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="type-mono cursor-pointer text-foreground transition-opacity hover:opacity-60"
                  onClick={() => toggle(false)}
                >
                  {dict.nav.close}
                </button>
              </div>

              <motion.nav
                className="flex flex-1 flex-col justify-center"
                initial="closed"
                animate="open"
                exit="closed"
                variants={listVariants}
              >
                {items.map((item, index) => (
                  <div key={item.id} className="overflow-hidden">
                    <motion.div variants={itemVariants}>
                      <Link
                        href={`/${locale}/#${item.id}`}
                        className="group relative flex items-center gap-4 py-1"
                        onClick={() => toggle(false)}
                      >
                        {/* Barra sólida atrás da linha inteira, escondida
                            (scale-x-0) em repouso e varrendo da esquerda pra
                            direita no hover: bg-foreground, o mesmo
                            preto/branco do resto do site, nenhuma cor nova. */}
                        <span
                          aria-hidden
                          className="absolute inset-0 origin-left scale-x-0 bg-foreground transition-transform duration-500 ease-out group-hover:scale-x-100"
                        />
                        <span className="type-mono relative z-10 text-muted transition-colors duration-500 ease-out group-hover:text-background">
                          0{index + 1}
                        </span>
                        {/* 11vw no mobile, e não os 13vw do desenho antigo: a
                            Whyte Black é cerca de 10% mais larga que a fonte
                            de manchete que estava aqui, e o rótulo mais longo
                            de então passava da borda direita numa tela
                            estreita. Do sm pra cima sobra espaço de sobra e o
                            corpo continua o mesmo. */}
                        <span className="type-display type-inktrap relative z-10 text-[11vw] leading-none text-foreground transition-colors duration-500 ease-out group-hover:text-background sm:text-[7vw]">
                          {item.label}
                        </span>
                        {/* Frase curta contando do que a seção trata, revelada
                            junto da barra, na cor do fundo por cima dela.
                            Só no lg:, onde sobra largura ao lado do rótulo
                            gigante; em telas estreitas o rótulo já ocupa a
                            linha inteira. Sem .type-mono aqui de propósito
                            (mesmo critério do tooltip em BoringToggle): a
                            classe força caixa alta, e uma frase inteira em
                            versal lê pior que em caixa normal. Fonte mono só
                            no family. */}
                        <span className="relative z-10 ml-auto hidden max-w-xs self-center text-right font-mono text-xs tracking-wide text-background opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 lg:block">
                          {dict.nav.menuDescriptions[item.id]}
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                ))}
              </motion.nav>

              {/* No mobile, a mesa de controle inteira mora aqui dentro: a
                  barra do topo fica só com menu, assinatura e lua. O Modo
                  Boring vem junto porque a linha própria dele no cabeçalho
                  dura só o tempo da hero (veja SiteFrame): passada a primeira
                  dobra, este é o único lugar onde ele existe no mobile, e por
                  isso abre o grupo, à frente de tema e idioma. Fecha o menu
                  no mesmo clique (onToggle): sem isso o overlay some da tela
                  (o componente inteiro para de renderizar em Modo Boring,
                  logo acima) mas o estado continua "aberto", a limpeza que
                  devolve a rolagem ao <html> nunca roda e a página do Modo
                  Boring abre travada, sem scroll. Não há animação de saída:
                  a cortina de troca de modo cobre a tela em seguida e o corte
                  não aparece. No desktop tudo já vive na própria barra, então
                  some daqui para não duplicar. */}
              <div className="flex flex-wrap items-center gap-4 pb-6 lg:hidden">
                <BoringToggle dict={dict} onToggle={() => toggle(false)} />
                <ControlBar locale={locale} dict={dict} />
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
