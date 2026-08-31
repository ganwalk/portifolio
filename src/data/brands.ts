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
    large: true,
  },
  {
    name: { pt: "Hits Perdidos", en: "Hits Perdidos", es: "Hits Perdidos", zh: "Hits Perdidos" },
    logo: `${basePath}/logos/hits-perdidos.webp`,
    large: true,
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
    // large: a logo original é bem menor que as outras dentro do próprio
    // arquivo (faixa de luminância mais estreita, ver comentário no topo de
    // build-brand-logos.mjs), o que já a deixava pesando menos no letreiro;
    // o mesmo tratamento de Minuto Indie/Hits Perdidos compensa.
    name: { pt: "Mais Saúde", en: "Mais Saúde", es: "Mais Saúde", zh: "Mais Saúde" },
    logo: `${basePath}/logos/mais-saude.webp`,
    large: true,
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
    name: { pt: "Boi Verde", en: "Boi Verde", es: "Boi Verde", zh: "Boi Verde" },
    logo: `${basePath}/logos/boi-verde.webp`,
  },
  {
    name: { pt: "Sua marca", en: "Your brand", es: "Tu marca", zh: "你的品牌" },
    isInvite: true,
  },
];
