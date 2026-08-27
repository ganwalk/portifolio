"use client";

import { useRef } from "react";
import { useNearViewport } from "@/lib/use-near-viewport";

// Iframe de verdade do projeto publicado (ver `demoUrl` em types.ts), no
// lugar das duas caixas de still ainda vazias: em vez de simular a
// experiência com vídeo, o visitante navega o site de verdade, aqui dentro
// do portfólio. Reaproveitado por CaseDetail (página própria do case) e
// ExpandedCase (overlay da home), os dois únicos lugares que mostram esse
// nível de detalhe.
//
// Só monta o <iframe> perto da viewport (useNearViewport, o mesmo gatilho
// que já guarda o vídeo de capa dos cards em CasesGrid): os três projetos de
// artista carregam WebGL, Three.js e áudio próprios, então três embutidos
// simultâneos custariam caro à toa se nunca chegassem a ficar visíveis.
// Nunca aparece na vitrine que rola sozinha (o cover continua vídeo/imagem
// ali): um iframe reagindo ao scroll do mouse ali brigaria com o scroll
// prendido da própria seção.
//
// Sem link "abrir em nova aba" próprio: essa fileira já mora padronizada
// no fim de toda página de case, ao lado do link do repositório (ver
// showOpenDemo em CaseDetail.tsx/CasesGrid.tsx), pra não duplicar o mesmo
// link duas vezes na mesma página.
export function LiveEmbed({
  url,
  title,
  className = "",
}: {
  url: string;
  title: string;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isNear = useNearViewport(wrapperRef);

  return (
    <div ref={wrapperRef} className={className}>
      <div className="aspect-video w-full overflow-hidden border border-line bg-surface">
        {isNear && (
          <iframe
            src={url}
            title={title}
            loading="lazy"
            className="h-full w-full"
            style={{ border: 0 }}
          />
        )}
      </div>
    </div>
  );
}
