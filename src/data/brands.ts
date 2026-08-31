import type { Brand } from "./types";

// basePath não é aplicado a src montado à mão em JS (só a next/image e
// links internos do próprio Next): o mesmo motivo do CONTACT_IMAGE em
// Contact.tsx.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Só marcas reais (logo de verdade, ver scripts/build-brand-logos.mjs para
// a origem de cada arquivo), terminando no convite ("Sua marca"): quem rola
// o carrossel até o fim vê que a lista está aberta, não fechada. Já teve
// três marcas abstratas aqui (formas em currentColor, sem nome de empresa
// atrás, ver histórico de PlaceholderMarks.tsx) preenchendo o resto do
// letreiro: pedido explícito pra tirar, mesmo sem nome de cliente atrás
// elas liam como marca de verdade escondida atrás de um desenho genérico.
// Nomes próprios não mudam de idioma; só o convite final traduz de verdade.

export const brands: Brand[] = [
  {
    name: { pt: "AUVP", en: "AUVP", es: "AUVP", zh: "AUVP" },
    logo: `${basePath}/logos/auvp.webp`,
  },
  {
    name: { pt: "Minuto Indie", en: "Minuto Indie", es: "Minuto Indie", zh: "Minuto Indie" },
    logo: `${basePath}/logos/minuto-indie.webp`,
    size: "large",
  },
  {
    name: { pt: "Hits Perdidos", en: "Hits Perdidos", es: "Hits Perdidos", zh: "Hits Perdidos" },
    logo: `${basePath}/logos/hits-perdidos.webp`,
    size: "large",
  },
  {
    name: {
      pt: "Defensoria Pública de Goiás",
      en: "Defensoria Pública de Goiás",
      es: "Defensoría Pública de Goiás",
      zh: "Defensoria Pública de Goiás",
    },
    logo: `${basePath}/logos/defensoria-goias.webp`,
  },
  {
    // xl: a arte original ocupa só uma faixa estreita no meio do arquivo
    // (bastante margem transparente/branca em volta), então "large" ainda
    // saía pesando menos que o resto do letreiro; xl fecha a conta.
    name: { pt: "Mais Saúde", en: "Mais Saúde", es: "Mais Saúde", zh: "Mais Saúde" },
    logo: `${basePath}/logos/mais-saude.webp`,
    size: "xl",
  },
  {
    name: { pt: "Hapvida", en: "Hapvida", es: "Hapvida", zh: "Hapvida" },
    logo: `${basePath}/logos/hapvida.webp`,
  },
  {
    name: { pt: "Vivo Fibra", en: "Vivo Fibra", es: "Vivo Fibra", zh: "Vivo Fibra" },
    logo: `${basePath}/logos/vivo-fibra.webp`,
  },
  {
    // xl: mesmo raciocínio da Mais Saúde acima, margem própria generosa em
    // volta do selo circular e do nome.
    name: { pt: "Boi Verde", en: "Boi Verde", es: "Boi Verde", zh: "Boi Verde" },
    logo: `${basePath}/logos/boi-verde.webp`,
    size: "xl",
  },
  {
    name: { pt: "Sua marca", en: "Your brand", es: "Tu marca", zh: "你的品牌" },
    isInvite: true,
  },
];
