import { Environment, Lightformer } from '@react-three/drei';
import { useControls } from 'leva';

/**
 * Studio softbox rig — the entire environment is built from Lightformer
 * rects. NO HDRI file, NO preset (city/sunset contaminate gold with color
 * casts). This mimics a real jewelry-photography setup:
 *  - two long narrow strips flanking the ring → the long specular streaks
 *    that make polished gold read as metal
 *  - one wide soft rect above → overall fill and the top sheen
 * frames={Infinity} keeps the env map live so leva changes apply instantly
 * (tuning-lab luxury; the production hero will bake with frames={1}).
 */
export function StudioLights() {
  const left = useControls('Light · Left strip', {
    intensity: { value: 8, min: 0, max: 40, step: 0.1 },
    x: { value: -4, min: -12, max: 0, step: 0.1 },
    y: { value: 0.8, min: -4, max: 10, step: 0.1 },
    z: { value: 1.2, min: -8, max: 8, step: 0.1 },
    width: { value: 1.1, min: 0.1, max: 10, step: 0.05 },
    height: { value: 7, min: 0.1, max: 16, step: 0.1 },
  });

  const right = useControls('Light · Right strip', {
    intensity: { value: 8, min: 0, max: 40, step: 0.1 },
    x: { value: 4, min: 0, max: 12, step: 0.1 },
    y: { value: 0.8, min: -4, max: 10, step: 0.1 },
    z: { value: 1.2, min: -8, max: 8, step: 0.1 },
    width: { value: 1.1, min: 0.1, max: 10, step: 0.05 },
    height: { value: 7, min: 0.1, max: 16, step: 0.1 },
  });

  const top = useControls('Light · Top soft', {
    intensity: { value: 3, min: 0, max: 40, step: 0.1 },
    x: { value: 0, min: -8, max: 8, step: 0.1 },
    y: { value: 5, min: 0, max: 14, step: 0.1 },
    z: { value: 0, min: -8, max: 8, step: 0.1 },
    width: { value: 8, min: 0.1, max: 20, step: 0.1 },
    height: { value: 2.5, min: 0.1, max: 12, step: 0.1 },
  });

  return (
    <Environment resolution={256} frames={Infinity}>
      {/* Dark surround so reflections carry the charcoal room, not void */}
      <color attach="background" args={['#0A0908']} />

      <Lightformer
        form="rect"
        target={[0, 0, 0]}
        intensity={left.intensity}
        position={[left.x, left.y, left.z]}
        scale={[left.width, left.height, 1]}
      />
      <Lightformer
        form="rect"
        target={[0, 0, 0]}
        intensity={right.intensity}
        position={[right.x, right.y, right.z]}
        scale={[right.width, right.height, 1]}
      />
      <Lightformer
        form="rect"
        target={[0, 0, 0]}
        intensity={top.intensity}
        position={[top.x, top.y, top.z]}
        scale={[top.width, top.height, 1]}
      />
    </Environment>
  );
}
