"use client";

import { Marquee } from "./Marquee";

// Prévia da Intranet no cartão mobile (ver MobileCaseCard em CasesGrid.tsx):
// a coreografia de grade 3×3 com zoom e satélites deslizando (ver
// IntranetGridPreview.tsx, ainda usada no trio de desktop) não cabia bem
// num cartão bem mais alto que largo, cada célula pequena demais pra ler.
// Aqui, em vez de encolher a mesma grade, um carrossel vertical infinito:
// as nove pranchetas do Design System em coluna única, cada uma ocupando a
// largura toda do cartão, sempre passando uma de cada vez.
//
// Mesma técnica de letreiro do resto do site (ver Marquee.tsx), só que na
// vertical: duas cópias da coluna, uma embaixo da outra, andando de 0% a
// -50% pra sempre, sem costura no loop.

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const gridPath = (file: string) => `${basePath}/photos/intranet-grid/${file}`;

// Mesma proporção nativa da prancheta original usada em IntranetGridPreview
// (1166×724): sem essa aspect-ratio exata, o navegador só sabe a altura de
// cada célula depois de carregar a imagem, deslocando o resto da coluna.
const TILE_ASPECT = "1166/724";

// As mesmas nove pranchetas de IntranetGridPreview, mas em ordem numérica
// simples: o carrossel não tem centro nem satélites, então a ordem "conto
// de vídeo antigo" daquele componente não faz sentido aqui, todas as nove
// só precisam passar, uma de cada vez.
const CAROUSEL_TILES = [
  gridPath("ig-01.webp"),
  gridPath("ig-02.webp"),
  gridPath("ig-03.webp"),
  gridPath("ig-04.webp"),
  gridPath("ig-05.webp"),
  gridPath("ig-06.webp"),
  gridPath("ig-07.webp"),
  gridPath("ig-08.webp"),
  gridPath("ig-09.webp"),
];

export function IntranetMobileCarousel({ className = "" }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      <Marquee direction="vertical" durationSeconds={40} className="absolute inset-0">
        <div className="flex w-full flex-col gap-2">
          {CAROUSEL_TILES.map((src, i) => (
            <div
              key={i}
              className="w-full shrink-0 overflow-hidden border border-white/10 bg-black"
              style={{ aspectRatio: TILE_ASPECT }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" aria-hidden="true" className="h-full w-full object-contain" />
            </div>
          ))}
        </div>
      </Marquee>
    </div>
  );
}
