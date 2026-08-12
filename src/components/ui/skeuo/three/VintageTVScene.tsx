"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useSkeuoVideoTexture } from "@/components/ui/skeuo/three/useSkeuoVideoTexture";

// Cena WebGL da tevê vintage (ver VinylCrateScene.tsx pro raciocínio geral
// de renderizar só no cliente, via next/dynamic em VintageTV.tsx). O botão
// giratório mora em HTML por cima (VintageTV.tsx): esta cena só recebe o
// canal atual e o ângulo alvo do botão, e anima os dois a cada quadro.

type Channel =
  | { kind: "video"; src: string; poster: string }
  | { kind: "image"; src: string };

// Poster por baixo, vídeo por cima assim que o primeiro quadro chega (mesma
// camada dupla que MediaView já usa em HTML puro, ver components/ui/
// MediaView.tsx): rede lenta ou um formato sem suporte no navegador nunca
// deixam a telinha preta, só param no poster.
function VideoScreen({ src, poster }: { src: string; poster: string }) {
  const { texture, ready } = useSkeuoVideoTexture(src);
  const posterTexture = useLoader(THREE.TextureLoader, poster);
  return <meshBasicMaterial map={ready && texture ? texture : posterTexture} toneMapped={false} />;
}

function ImageScreen({ src }: { src: string }) {
  const texture = useLoader(THREE.TextureLoader, src);
  return <meshBasicMaterial map={texture} toneMapped={false} />;
}

// Meio-corpo da carcaça, args[2]/2 = 0.7: RoundedBox arredonda as quinas por
// dentro do tamanho nominal, então a face frontal de verdade (achatada) fica
// um pouco atrás do que esses 0.7 sugerem. Tudo que precisa aparecer NA
// frente (moldura, tela, botões) fica em z bem além disso (0.78+), de
// propósito, pra nunca correr o risco de nascer embutido na carcaça.
const BODY_HALF_DEPTH = 0.7;
const FRONT_Z = BODY_HALF_DEPTH + 0.1;

function Screen({ channel }: { channel: Channel }) {
  // A moldura (mesh logo abaixo, em TVBody) tem 0.1 de espessura centrada em
  // FRONT_Z, ou seja, sua própria face frontal já está em FRONT_Z + 0.05: a
  // tela precisa nascer ALÉM disso, senão fica embutida dentro da moldura e
  // some atrás dela, o mesmo bug que FRONT_Z já resolveu entre a moldura e a
  // carcaça (ver comentário ali em cima).
  return (
    <mesh position={[-0.55, 0.15, FRONT_Z + 0.08]}>
      <planeGeometry args={[1.7, 1.7]} />
      <Suspense fallback={<meshStandardMaterial color="#111111" />}>
        {channel.kind === "video" ? (
          <VideoScreen src={channel.src} poster={channel.poster} />
        ) : (
          <ImageScreen src={channel.src} />
        )}
      </Suspense>
    </mesh>
  );
}

function Knob({ targetAngle }: { targetAngle: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const lerp = 1 - Math.pow(0.001, delta);
    g.rotation.z += (targetAngle - g.rotation.z) * lerp;
  });
  return (
    <group ref={ref} position={[0.95, 0.55, FRONT_Z + 0.08]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.16, 24]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.13, 0.12]}>
        <boxGeometry args={[0.04, 0.02, 0.2]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
}

function TVBody() {
  return (
    <>
      <RoundedBox args={[3, 2.6, 1.4]} radius={0.22} smoothness={4} castShadow receiveShadow>
        <meshStandardMaterial color="#e7ddc4" roughness={0.55} />
      </RoundedBox>

      {/* Moldura escura da tela, um pouco à frente da carcaça. */}
      <mesh position={[-0.55, 0.15, FRONT_Z]}>
        <boxGeometry args={[1.9, 1.9, 0.1]} />
        <meshStandardMaterial color="#141414" roughness={0.4} />
      </mesh>

      {/* Antena em V. */}
      <mesh position={[-0.35, 1.65, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 1.3, 8]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.05, 1.65, 0]} rotation={[0, 0, -0.5]}>
        <cylinderGeometry args={[0.015, 0.015, 1.3, 8]} />
        <meshStandardMaterial color="#8a8a8a" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Pezinhos */}
      <mesh position={[-1.1, -1.42, 0.3]}>
        <boxGeometry args={[0.35, 0.16, 0.35]} />
        <meshStandardMaterial color="#3a3226" />
      </mesh>
      <mesh position={[1.1, -1.42, 0.3]}>
        <boxGeometry args={[0.35, 0.16, 0.35]} />
        <meshStandardMaterial color="#3a3226" />
      </mesh>
    </>
  );
}

function Scene({ channel, knobAngle }: { channel: Channel; knobAngle: number }) {
  return (
    <>
      <ambientLight intensity={0.75} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 1, -2]} intensity={0.3} />
      <TVBody />
      <Screen key={`${channel.kind}-${channel.src}`} channel={channel} />
      <Knob targetAngle={knobAngle} />
      <mesh position={[0.95, -0.15, FRONT_Z + 0.08]}>
        <boxGeometry args={[0.5, 0.18, 0.1]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.4} />
      </mesh>
    </>
  );
}

export default function VintageTVScene({
  channel,
  knobAngle,
}: {
  channel: Channel;
  knobAngle: number;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.2, 5.2], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Scene channel={channel} knobAngle={knobAngle} />
      </Suspense>
    </Canvas>
  );
}
