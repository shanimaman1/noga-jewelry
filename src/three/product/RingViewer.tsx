import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Ring } from '@/three/shared/Ring';
import { StudioLights } from '@/three/shared/StudioLights';

/**
 * Live 360° drag-to-rotate viewer for the product page. Used ONLY for the
 * solitaire (`has3D`) — the one product the model actually depicts.
 *
 * Default export so it can be React.lazy()'d — three stays out of the entry.
 * OrbitControls is constrained to horizontal (azimuth) rotation only: no zoom,
 * no pan, and the polar angle is locked, so it reads as spinning the ring on a
 * turntable rather than a free-fly camera.
 *
 * PRODUCTION NOTE: the cheaper, more scalable approach is a pre-rendered image
 * sequence per product (drag-scrubbed), which needs no WebGL on the client.
 * A live canvas is used here because we have exactly one such product.
 */
export default function RingViewer({ mobile }: { mobile: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={false}
      camera={{ position: [0, 0.15, 3.6], fov: 38 }}
      gl={{ alpha: true, antialias: true }}
      style={{ background: 'transparent' }}
    >
      <Suspense fallback={null}>
        <StudioLights mobile={mobile} frames={1} />
        <Ring mobile={mobile} />
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.6}
          minPolarAngle={Math.PI / 2.6}
          maxPolarAngle={Math.PI / 2.6}
        />
      </Suspense>
    </Canvas>
  );
}
