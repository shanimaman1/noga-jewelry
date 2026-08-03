import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { Ring } from '@/three/shared/Ring';
import { StudioLights } from '@/three/shared/StudioLights';

/**
 * Home hero canvas — "The Dark Room". Transparent (alpha) so the CSS backdrop
 * behind it can brighten charcoal→cream on scroll; the ring floats over it.
 *
 * Default export so it can be React.lazy()'d — this keeps three/fiber/drei out
 * of the entry chunk (see vite.config three-vendor group).
 *
 * `frameloop` is controlled by the parent: 'always' while visible, 'never'
 * when the hero is scrolled off-screen or the tab is hidden, so the GPU idles.
 */
export default function HeroCanvas({
  progress,
  mobile,
  frameloop,
}: {
  progress: MotionValue<number>;
  mobile: boolean;
  frameloop: 'always' | 'never';
}) {
  const rotationRef = useRef(0);

  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={false}
      frameloop={frameloop}
      // The hero canvas is a tall, narrow half-column, so a 38° vertical FOV
      // leaves very little horizontal room and the ring was cropping at the
      // bottom. Pulled back and re-centred to frame it like a product shot,
      // with breathing room on every side.
      camera={{ position: [0, 0, 5.4], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <StudioLights mobile={mobile} frames={1} />
        <Ring rotationRef={rotationRef} mobile={mobile} />
        <ScrollDriver progress={progress} rotationRef={rotationRef} />
      </Suspense>
    </Canvas>
  );
}

/**
 * Translates scroll + time into ring rotation, every frame, without touching
 * React state. A slow constant turn keeps the piece alive when the reader is
 * still; scroll adds ~1.5 extra turns across the hero so the light visibly
 * rolls across the gold as they move down the page.
 */
function ScrollDriver({
  progress,
  rotationRef,
}: {
  progress: MotionValue<number>;
  rotationRef: React.MutableRefObject<number>;
}) {
  useFrame((state) => {
    const p = progress.get(); // 0 → 1 across the hero
    rotationRef.current = state.clock.elapsedTime * 0.15 + p * Math.PI * 1.5;
  });
  return null;
}
