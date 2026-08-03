"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ControlBar } from "@/components/controls/ControlBar";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Navegação lúdica: botão no cabeçalho abre um overlay de tela cheia com os
// links em tipografia gigante. Passar o mouse em cada link revela uma
// pré-visualização dentro das próprias letras (a imagem preenche o texto via
// background-clip: text, não flutua ao lado): duas cópias do mesmo rótulo
// empilhadas, a de baixo sempre visível, a de cima com a imagem recortada
// pela forma do texto, ganhando opacidade no hover. Os rótulos vão na Whyte
// Inktrap (.type-inktrap), a mesma dos outros destaques do site. No Modo
// Boring o menu não existe: a página utilitária é uma coluna só.

// Previews placeholder por seção. Sugestão de mídia real: um recorte de cada
// destino (colagem dos cases, foto do Armando no Sobre, textura de papel no
// Contato). Trocar é só apontar preview para a imagem final.
const PREVIEWS: Record<string, string> = {
  work: "https://images.pexels.com/videos/3129671/free-video-3129671.jpg?auto=compress&w=900",
  playground:
    "https://images.pexels.com/photos/164938/pexels-photo-164938.jpeg?auto=compress&cs=tinysrgb&w=900",
  about: "https://picsum.photos/seed/sobre-armando/900/675",
  contact: "https://picsum.photos/seed/contato-armando/900/675",
};

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
    { id: "work", label: dict.nav.work },
    { id: "playground", label: dict.playground.title },
    { id: "about", label: dict.nav.about },
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
                        className="group flex items-baseline gap-4 py-1"
                        onClick={() => toggle(false)}
                      >
                        <span className="type-mono text-muted">
                          0{index + 1}
                        </span>
                        {/* Duas cópias do rótulo empilhadas: a de baixo é o
                            texto normal, a de cima tem a preview da seção
                            recortada pela forma das próprias letras
                            (background-clip: text), invisível em repouso e
                            revelada no hover. A imagem "mora dentro" do
                            texto em vez de flutuar ao lado dele. */}
                        <span className="type-display type-inktrap relative inline-block text-[13vw] leading-none sm:text-[7vw]">
                          <span className="transition-opacity duration-500 ease-out group-hover:opacity-10">
                            {item.label}
                          </span>
                          <span
                            aria-hidden
                            className="pointer-events-none absolute inset-0 bg-cover bg-center bg-clip-text text-transparent opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
                            style={{ backgroundImage: `url(${PREVIEWS[item.id]})` }}
                          >
                            {item.label}
                          </span>
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                ))}
              </motion.nav>

              {/* No mobile, tema/som/idioma moram aqui dentro: a barra do
                  topo fica só com menu, assinatura e lua. O Modo Boring não
                  precisa de cópia aqui, já tem um botão flutuante sempre
                  visível (veja SiteFrame). No desktop tudo já vive na
                  própria barra, então some daqui para não duplicar. */}
              <div className="flex flex-wrap items-center gap-4 pb-6 lg:hidden">
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
