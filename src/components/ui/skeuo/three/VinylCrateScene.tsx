"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useCenteredGLTF } from "@/components/ui/skeuo/three/useCenteredGLTF";

// Cena WebGL da caixa de vinis: a caixa em si é um modelo pronto (não mais
// geometria feita à mão), da "Furniture Kit" da Kenney (CC0, ver
// public/models/kenney-furniture-kit/LICENSE.txt), o mesmo pacote da tevê e
// do rádio (ver VintageTVScene.tsx e RadioScene.tsx). Os discos, esses sim
// são geometria própria: cada ilustração é uma imagem de verdade (ver
// data/experiments.ts), não dá pra vir de um modelo pronto genérico. Toda
// medida dos discos (tamanho, distância entre eles) é uma fração do tamanho
// REAL da caixa carregada, não um número solto: os dois precisam concordar
// sobre a escala, senão os discos nascem grandes/pequenos demais pra caixa
// que os cerca.
//
// Renderizada só no cliente (ver VinylCrate.tsx, que importa este arquivo
// via next/dynamic com ssr:false): Canvas exige DOM/WebGL, que não existem
// durante o build estático.
//
// O gesto (arrastar, clicar nas setas) mora FORA do Canvas, em HTML comum
// por cima dele (ver VinylCrate.tsx): esta cena só lê `active` e anima até
// lá, useFrame fazendo o lerp de cada disco a cada quadro. Câmera e luz são
// fixas, ninguém aqui gira a cena inteira, só os discos entre si.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const CRATE_URL = `${basePath}/models/kenney-furniture-kit/cardboardBoxOpen.glb`;

function wrap(i: number, length: number) {
  return ((i % length) + length) % length;
}

function Record({
  url,
  d,
  isActive,
  unit,
}: {
  url: string;
  d: number;
  isActive: boolean;
  unit: number;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  const groupRef = useRef<THREE.Group>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const targetRotY = d * -0.5;
  const targetX = d * unit * 0.62;
  const targetZ = -Math.abs(d) * unit * 0.25;
  const targetScale = 1 - Math.abs(d) * 0.13;
  const targetOpacity = 1 - Math.abs(d) * 0.3;

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const lerp = 1 - Math.pow(0.001, delta);
    g.rotation.y += (targetRotY - g.rotation.y) * lerp;
    g.position.x += (targetX - g.position.x) * lerp;
    g.position.z += (targetZ - g.position.z) * lerp;
    const s = g.scale.x + (targetScale - g.scale.x) * lerp;
    g.scale.setScalar(s);
    if (frontMatRef.current) {
      frontMatRef.current.opacity += (targetOpacity - frontMatRef.current.opacity) * lerp;
    }
  });

  const coverSize = unit * 0.62;

  return (
    <group ref={groupRef} position={[d * unit * 0.62, 0, -Math.abs(d) * unit * 0.25]}>
      {/* Disco de vinil, espiando por trás da capa: um cilindro achatado,
          deslocado um pouco pra trás e pro lado. */}
      {isActive && (
        <mesh position={[coverSize * 0.37, 0, -unit * 0.05]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[coverSize * 0.52, coverSize * 0.52, unit * 0.012, 48]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.1} />
        </mesh>
      )}
      {/* Capa: uma caixa rasa, textura na face da frente, as outras faces
          num preto liso (a borda do encarte). */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[coverSize, coverSize, unit * 0.04]} />
        <meshStandardMaterial attach="material-0" color="#111111" />
        <meshStandardMaterial attach="material-1" color="#111111" />
        <meshStandardMaterial attach="material-2" color="#111111" />
        <meshStandardMaterial attach="material-3" color="#111111" />
        <meshStandardMaterial
          attach="material-4"
          ref={frontMatRef}
          map={texture}
          transparent
          opacity={targetOpacity}
          roughness={0.55}
        />
        <meshStandardMaterial attach="material-5" color="#0d0d0d" />
      </mesh>
    </group>
  );
}

function Scene({ frames, active }: { frames: { src: string }[]; active: number }) {
  const { scene, center, size } = useCenteredGLTF(CRATE_URL);
  // Normaliza pela maior dimensão: o mesmo critério usado na tevê e no
  // rádio (ver VintageTVScene.tsx e RadioScene.tsx), pra as três cenas
  // caberem no mesmo enquadramento de câmera sem precisar de um ajuste
  // manual de escala por objeto.
  const scale = 1 / Math.max(size.x, size.y, size.z);

  const radius = 2;
  const visible = Array.from({ length: radius * 2 + 1 }, (_, k) => k - radius).map((d) => ({
    d,
    frame: frames[wrap(active + d, frames.length)],
    key: wrap(active + d, frames.length),
  }));

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.35} />
      <group scale={scale}>
        {/* -center, não -size/2: a caixa da Kenney não nasce simétrica em X
            (a aba aberta pesa pra um lado), usar o centro de verdade da
            caixa (medido, não estimado) evita os discos nascendo tortos em
            relação a ela. */}
        <group position={[-center.x, -center.y, -center.z]}>
          <primitive object={scene} castShadow receiveShadow />
          {/* Discos saindo pela boca aberta da caixa, centralizados nela. */}
          <group position={[center.x, size.y * 0.98, center.z]}>
            {visible.map(({ d, frame, key }) => (
              <Record key={key} url={frame.src} d={d} isActive={d === 0} unit={size.x} />
            ))}
          </group>
        </group>
      </group>
    </>
  );
}

export default function VinylCrateScene({
  frames,
  active,
}: {
  frames: { src: string }[];
  active: number;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 0.1, 3], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Scene frames={frames} active={active} />
      </Suspense>
    </Canvas>
  );
}
