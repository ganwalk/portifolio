import { useEffect, useState } from "react";
import * as THREE from "three";

// Textura de vídeo própria, sem depender do `useVideoTexture` do drei (que
// integra com Suspense e, sem os codecs/CORS esperados, ficava preso no
// fallback pra sempre em vez de resolver ou falhar visivelmente). Aqui o
// elemento <video> é nosso, criado uma vez por src, e a textura só existe
// depois que ele existe: sem Suspense, um null enquanto isso é tratado no
// chamador (mostra um material liso, ou melhor, o poster, até o vídeo estar
// pronto, ver VideoScreen em VintageTVScene.tsx).
//
// `ready` separado de `texture`: a textura já existe (o objeto THREE.Texture
// em si) assim que o <video> nasce, mas os PIXEIS dela só valem alguma coisa
// depois que esse vídeo carrega um quadro de verdade (evento `loadeddata`).
// Sem essa distinção, uma rede lenta ou um formato sem suporte deixava a
// tela preta até o quadro chegar (ou pra sempre, se nunca chegasse), em vez
// de mostrar o poster nesse meio tempo.
export function useSkeuoVideoTexture(
  src: string,
  { loop = true, autoplay = true }: { loop?: boolean; autoplay?: boolean } = {},
) {
  const [texture, setTexture] = useState<THREE.VideoTexture | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = document.createElement("video");
    video.src = src;
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = loop;
    video.playsInline = true;
    video.preload = "auto";

    const videoTexture = new THREE.VideoTexture(video);
    videoTexture.colorSpace = THREE.SRGBColorSpace;
    videoTexture.minFilter = THREE.LinearFilter;
    videoTexture.magFilter = THREE.LinearFilter;

    function onReady() {
      setReady(true);
    }
    video.addEventListener("loadeddata", onReady);

    // A textura só existe depois que o <video> (recurso externo, criado
    // aqui dentro) existe: não tem como computar isso durante o render, nem
    // ler de fora do efeito, então o setState síncrono aqui é o próprio
    // ponto do padrão (criar o recurso e só então liberar o valor pro
    // componente), não um substituto de algo que já dava pra derivar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTexture(videoTexture);
    if (autoplay) {
      video.play().catch(() => {
        // Autoplay bloqueado (raro, com muted+playsInline): a textura
        // continua existindo, só fica parada no primeiro quadro até
        // alguém interagir. Não é um erro que precise de tratamento
        // visível.
      });
    }

    return () => {
      video.removeEventListener("loadeddata", onReady);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoTexture.dispose();
      setTexture(null);
      setReady(false);
    };
  }, [src, loop, autoplay]);

  return { texture, ready };
}
