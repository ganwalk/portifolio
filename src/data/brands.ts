import type { Brand } from "./types";

// Marcas reais primeiro, depois placeholders explícitos, terminando no
// convite ("Sua marca"): quem rola o carrossel até o fim vê que a lista
// está aberta, não fechada. Nomes próprios não mudam de idioma; só o
// convite final traduz de verdade.

export const brands: Brand[] = [
  {
    name: { pt: "AUVP", en: "AUVP", es: "AUVP", zh: "AUVP" },
  },
  {
    name: { pt: "Minuto Indie", en: "Minuto Indie", es: "Minuto Indie", zh: "Minuto Indie" },
  },
  {
    name: { pt: "Hits Perdidos", en: "Hits Perdidos", es: "Hits Perdidos", zh: "Hits Perdidos" },
  },
  {
    name: {
      pt: "Defensoria Pública de Goiás",
      en: "Defensoria Pública de Goiás",
      es: "Defensoría Pública de Goiás",
      zh: "Defensoria Pública de Goiás",
    },
  },
  {
    name: { pt: "Estúdio Coletivo", en: "Estúdio Coletivo", es: "Estudio Colectivo", zh: "Estúdio Coletivo" },
  },
  {
    name: { pt: "Casa Verde", en: "Casa Verde", es: "Casa Verde", zh: "Casa Verde" },
  },
  {
    name: { pt: "Grupo Nortel", en: "Grupo Nortel", es: "Grupo Nortel", zh: "Grupo Nortel" },
  },
  {
    name: { pt: "Sua marca", en: "Your brand", es: "Tu marca", zh: "你的品牌" },
    isInvite: true,
  },
];
