import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Carrega um glTF (ver public/models/kenney-furniture-kit) e devolve, junto
// com a cena, o centro e o tamanho da caixa que envolve o modelo inteiro:
// os modelos da Kenney nascem com a origem num canto (o "chão" do objeto),
// não no meio, então usar a cena crua como filho de um grupo já rotacionado/
// escalado deixa o objeto fora de centro. Quem chama posiciona um grupo
// filho em -center (em unidades do PRÓPRIO modelo, antes de qualquer escala
// do grupo pai) pra recentralizar, e usa `size` pra calcular offsets
// relativos (ex.: onde fica a tela de uma tevê) como fração do tamanho real,
// em vez de números mágicos que quebram se o modelo mudar.
export function useCenteredGLTF(url: string) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);
  const { center, size } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { center, size };
  }, [cloned]);
  return { scene: cloned, center, size };
}
