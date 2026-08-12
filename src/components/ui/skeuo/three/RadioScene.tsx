"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useCenteredGLTF } from "@/components/ui/skeuo/three/useCenteredGLTF";

// Cena WebGL do rádio: modelo pronto, da "Furniture Kit" da Kenney (CC0, ver
// public/models/kenney-furniture-kit/LICENSE.txt), o mesmo pacote da tevê e
// da caixa de vinis (ver VintageTVScene.tsx e VinylCrateScene.tsx). Sem tela
// nem carretel pra animar (o modelo é uma malha só, sem partes soltas): o
// play/pause em HTML por cima (Radio.tsx) só liga um balanço leve no rádio
// inteiro e um equalizador de barras ao lado, o suficiente pra ler "tocando"
// sem inventar uma peça que o modelo não tem.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const RADIO_URL = `${basePath}/models/kenney-furniture-kit/radio.glb`;
const BAR_COUNT = 5;

function EqualizerBars({ size, isPlaying }: { size: THREE.Vector3; isPlaying: boolean }) {
  const barsRef = useRef<THREE.Group>(null);
  const phases = useRef(Array.from({ length: BAR_COUNT }, (_, i) => i * 0.7));

  const barHeight = size.y * 0.5;
  // Y de repouso da base de cada barra: o crescimento da altura precisa
  // manter essa base fixa (uma barra "crescendo" com o centro fixo em vez
  // da base pareceria flutuar, não pulsar de baixo pra cima).
  const baselineY = size.y * 0.32 - barHeight / 2;

  useFrame(({ clock }) => {
    const group = barsRef.current;
    if (!group) return;
    const t = clock.getElapsedTime();
    group.children.forEach((child, i) => {
      const target = isPlaying
        ? 0.3 + 0.7 * Math.abs(Math.sin(t * 3.2 + phases.current[i]))
        : 0.12;
      child.scale.y += (target - child.scale.y) * 0.2;
      child.position.y = baselineY + (barHeight * child.scale.y) / 2;
    });
  });

  // Um cluster pequeno, colado na frente do rádio (como um VU meter de
  // verdade), não flutuando ao lado dele: ao lado, a barra mais distante
  // saía da janela da câmera (o enquadramento é justo, pensado só pro
  // rádio em si, ver RadioScene abaixo).
  const barWidth = size.x * 0.032;
  const gap = size.x * 0.018;
  const clusterWidth = BAR_COUNT * barWidth + (BAR_COUNT - 1) * gap;
  const startX = size.x * 0.5 - clusterWidth / 2;
  const frontZ = size.z * 0.06;

  return (
    <group ref={barsRef}>
      {Array.from({ length: BAR_COUNT }, (_, i) => (
        <mesh
          key={i}
          position={[startX + i * (barWidth + gap), baselineY, frontZ]}
          scale={[1, 0.12, 1]}
        >
          <boxGeometry args={[barWidth, size.y * 0.5, barWidth]} />
          <meshStandardMaterial color="#7fd858" />
        </mesh>
      ))}
    </group>
  );
}

function RadioAssembly({ isPlaying }: { isPlaying: boolean }) {
  const { scene, size } = useCenteredGLTF(RADIO_URL);
  const groupRef = useRef<THREE.Group>(null);

  const centerX = size.x / 2;
  const centerY = size.y / 2;
  const centerZ = -size.z / 2;
  // Normaliza pela maior dimensão: mesmo critério da tevê e da caixa de
  // vinis (ver VintageTVScene.tsx e VinylCrateScene.tsx).
  const scale = 1 / Math.max(size.x, size.y, size.z);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.y = isPlaying ? Math.sin(clock.getElapsedTime() * 3) * 0.02 : 0;
  });

  return (
    <group scale={scale}>
      <group ref={groupRef} position={[-centerX, -centerY, -centerZ]}>
        <primitive object={scene} castShadow receiveShadow />
        <EqualizerBars size={size} isPlaying={isPlaying} />
      </group>
    </group>
  );
}

function Scene({ isPlaying }: { isPlaying: boolean }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 1, -2]} intensity={0.3} />
      <Suspense fallback={null}>
        <RadioAssembly isPlaying={isPlaying} />
      </Suspense>
    </>
  );
}

export default function RadioScene({ isPlaying }: { isPlaying: boolean }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 3], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Scene isPlaying={isPlaying} />
    </Canvas>
  );
}
