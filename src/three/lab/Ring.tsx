import { useControls } from 'leva';
import { Ring as SharedRing } from '@/three/shared/Ring';

/**
 * /lab wrapper around the shared Ring: exposes every material parameter as a
 * live leva control and feeds the values in as props. All geometry loading,
 * bbox normalization and mesh splitting live in the shared component — this
 * file is only the tuning surface, so leva never leaks into a production chunk.
 */
export function Ring() {
  const gold = useControls('Gold', {
    color: '#E8D9A0',
    metalness: { value: 1.0, min: 0, max: 1, step: 0.01 },
    roughness: { value: 0.28, min: 0, max: 1, step: 0.01 },
    envMapIntensity: { value: 1.5, min: 0, max: 5, step: 0.05 },
  });

  const diamond = useControls('Diamond', {
    transmission: { value: 1.0, min: 0, max: 1, step: 0.01 },
    ior: { value: 2.4, min: 1, max: 3, step: 0.01 },
    thickness: { value: 0.5, min: 0, max: 2, step: 0.01 },
    roughness: { value: 0.0, min: 0, max: 1, step: 0.01 },
    chromaticAberration: { value: 0.06, min: 0, max: 0.5, step: 0.005 },
    dispersion: { value: 0.5, min: 0, max: 2, step: 0.01 },
    flatShading: true,
  });

  const { rotationSpeed } = useControls('Scene', {
    rotationSpeed: { value: 0.3, min: 0, max: 2, step: 0.05 },
  });

  // /lab keeps the canon transmission material: it is the only surface with a
  // lit Stage backdrop behind the ring for the stone to actually refract.
  return (
    <SharedRing
      gold={gold}
      diamond={diamond}
      autoRotate={rotationSpeed}
      diamondMode="transmission"
    />
  );
}
