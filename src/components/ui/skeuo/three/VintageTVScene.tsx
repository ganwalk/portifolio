"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { useSkeuoVideoTexture } from "@/components/ui/skeuo/three/useSkeuoVideoTexture";
import { useCenteredGLTF } from "@/components/ui/skeuo/three/useCenteredGLTF";

// Cena WebGL da tevê vintage: modelo pronto (não mais geometria feita à mão
// aqui dentro), da "Furniture Kit" da Kenney (CC0, ver public/models/
// kenney-furniture-kit/LICENSE.txt), o mesmo pacote da caixa de vinis e do
// rádio (ver VinylCrateScene.tsx e RadioScene.tsx), pra manter as três peças
// no mesmo estilo low poly. Renderizada só no cliente, via next/dynamic em
// VintageTV.tsx. O botão giratório mora em HTML por cima: esta cena só
// recebe o canal atual e o ângulo alvo do botão, e anima os dois a cada
// quadro.
//
// A origem de cada modelo da Kenney fica no canto inferior frontal (assim
// as peças de um kit encaixam umas nas outras pela própria origem, sem
// recentralizar nada): X cresce da esquerda pra direita, Y sobe do chão, Z
// vai de 0 (face da frente) até -profundidade (o fundo). Tela, antena e
// botão são posicionados nesse MESMO referencial cru; só o grupo de fora
// centraliza e escala o conjunto inteiro pra câmera.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const TV_URL = `${basePath}/models/kenney-furniture-kit/televisionVintage.glb`;
const ANTENNA_URL = `${basePath}/models/kenney-furniture-kit/televisionAntenna.glb`;
// Altura da antena como fração da altura da tevê, medida uma vez nos dois
// modelos (0.103 / 0.27): mantém a antena encaixada no topo mesmo que o
// tamanho de referência mude.
const ANTENNA_HEIGHT_RATIO = 0.38;

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

function Knob({ targetAngle, tvSize }: { targetAngle: number; tvSize: THREE.Vector3 }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = ref.current;
    if (!g) return;
    const lerp = 1 - Math.pow(0.001, delta);
    g.rotation.z += (targetAngle - g.rotation.z) * lerp;
  });
  return (
    <group ref={ref} position={[tvSize.x * 0.82, tvSize.y * 0.35, tvSize.x * 0.03]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[tvSize.x * 0.05, tvSize.x * 0.05, tvSize.x * 0.04, 24]} />
        <meshStandardMaterial color="#4a4a4a" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, tvSize.x * 0.035, tvSize.x * 0.03]}>
        <boxGeometry args={[tvSize.x * 0.012, tvSize.x * 0.006, tvSize.x * 0.05]} />
        <meshStandardMaterial color="#e8e8e8" />
      </mesh>
    </group>
  );
}

function TVAssembly({ channel, knobAngle }: { channel: Channel; knobAngle: number }) {
  const { scene, size } = useCenteredGLTF(TV_URL);
  const { scene: antennaScene } = useCenteredGLTF(ANTENNA_URL);

  const combinedTop = size.y * (1 + ANTENNA_HEIGHT_RATIO);
  const centerX = size.x / 2;
  const centerY = combinedTop / 2;
  const centerZ = -size.z / 2;
  // Normaliza pela maior dimensão (largura, altura com antena, ou
  // profundidade): o mesmo critério da caixa de vinis e do rádio (ver
  // VinylCrateScene.tsx e RadioScene.tsx), pra as três cenas caberem no
  // mesmo enquadramento de câmera sem ajuste manual por objeto.
  const scale = 1 / Math.max(size.x, combinedTop, size.z);

  return (
    <group scale={scale}>
      <group position={[-centerX, -centerY, -centerZ]}>
        <primitive object={scene} castShadow receiveShadow />

        {/* Antena: a própria Kenney desenha com a origem centralizada em X e
            apoiada no próprio chão (Y=0), então encaixa no topo da tevê só
            alinhando X ao centro da carcaça, Y à altura dela, Z em direção
            ao fundo (valores negativos). */}
        <primitive object={antennaScene} position={[centerX, size.y, -size.z * 0.35]} />

        {/* Tela: sem nó próprio no modelo (a Kenney desenha tudo como UMA
            malha só), então é uma segunda peça, plana, encostada na frente
            da carcaça (Z perto de 0, a face da frente) onde o recorte da
            tela está desenhado. Frações do tamanho real do modelo, não
            pixels fixos: calibradas olhando o resultado renderizado. */}
        <mesh position={[size.x * 0.32, size.y * 0.58, size.x * 0.03]}>
          <planeGeometry args={[size.x * 0.44, size.y * 0.62]} />
          <Suspense fallback={<meshStandardMaterial color="#111111" />}>
            {channel.kind === "video" ? (
              <VideoScreen src={channel.src} poster={channel.poster} />
            ) : (
              <ImageScreen src={channel.src} />
            )}
          </Suspense>
        </mesh>

        <Knob targetAngle={knobAngle} tvSize={size} />
      </group>
    </group>
  );
}

function Scene({ channel, knobAngle }: { channel: Channel; knobAngle: number }) {
  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 4, 4]} intensity={1.1} castShadow />
      <directionalLight position={[-3, 1, -2]} intensity={0.3} />
      <TVAssembly key={`${channel.kind}-${channel.src}`} channel={channel} knobAngle={knobAngle} />
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
      camera={{ position: [0, 0.1, 3], fov: 30 }}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: "none" }}
    >
      <Suspense fallback={null}>
        <Scene channel={channel} knobAngle={knobAngle} />
      </Suspense>
    </Canvas>
  );
}
