import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Ring } from '@/three/shared/Ring';
import { StudioLights } from '@/three/shared/StudioLights';

/**
 * Ambient auto-rotating ring for the Story page — a single quiet 3D moment,
 * not interactive. Default export for React.lazy() (three out of the entry).
 * Sits on a dark panel (see AmbientRing) so the studio-lit ring reads correctly.
 */
export default function StoryCanvas({ mobile }: { mobile: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={false}
      camera={{ position: [0, 0.15, 3.7], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <StudioLights mobile={mobile} frames={1} />
        <Ring autoRotate={0.3} mobile={mobile} />
      </Suspense>
    </Canvas>
  );
}
