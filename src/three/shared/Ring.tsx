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

/**
 * How the stone is rendered.
 *
 * `transmission` — the CLAUDE.md canon MeshTransmissionMaterial. It refracts
 *   whatever is BEHIND the mesh, so it only looks like a diamond when there is
 *   something back there: use it on `/lab`, which has a lit Stage backdrop.
 *   On a transparent canvas over a dark page it refracts darkness and the
 *   stone renders black.
 *
 * `reflective` — a highly polished MeshPhysicalMaterial that mirrors the
 *   studio Lightformers instead of refracting the backdrop. Each flat facet
 *   catches a light strip, which is what reads as sparkle. Used everywhere the
 *   canvas is transparent (hero, story, product viewer).
 */
export type DiamondMode = 'transmission' | 'reflective';

export function Ring({
  gold: goldOverride,
  diamond: diamondOverride,
  /** Radians/sec of automatic Y spin. Ignored when `rotationRef` is set. */
  autoRotate = 0,
  /** External Y rotation (radians), read every frame — for scroll-driving.
   *  Reading a ref in useFrame avoids a React re-render per frame. */
  rotationRef,
  /** Mobile downgrade: fewer lights upstream; also forces `reflective`, which
   *  skips the transmission FBO passes entirely. */
  mobile = false,
  diamondMode = 'reflective',
}: {
  gold?: Partial<GoldParams>;
  diamond?: Partial<DiamondParams>;
  autoRotate?: number;
  rotationRef?: MutableRefObject<number>;
  mobile?: boolean;
  diamondMode?: DiamondMode;
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
              diamondMode === 'transmission' && !mobile ? (
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
              ) : (
                // Mirror-polished, opaque. `envMapIntensity` well above 1 makes
                // every facet throw back a studio strip — that hard glint is
                // what the eye reads as "diamond". `iridescence` adds the
                // rainbow fire along facet edges. No transparency: a see-through
                // stone over a dark page just looks like a hole.
                <meshPhysicalMaterial
                  color="#ffffff"
                  // Dielectric, not metal. A metal shows ONLY the environment,
                  // and this environment is a dark room with three light
                  // strips — so a mirrored stone renders almost black.
                  metalness={0}
                  roughness={0}
                  ior={diamond.ior}
                  reflectivity={1}
                  clearcoat={1}
                  clearcoatRoughness={0}
                  envMapIntensity={3}
                  // The emissive floor is the deliberate cheat. A real diamond
                  // looks bright because it gathers and concentrates light from
                  // the whole room; we have almost no room to gather from, so a
                  // soft internal glow stands in for it. Facet glints from the
                  // studio strips then layer on top. Without this the stone is
                  // either black (metal) or flat grey (plain dielectric).
                  emissive="#ffffff"
                  emissiveIntensity={0.45}
                  flatShading={diamond.flatShading}
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
