"use client";

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useSkeuoVideoTexture } from "@/components/ui/skeuo/three/useSkeuoVideoTexture";

// Cena WebGL da deck de fita (ver VinylCrateScene.tsx pro raciocínio geral
// de renderizar só no cliente). O play/pause mora em HTML por cima
// (TapeDeckScene.tsx): esta cena só lê `isPlaying` e reage, girando os
// rolos e tocando o mesmo vídeo do estúdio na telinha do console.

// Poster por baixo, vídeo por cima assim que o primeiro quadro chega (mesmo
// raciocínio de VideoScreen em VintageTVScene.tsx).
function Backdrop({ src, poster, isPlaying }: { src: string; poster: string; isPlaying: boolean }) {
  const { texture, ready } = useSkeuoVideoTexture(src, { autoplay: false });
  const posterTexture = useLoader(THREE.TextureLoader, poster);

  useEffect(() => {
    if (!texture) return;
    const video = texture.image as HTMLVideoElement;
    if (isPlaying) void video.play();
    else video.pause();
  }, [isPlaying, texture]);

  return (
    <mesh position={[0, 0.35, -0.05]}>
      <planeGeometry args={[1.3, 1]} />
      <meshBasicMaterial map={ready && texture ? texture : posterTexture} toneMapped={false} />
    </mesh>
  );
}

function Reel({ x, isPlaying }: { x: number; isPlaying: boolean }) {
  const spoolRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (isPlaying && spoolRef.current) {
      spoolRef.current.rotation.z -= delta * 2.4;
    }
  });

  return (
    // z = 0.5 (a metade do console é 0.35): claramente à frente da própria
    // caixa do console, não coincidindo com a face dela, senão os dois
    // planos se confundem (mesmo problema que a tela da tevê tinha, ver
    // FRONT_Z em VintageTVScene.tsx).
    <group position={[x, -0.55, 0.5]}>
      {/* Flange: aro fixo, não gira. */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.1, 32]} />
        <meshStandardMaterial color="#7a7a7a" roughness={0.35} metalness={0.6} />
      </mesh>
      {/* Carretel de fita: gira. Tudo aqui dentro nasce no plano XZ (o
          cilindro é ao longo do eixo Y por padrão), e só a rotação do GRUPO
          (Math.PI/2 em X) deita esse plano de frente pra câmera: um raio
          "pra fora" precisa variar em X e Z locais (não em Y, que vira
          profundidade depois da rotação do grupo). `rotation` sozinho não
          arrasta a posição de um raio em volta do centro, só gira a peça em
          torno do próprio eixo dela: cada raio precisa da posição já
          calculada por trigonometria (cosseno/seno do ângulo), a rotação
          aqui só alinha o comprido da peça com essa mesma direção. */}
      <group ref={spoolRef} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.5, 0.5, 0.11, 32]} />
          <meshStandardMaterial color="#241d16" roughness={0.8} />
        </mesh>
        {[0, 1, 2].map((i) => {
          const angle = (i * Math.PI * 2) / 3;
          const radius = 0.22;
          return (
            <mesh
              key={i}
              position={[radius * Math.cos(angle), 0.06, radius * Math.sin(angle)]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.34, 0.02, 0.08]} />
              <meshStandardMaterial color="#9a9a9a" />
            </mesh>
          );
        })}
        <mesh position={[0, 0.06, 0]}>
          <cylinderGeometry args={[0.14, 0.14, 0.03, 24]} />
          <meshStandardMaterial color="#c9c9c9" metalness={0.4} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Console({ isPlaying }: { isPlaying: boolean }) {
  return (
    <group position={[0, -0.3, 0.5]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[3.2, 1.7, 0.7]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.55} metalness={0.15} />
      </mesh>
      <Reel x={-0.85} isPlaying={isPlaying} />
      <Reel x={0.85} isPlaying={isPlaying} />
      <mesh position={[0, -0.55, 0.42]}>
        <boxGeometry args={[0.75, 0.02, 0.02]} />
        <meshStandardMaterial color="#0d0d0d" />
      </mesh>
    </group>
  );
}

function Scene({ src, poster, isPlaying }: { src: string; poster: string; isPlaying: boolean }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 1, -2]} intensity={0.3} />
      <Suspense fallback={null}>
        <Backdrop src={src} poster={poster} isPlaying={isPlaying} />
      </Suspense>
      <Console isPlaying={isPlaying} />
    </>
  );
}

export default function TapeDeckScene({
  src,
  poster,
  isPlaying,
}: {
  src: string;
  poster: string;
  isPlaying: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 4.6], fov: 34 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Scene src={src} poster={poster} isPlaying={isPlaying} />
    </Canvas>
  );
}
