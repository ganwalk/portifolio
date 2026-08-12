"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";

// Cena WebGL de verdade (three.js puro via @react-three/fiber, sem cenário
// pronto de terceiro: só luzes e geometria básica, o mesmo espírito minimal
// do único outro uso de WebGL do site, a lente da hero). Renderizada só no
// cliente (ver VinylCrate.tsx, que importa este arquivo via next/dynamic com
// ssr:false): Canvas exige DOM/WebGL, que não existem durante o build
// estático.
//
// O gesto (arrastar, clicar nas setas) mora FORA do Canvas, em HTML comum
// por cima dele (ver VinylCrate.tsx): esta cena só lê `active` e anima até
// lá, useFrame fazendo o lerp de cada disco a cada quadro. Câmera e luz são
// fixas, ninguém aqui gira a cena inteira, só os discos entre si.

function wrap(i: number, length: number) {
  return ((i % length) + length) % length;
}

function Record({
  url,
  d,
  isActive,
}: {
  url: string;
  d: number;
  isActive: boolean;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  const groupRef = useRef<THREE.Group>(null);
  const frontMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const targetRotY = d * -0.5;
  const targetX = d * 0.9;
  const targetZ = -Math.abs(d) * 0.35;
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

  return (
    <group ref={groupRef} position={[d * 0.9, 0, -Math.abs(d) * 0.35]}>
      {/* Disco de vinil, espiando por trás da capa: um cilindro achatado,
          deslocado um pouco pra trás e pro lado. */}
      {isActive && (
        <mesh position={[0.55, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.78, 0.78, 0.02, 48]} />
          <meshStandardMaterial color="#0a0a0a" roughness={0.35} metalness={0.1} />
        </mesh>
      )}
      {/* Capa: uma caixa rasa, textura na face da frente, as outras faces
          num preto liso (a borda do encarte). */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 1.5, 0.06]} />
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

function Crate() {
  return (
    <group position={[0, -1.15, -0.3]}>
      <mesh receiveShadow>
        <boxGeometry args={[4.6, 0.3, 1.6]} />
        <meshStandardMaterial color="#5c3a20" roughness={0.9} />
      </mesh>
      <mesh position={[-2.1, 0.45, 0]}>
        <boxGeometry args={[0.3, 1.2, 1.6]} />
        <meshStandardMaterial color="#6b431f" roughness={0.9} />
      </mesh>
      <mesh position={[2.1, 0.45, 0]}>
        <boxGeometry args={[0.3, 1.2, 1.6]} />
        <meshStandardMaterial color="#6b431f" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Scene({ frames, active }: { frames: { src: string }[]; active: number }) {
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
      <Crate />
      {visible.map(({ d, frame, key }) => (
        <Record key={key} url={frame.src} d={d} isActive={d === 0} />
      ))}
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
      camera={{ position: [0, 0.4, 4.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Scene frames={frames} active={active} />
      </Suspense>
    </Canvas>
  );
}
