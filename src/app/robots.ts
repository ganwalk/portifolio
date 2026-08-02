import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Export estático (output: "export") exige isso explícito nesta versão do
// Next: sem ele o build falha, mesmo o arquivo não tendo nada de dinâmico.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
