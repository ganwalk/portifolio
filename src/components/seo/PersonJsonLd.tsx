import { profile } from "@/data/profile";
import { siteUrl } from "@/lib/site";
import type { Locale } from "@/i18n/config";

// Schema.org Person: o que faz o Google conseguir montar o card de
// identidade (nome, cargo, redes) na busca pelo nome do Armando, e
// desambiguar de outras pessoas com o mesmo nome.
export function PersonJsonLd({ locale }: { locale: Locale }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.role,
    url: `${siteUrl}/${locale}/`,
    email: `mailto:${profile.email}`,
    sameAs: [
      profile.links.github,
      profile.links.linkedin,
      profile.links.instagram,
    ],
    worksFor: {
      "@type": "Organization",
      name: "AUVP",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
