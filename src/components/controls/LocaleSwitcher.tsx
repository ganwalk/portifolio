"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { locales, localeNames, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

// Nav de troca de idioma. Vive em dois lugares: dentro de ControlBar
// (desktop, e mobile fora da hero, dentro do menu) e na linha extra da hero
// no mobile (ver SiteFrame). Mesma lógica de reescrita de path nos dois,
// então mora aqui, um lugar só pra manter.

export function LocaleSwitcher({
  locale,
  dict,
  className = "",
}: {
  locale: Locale;
  dict: Dictionary;
  className?: string;
}) {
  const pathname = usePathname();

  const switchLocalePath = (target: Locale) => {
    const rest = pathname.replace(new RegExp(`^/${locale}`), "");
    return `/${target}${rest || "/"}`;
  };

  return (
    <nav
      aria-label={dict.controls.language}
      className={`flex gap-2 ${className}`}
    >
      {locales.map((l) => (
        <Link
          key={l}
          href={switchLocalePath(l)}
          hrefLang={l}
          aria-current={l === locale ? "true" : undefined}
          className={`type-mono px-1 py-1.5 ${
            l === locale
              ? "text-foreground underline underline-offset-4"
              : "text-muted hover:text-foreground"
          }`}
          title={localeNames[l]}
        >
          {l.toUpperCase()}
        </Link>
      ))}
    </nav>
  );
}
