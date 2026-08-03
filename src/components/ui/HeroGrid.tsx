"use client";

import { motion } from "framer-motion";

// Fundo da hero: as colunas do próprio layout, visíveis. Nenhuma textura,
// nenhum gradiente, nenhum ornamento: só fios de um pixel nas divisões da
// grade que o resto do site já usa em silêncio, alinhados ao `.gutter` (por
// isso o contêiner externo carrega a classe e o interno é que hospeda as
// linhas: absolute resolve contra a padding box do ancestral, então sem essa
// casca a primeira linha nasceria colada na borda da tela em vez de na borda
// do conteúdo).
//
// A escolha é de direção de arte, não de decoração: o site é de um design
// engineer, e a grade é a estrutura por trás de toda composição. Deixá-la
// aparecer é mostrar o esqueleto, não vestir o fundo. Uma tentativa anterior
// (textura de papel, ver git) foi na direção oposta, superfície em vez de
// estrutura, e foi revertida.
//
// bg-current, e não uma cor fixa: dentro da lente da hero a regra de
// `.lens-invert *` força `color: var(--background)`, então a grade inverte
// junto com o texto sem precisar de uma segunda versão. Dentro do círculo as
// linhas viram claras sobre tinta, de graça.
//
// A entrada é escalonada da esquerda pra direita, cada linha crescendo do
// topo pra baixo: a grade se desenha, como numa prancheta, no mesmo compasso
// em que o nome sobe. A cópia dentro da lente (`mirrored`) entra pronta,
// mesmo critério do resto da hero.

/** Colunas no desktop. No mobile as linhas ímpares somem (`hidden sm:block`),
 *  então a mesma marcação vira quatro colunas em tela estreita, sem hook de
 *  media query e sem risco de descompasso entre o HTML do servidor e o do
 *  cliente. */
const COLUMNS = 8;

/** Alturas onde as marcas de registro cruzam as colunas. As linhas
 *  horizontais em si não são desenhadas: só o cruzamento, como numa planta
 *  técnica. A grade inteira desenhada viraria papel quadriculado, e aí sim
 *  seria textura de fundo, exatamente o que já foi tentado e revertido. */
const REGISTRY_ROWS = [0.28, 0.5, 0.72];

export function HeroGrid({ mirrored }: { mirrored?: boolean }) {
  /** Comum às linhas e às marcas: as duas nascem da mesma coluna, então a
   *  regra de quem some no mobile também é a mesma. */
  const hiddenOnMobile = (column: number) => (column % 2 ? "hidden sm:block" : "block");

  /** A última coluna ancora pela direita: `left: 100%` começaria no pixel
   *  seguinte à borda do conteúdo, ou seja, fora dela. */
  const columnAnchor = (column: number) =>
    column === COLUMNS
      ? { right: 0 }
      : { left: `${(column / COLUMNS) * 100}%` };

  return (
    <div
      aria-hidden
      className="gutter no-print pointer-events-none absolute inset-0"
    >
      <div className="hero-grid relative h-full w-full">
        {Array.from({ length: COLUMNS + 1 }, (_, column) => (
          <motion.span
            key={`line-${column}`}
            className={`absolute top-0 h-full w-px origin-top bg-current ${hiddenOnMobile(column)}`}
            style={columnAnchor(column)}
            initial={mirrored ? undefined : { scaleY: 0 }}
            animate={mirrored ? undefined : { scaleY: 1 }}
            transition={
              mirrored
                ? undefined
                : {
                    duration: 1.2,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.2 + column * 0.06,
                  }
            }
          />
        ))}

        {/* Marcas de registro: o braço horizontal do cruzamento. O vertical
            já é a própria coluna passando por trás, então cada marca é um
            traço só, não uma cruz montada com dois elementos. Entram em fade
            depois das linhas terminarem de descer, senão o cruzamento
            apareceria antes de existir o que cruzar. */}
        {REGISTRY_ROWS.map((row) =>
          Array.from({ length: COLUMNS + 1 }, (_, column) => (
            <motion.span
              key={`tick-${row}-${column}`}
              className={`hero-tick absolute h-px w-2.5 bg-current sm:w-3 ${
                column === COLUMNS ? "hero-tick-end" : ""
              } ${hiddenOnMobile(column)}`}
              style={{ ...columnAnchor(column), top: `${row * 100}%` }}
              initial={mirrored ? undefined : { opacity: 0 }}
              animate={mirrored ? undefined : { opacity: 1 }}
              transition={
                mirrored
                  ? undefined
                  : {
                      duration: 0.6,
                      ease: "easeOut",
                      delay: 0.9 + column * 0.04,
                    }
              }
            />
          )),
        )}
      </div>
    </div>
  );
}
