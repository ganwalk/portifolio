"use client";

import { useState } from "react";
import { Check } from "lucide-react";

// Portado de ganwalk/intranet, src/components/widgets/TabelaPrecos.tsx:
// o toggle troca o grid de verdade (estado React), não duas imagens
// alternadas por CSS. Button/Badge do shadcn (não presentes neste site)
// viraram <button>/<span> com as mesmas classes de token.

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(" ");

interface Plan {
  name: string;
  price: string;
  paymentInfo: string;
  features: string[];
  featured?: boolean;
  featuredLabel?: string;
  discount?: string;
}

const individualPlans: Plan[] = [
  {
    name: "Plano Lorem",
    price: "R$ 000,00",
    paymentInfo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    features: ["Lorem ipsum dolor sit", "Consectetur adipiscing elit", "Sed do eiusmod tempor"],
  },
  {
    name: "Plano Ipsum",
    price: "R$ 000,00",
    paymentInfo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    features: ["Incididunt ut labore", "Dolore magna aliqua", "Ut enim ad minim veniam"],
  },
  {
    name: "Plano Dolor",
    price: "R$ 000,00",
    paymentInfo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    features: ["Quis nostrud exercitation", "Ullamco laboris nisi", "Aliquip ex ea commodo"],
  },
];

const pacotePlans: Plan[] = [
  {
    name: "Pacote Lorem + Ipsum",
    price: "R$ 000,00",
    paymentInfo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    discount: "00% OFF",
    features: ["Plano Lorem incluso", "Plano Ipsum incluso", "Duis aute irure dolor"],
  },
  {
    name: "Pacote Completo",
    price: "R$ 000,00",
    paymentInfo: "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    discount: "00% OFF",
    featured: true,
    featuredLabel: "Lorem ipsum",
    features: ["Plano Lorem incluso", "Plano Ipsum incluso", "Plano Dolor incluso"],
  },
];

export function PricingTable() {
  const [view, setView] = useState<"individual" | "pacotes">("individual");
  const plans = view === "individual" ? individualPlans : pacotePlans;

  return (
    <div>
      <div className="mb-6 flex justify-center">
        <div className="relative inline-flex w-full max-w-xs items-center rounded-xl border bg-[hsl(var(--ig-foreground)/0.05)] p-1">
          <div
            className={cx(
              "absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-lg bg-[hsl(var(--ig-foreground))] shadow-md transition-transform duration-300",
              view === "pacotes" ? "translate-x-[calc(100%+4px)]" : "translate-x-0",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.4,0,0.2,1)" }}
          />
          <button
            onClick={() => setView("individual")}
            className={cx(
              "relative z-10 flex-1 py-2.5 text-[12px] font-bold uppercase tracking-wider transition-colors duration-300",
              view === "individual" ? "text-[hsl(var(--ig-background))]" : "text-[hsl(var(--muted-foreground))]",
            )}
          >
            Individual
          </button>
          <button
            onClick={() => setView("pacotes")}
            className={cx(
              "relative z-10 flex-1 py-2.5 text-[12px] font-bold uppercase tracking-wider transition-colors duration-300",
              view === "pacotes" ? "text-[hsl(var(--ig-background))]" : "text-[hsl(var(--muted-foreground))]",
            )}
          >
            Pacotes
          </button>
        </div>
      </div>

      <div className={cx("grid gap-4 pt-4", view === "individual" ? "sm:grid-cols-3" : "mx-auto max-w-2xl sm:grid-cols-2")}>
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={cx(
              "relative flex flex-col rounded-xl border bg-[hsl(var(--ig-background)/0.6)] p-5",
              plan.featured ? "border-[hsl(var(--accent))] shadow-md" : "border-[hsl(var(--border))]",
            )}
          >
            {plan.featuredLabel && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[hsl(var(--primary))] px-4 py-1 text-[10px] font-black uppercase text-[hsl(var(--primary-foreground))] shadow-md">
                {plan.featuredLabel}
              </div>
            )}
            {plan.discount && (
              <span className="mb-2 w-fit rounded-full bg-[hsl(var(--ig-foreground))] px-2 py-0.5 text-[10px] font-bold uppercase text-[hsl(var(--ig-background))]">
                {plan.discount}
              </span>
            )}
            <h4 className="mb-2 text-lg font-extrabold text-[hsl(var(--ig-foreground))]">{plan.name}</h4>
            <span className="text-2xl font-black text-[hsl(var(--ig-foreground))]">{plan.price}</span>
            <div className="my-3 rounded-lg border-l-[3px] border-[hsl(var(--accent))] bg-[hsl(var(--ig-foreground)/0.03)] px-3 py-2 text-xs text-[hsl(var(--muted-foreground))]">
              {plan.paymentInfo}
            </div>
            <ul className="mb-5 flex-grow space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2 text-[13px] text-[hsl(var(--muted-foreground))]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--accent))]" />
                  {feature}
                </li>
              ))}
            </ul>
            <button className="mt-auto w-full rounded-lg bg-[hsl(var(--primary))] py-2.5 text-sm font-bold text-[hsl(var(--primary-foreground))] transition-opacity hover:opacity-90">
              Começar agora
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
