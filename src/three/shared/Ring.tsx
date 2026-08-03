import { useMemo, useRef, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, useGLTF } from '@react-three/drei';
import {
  Box3,
  Quaternion,
  Vector3,
  type BufferGeometry,
  type Group,
  type Material,
  type Mesh,
} from 'three';

/**
 * Shared solitaire ring, used by the hero, the product 360° viewer, the story
 * page and /lab. No leva here — this file must never pull the tuning panel into
 * a production chunk. /lab wraps this and feeds live leva values as props.
 *
 * Model: public/models/ring.glb (~144KB, 2 meshes — band+prongs and a separate
 * diamond). Model materials are ignored; ours (CLAUDE.md canon) replace them.
 * Auto-normalized from its bbox to TARGET_SIZE and centered on the origin.
 */

const MODEL_URL = '/models/ring.glb';
const TARGET_SIZE = 2;

export type GoldParams = {
  color: string;
  metalness: number;
  roughness: number;
  envMapIntensity: number;
};

export type DiamondParams = {
  transmission: number;
  ior: number;
  thickness: number;
  roughness: number;
  chromaticAberration: number;
  dispersion: number;
  flatShading: boolean;
};

// CLAUDE.md canon — the difference between "gold" and "grey plastic".
export const GOLD_CANON: GoldParams = {
  color: '#E8D9A0',
  metalness: 1.0,
  roughness: 0.28,
  envMapIntensity: 1.5,
};

export const DIAMOND_CANON: DiamondParams = {
  transmission: 1.0,
  ior: 2.4,
  thickness: 0.5,
  roughness: 0.0,
  chromaticAberration: 0.06,
  dispersion: 0.5,
  flatShading: true,
};

type MeshEntry = {
  geometry: BufferGeometry;
  position: Vector3;
  quaternion: Quaternion;
  scale: Vector3;
  isDiamond: boolean;
};

export function Ring({
  gold: goldOverride,
  diamond: diamondOverride,
  /** Radians/sec of automatic Y spin. Ignored when `rotationRef` is set. */
  autoRotate = 0,
  /** External Y rotation (radians), read every frame — for scroll-driving.
   *  Reading a ref in useFrame avoids a React re-render per frame. */
  rotationRef,
  /** Mobile downgrade: diamond uses MeshPhysicalMaterial (no transmission
   *  FBO passes) instead of MeshTransmissionMaterial. */
  mobile = false,
}: {
  gold?: Partial<GoldParams>;
  diamond?: Partial<DiamondParams>;
  autoRotate?: number;
  rotationRef?: MutableRefObject<number>;
  mobile?: boolean;
}) {
  const spinGroup = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const gold = { ...GOLD_CANON, ...goldOverride };
  const diamond = { ...DIAMOND_CANON, ...diamondOverride };

  const { entries, normScale, normOffset } = useMemo(() => {
    scene.updateMatrixWorld(true);
    const collected: MeshEntry[] = [];
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (!mesh.isMesh) return;
      const position = new Vector3();
      const quaternion = new Quaternion();
      const scale = new Vector3();
      mesh.matrixWorld.decompose(position, quaternion, scale);
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const materialName = (material as Material | undefined)?.name ?? '';
      const isDiamond = /diamond/i.test(mesh.name) || /diamond/i.test(materialName);
      collected.push({ geometry: mesh.geometry, position, quaternion, scale, isDiamond });
    });
    const box = new Box3().setFromObject(scene);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const s = TARGET_SIZE / maxDim;
    return { entries: collected, normScale: s, normOffset: center.multiplyScalar(-s) };
  }, [scene]);

  useFrame((_, delta) => {
    const g = spinGroup.current;
    if (!g) return;
    if (rotationRef) g.rotation.y = rotationRef.current;
    else if (autoRotate) g.rotation.y += delta * autoRotate;
  });

  return (
    <group ref={spinGroup}>
      <group position={normOffset.toArray()} scale={normScale}>
        {entries.map((entry, i) => (
          <mesh
            key={i}
            geometry={entry.geometry}
            position={entry.position}
            quaternion={entry.quaternion}
            scale={entry.scale}
          >
            {entry.isDiamond ? (
              mobile ? (
                // No FBO/transmission passes on mobile — a physical glass look
                // via high ior + clearcoat + slight transparency.
                <meshPhysicalMaterial
                  color="#ffffff"
                  metalness={0}
                  roughness={0.02}
                  ior={diamond.ior}
                  clearcoat={1}
                  clearcoatRoughness={0}
                  transparent
                  opacity={0.55}
                  flatShading={diamond.flatShading}
                />
              ) : (
                <MeshTransmissionMaterial
                  transmission={diamond.transmission}
                  ior={diamond.ior}
                  thickness={diamond.thickness}
                  roughness={diamond.roughness}
                  chromaticAberration={diamond.chromaticAberration}
                  dispersion={diamond.dispersion}
                  flatShading={diamond.flatShading}
                  samples={6}
                  resolution={512}
                />
              )
            ) : (
              <meshStandardMaterial
                color={gold.color}
                metalness={gold.metalness}
                roughness={gold.roughness}
                envMapIntensity={gold.envMapIntensity}
              />
            )}
          </mesh>
        ))}
      </group>
    </group>
  );
}

useGLTF.preload(MODEL_URL);
