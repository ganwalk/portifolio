import type { NextConfig } from "next";

// Export estático: o site é servido como HTML puro (GitHub Pages hoje, qualquer host amanhã).
// NEXT_PUBLIC_BASE_PATH é definido apenas no build do GitHub Pages ("/portifolio");
// em dev e em hosts com domínio próprio, fica vazio.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
