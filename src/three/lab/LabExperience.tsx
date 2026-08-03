import { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { StatsGl } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Leva, useControls } from 'leva';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Ring } from './Ring';
import { StudioLights } from './StudioLights';
import { Stage } from './Stage';

/**
 * Phase 1a lab: ring + studio lights + staged scene (backdrop glow,
 * reflective floor, contact shadow, subtle bloom). dpr capped [1, 1.5],
 * no real-time light shadows. leva ships in this lazy chunk only.
 *
 * Performance tiers: bloom is desktop-only (EffectComposer is GPU-heavy);
 * the floor reflection and contact shadow run lighter on mobile
 * (lower resolution + tighter blur — see Stage).
 */
export function LabExperience() {
  const [ready, setReady] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const { showStats } = useControls('Scene', {
    showStats: { value: true, label: 'FPS meter' },
  });

  const bloom = useControls('Bloom', {
    enabled: true,
    intensity: { value: 0.35, min: 0, max: 2, step: 0.01 },
    threshold: { value: 0.9, min: 0, max: 1.5, step: 0.01 },
  });

  // Only the brightest specular streaks should glow — never the whole frame.
  const bloomActive = bloom.enabled && !isMobile;

  return (
    <div className="fixed inset-0 bg-charcoal">
      <Leva collapsed={false} />

      <Canvas
        dpr={[1, 1.5]}
        shadows={false}
        camera={{ position: [0, 0.2, 3.5], fov: 38 }}
        gl={{ antialias: true }}
        onCreated={() => setReady(true)}
      >
        <color attach="background" args={['#0A0908']} />
        <Suspense fallback={null}>
          <StudioLights />
          <Stage isMobile={isMobile} />
          <Ring />
        </Suspense>
        {bloomActive && (
          <EffectComposer multisampling={4}>
            <Bloom
              intensity={bloom.intensity}
              luminanceThreshold={bloom.threshold}
              luminanceSmoothing={0.25}
              mipmapBlur
            />
          </EffectComposer>
        )}
        {showStats && <StatsGl />}
      </Canvas>

      {/* Thin gold loading strip on charcoal while the canvas initializes */}
      {!ready && (
        <div className="absolute inset-0 z-10 grid place-items-center bg-charcoal">
          <div className="h-px w-48 overflow-hidden rounded-full bg-cream/10">
            <div className="lab-load-bar h-full w-1/3 bg-gold" />
          </div>
          <style>{`
            .lab-load-bar { animation: lab-load 1.1s ease-in-out infinite; }
            @keyframes lab-load {
              0% { transform: translateX(150%); }
              100% { transform: translateX(-250%); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
