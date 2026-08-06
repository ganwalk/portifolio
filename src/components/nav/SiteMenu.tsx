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
// links em tipografia gigante, um por caixa, separadas por linhas finas
// (border-line, o mesmo fio de 1px do resto do site). Passar o mouse numa
// caixa inverte o tema só ali dentro: fundo vira tinta (--foreground), rótulo
// e a descrição da seção viram papel (--background), a mesma troca de lugar
// que a lente da Hero já faz (ver .lens-invert em globals.css), só que
// sólida, sem borda difusa nem desfoque, porque aqui é a caixa inteira que
// vira o disco, não um círculo recortado. Nenhuma cor entra na conta: o
// "destaque" é preto e branco trocando de posição, mesma regra do resto do
// site (ver Cores em docs/architecture.md).
//
// O fundo entra como um wipe (scaleX, ancorado à esquerda) atrás do texto,
// não um fade: dá direção ao gesto, como se a caixa fosse "pintada" da
// esquerda pra direita. A descrição segue um instante depois (delay-100),
// então a caixa nunca pula direto pro estado final, sempre atravessa fundo
// sem descrição antes de fundo com descrição, do jeito que foi pedido. Os
// rótulos vão na Whyte Inktrap (.type-inktrap), a mesma dos outros destaques
// do site. No Modo Boring o menu não existe: a página utilitária é uma
// coluna só.

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

  const items = [
    { id: "work", label: dict.nav.work, description: dict.nav.menuDescriptions.work },
    {
      id: "playground",
      label: dict.playground.title,
      description: dict.nav.menuDescriptions.playground,
    },
    { id: "about", label: dict.nav.about, description: dict.nav.menuDescriptions.about },
    { id: "contact", label: dict.nav.contact, description: dict.nav.menuDescriptions.contact },
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
                      {/* A caixa: group aqui, não no Link, porque é ela quem
                          define a área de hover e quem corta o wipe do fundo
                          (overflow-hidden). border-y só na primeira, border-b
                          nas demais: a borda de baixo de uma caixa já serve de
                          borda de cima da próxima, sem linha dobrada onde elas
                          se tocam. */}
                      <div
                        className={`group relative overflow-hidden border-line ${
                          index === 0 ? "border-y" : "border-b"
                        }`}
                      >
                        {/* Fundo do hover: entra como um wipe (scaleX a partir
                            da esquerda), não um fade, então o gesto tem
                            direção, como se a caixa fosse pintada da esquerda
                            pra direita. Tinta e papel trocando de lugar, a
                            mesma inversão da lente da Hero, aqui sólida e sem
                            desfoque: nenhuma cor entra na conta, só o tema
                            virando do avesso dentro da caixa. */}
                        <span
                          aria-hidden
                          className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-foreground transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-within:scale-x-100"
                        />
                        <Link
                          href={`/${locale}/#${item.id}`}
                          className="relative z-10 flex items-baseline gap-4 py-1"
                          onClick={() => toggle(false)}
                        >
                          <span className="type-mono text-muted transition-colors duration-500 group-hover:text-background group-focus-within:text-background">
                            0{index + 1}
                          </span>
                          {/* 11vw no mobile, e não os 13vw do desenho antigo: a
                              Whyte Black é cerca de 10% mais larga que a fonte
                              de manchete que estava aqui, e o rótulo mais longo
                              ("Fora do expediente" em português) passava da
                              borda direita numa tela estreita. Do sm pra cima
                              sobra espaço de sobra e o corpo continua o mesmo. */}
                          <span className="type-display type-inktrap text-[11vw] leading-none text-foreground transition-colors duration-500 group-hover:text-background group-focus-within:text-background sm:text-[7vw]">
                            {item.label}
                          </span>
                          {/* Descrição: some no mobile (não existe hover de
                              verdade em toque, e não sobra largura ao lado do
                              rótulo gigante empilhado). Entra um instante
                              depois do fundo (delay-100), então a caixa
                              sempre atravessa "fundo sem descrição" antes de
                              "fundo com descrição", nunca pula direto pro
                              estado final. group-focus-within, e não só
                              group-hover: quem navega por teclado (Tab) põe
                              foco no Link, não passa o mouse, e precisa da
                              mesma revelação. */}
                          <span className="type-mono ml-auto hidden max-w-[16rem] translate-x-3 text-right text-background opacity-0 transition-all duration-500 delay-100 ease-out group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100 lg:block">
                            {item.description}
                          </span>
                        </Link>
                      </div>
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
