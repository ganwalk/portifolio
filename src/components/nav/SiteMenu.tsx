"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ControlBar } from "@/components/controls/ControlBar";
import { useBoringMode } from "@/contexts/BoringModeContext";
import { useSound } from "@/contexts/SoundContext";
import { useHydrated } from "@/lib/use-hydrated";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Navegação lúdica: botão no cabeçalho abre um overlay de tela cheia com os
// links em tipografia gigante. Passar o mouse em cada link revela uma imagem
// de preview flutuando ao lado, com leve rotação, clima de mesa de recortes.
// No Modo Boring o menu não existe: a página utilitária é uma coluna só.

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
  const { play } = useSound();
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

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

  const toggle = (next: boolean) => {
    play("toggle");
    setOpen(next);
    if (!next) setHovered(null);
  };

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        className="btn-tactile type-mono cursor-pointer rounded-md border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
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
            {/* Preview flutuante do link em foco, só em telas largas */}
            <div className="pointer-events-none absolute inset-0 hidden items-center justify-end pr-[8vw] lg:flex">
              <AnimatePresence mode="wait">
                {hovered && (
                  <motion.img
                    key={hovered}
                    src={PREVIEWS[hovered]}
                    alt=""
                    className="aspect-[4/3] w-[30vw] border border-line object-cover"
                    initial={{ opacity: 0, scale: 0.9, rotate: -4 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.96, rotate: 3 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                )}
              </AnimatePresence>
            </div>

            <div className="flex h-full flex-col px-4 py-3 sm:px-8">
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  className="btn-tactile type-mono cursor-pointer rounded-md border border-line px-3 py-1.5 transition-colors hover:bg-foreground hover:text-background"
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
                        onMouseEnter={() => {
                          setHovered(item.id);
                          play("tick");
                        }}
                        onMouseLeave={() => setHovered(null)}
                        onClick={() => toggle(false)}
                      >
                        <span className="type-mono text-muted">
                          0{index + 1}
                        </span>
                        <span className="type-display text-[13vw] leading-none transition-colors group-hover:text-accent sm:text-[7vw]">
                          {item.label}
                        </span>
                      </Link>
                    </motion.div>
                  </div>
                ))}
              </motion.nav>

              {/* No mobile a mesa de controle mora aqui: a barra do topo fica
                  só com menu, assinatura e lua. No desktop ela já vive na
                  barra, então some para não duplicar. */}
              <div className="pb-6 lg:hidden">
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
