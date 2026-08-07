import type { Testimonial } from "./types";

// Dados fictícios, só pra desenhar o bloco (pedido do Armando, ver PR).
// Nomes, cargos e as "empresas" (Traço Coletivo, Estúdio Alameda) não
// existem, são os mesmos nomes fictícios usados na experiência mock de
// profile.ts. Trocar por depoimentos reais e autorizados antes de publicar,
// mesmo critério das métricas ilustrativas dos cases (ver docs/tom-de-voz.md):
// o disclaimer visível no bloco (Testimonials.tsx) some junto.

export const testimonials: Testimonial[] = [
  {
    id: "bruno-andrade",
    quote: {
      pt: "Entrega rápido e sem perder o cuidado com o detalhe. Rodou o design system inteiro sozinho e a equipe toda passou a usar sem reclamar.",
      en: "Ships fast without losing care for detail. Built the whole design system solo and the team adopted it without complaints.",
      es: "Entrega rápido sin perder el cuidado por el detalle. Armó todo el design system solo y el equipo lo adoptó sin quejas.",
      zh: "交付很快，也不失细节把控。独自搭建了整套设计系统，团队都愿意用。",
    },
    name: "Bruno Andrade",
    role: {
      pt: "Product Manager, Traço Coletivo",
      en: "Product Manager, Traço Coletivo",
      es: "Product Manager, Traço Coletivo",
      zh: "产品经理，Traço Coletivo",
    },
    mock: true,
  },
  {
    id: "carla-nogueira",
    quote: {
      pt: "Traduz pedido vago em tela funcionando melhor do que a gente sabia pedir. E ainda explica o porquê de cada decisão.",
      en: "Turns a vague ask into a working screen better than we knew how to ask for. And explains the reasoning behind every decision.",
      es: "Convierte un pedido vago en una pantalla funcionando mejor de lo que sabíamos pedir. Y explica el porqué de cada decisión.",
      zh: "能把模糊的需求变成比我们预想更好的成品，还会解释每个决定背后的原因。",
    },
    name: "Carla Nogueira",
    role: {
      pt: "Head de Design, Estúdio Alameda",
      en: "Head of Design, Estúdio Alameda",
      es: "Head de Diseño, Estúdio Alameda",
      zh: "设计负责人，Estúdio Alameda",
    },
    mock: true,
  },
  {
    id: "felipe-rocha",
    quote: {
      pt: "Um dos poucos designers que também escreve código de verdade. Isso muda a conversa inteira com o time de engenharia.",
      en: "One of the few designers who also writes real code. That changes the whole conversation with the engineering team.",
      es: "Uno de los pocos diseñadores que también escribe código de verdad. Eso cambia toda la conversación con el equipo de ingeniería.",
      zh: "少有的既懂设计又会写正经代码的人，这让和工程团队的沟通完全不一样。",
    },
    name: "Felipe Rocha",
    role: {
      pt: "Tech Lead, Traço Coletivo",
      en: "Tech Lead, Traço Coletivo",
      es: "Tech Lead, Traço Coletivo",
      zh: "技术负责人，Traço Coletivo",
    },
    mock: true,
  },
];
