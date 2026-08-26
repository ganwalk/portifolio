"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

// Portado de ganwalk/intranet, src/components/widgets/FaqDuvidas.tsx:
// mesmas três perguntas reais do produto, mesmo comportamento "single
// collapsible" (só uma aberta por vez). A versão real usa Accordion do
// Radix (ausente neste site); aqui o mesmo efeito (altura animada,
// seta que gira) sai só com useState e framer-motion, já uma
// dependência do projeto.

const faqItems = [
  { q: "O que está incluso?", a: "Acesso completo à plataforma de simulações e todos os módulos disponíveis." },
  { q: "Posso cancelar a qualquer momento?", a: "Sim, sem multas ou taxas adicionais. O cancelamento é imediato." },
  { q: "Como funciona o suporte?", a: "Suporte via chat, e-mail e comunidade exclusiva de alunos." },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-xl border bg-[hsl(var(--card))] p-5">
      {faqItems.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className={i > 0 ? "border-t border-[hsl(var(--border))]" : ""}>
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              className="flex w-full items-center justify-between gap-3 py-4 text-left text-sm font-semibold text-[hsl(var(--ig-foreground))]"
            >
              {item.q}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))] transition-transform duration-200"
                style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
              />
            </button>
            <AnimatePresence initial={false}>
              {open && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <p className="pb-4 text-sm text-[hsl(var(--muted-foreground))]">{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
