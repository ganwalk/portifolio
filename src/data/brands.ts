import { MarkRings, MarkPeaks, MarkFacet } from "@/components/ui/icons/PlaceholderMarks";
import type { Brand } from "./types";

// basePath não é aplicado a src montado à mão em JS (só a next/image e
// links internos do próprio Next): o mesmo motivo do CONTACT_IMAGE em
// Contact.tsx.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Marcas reais primeiro (logo de verdade, ver scripts/build-brand-logos.mjs
// para a origem de cada arquivo), depois três marcas abstratas (`mark`, ver
// PlaceholderMarks.tsx), terminando no convite ("Sua marca"): quem rola o
// carrossel até o fim vê que a lista está aberta, não fechada. As marcas
// abstratas não têm nome de empresa nenhum atrás, de propósito: um nome
// fictício ao lado de logos reais lia como afirmação de cliente de verdade.
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
    name: { pt: "Marca reservada", en: "Reserved slot", es: "Marca reservada", zh: "预留位置" },
    mark: MarkRings,
  },
  {
    name: { pt: "Marca reservada", en: "Reserved slot", es: "Marca reservada", zh: "预留位置" },
    mark: MarkPeaks,
  },
  {
    name: { pt: "Marca reservada", en: "Reserved slot", es: "Marca reservada", zh: "预留位置" },
    mark: MarkFacet,
  },
  {
    name: { pt: "Sua marca", en: "Your brand", es: "Tu marca", zh: "你的品牌" },
    isInvite: true,
  },
];
