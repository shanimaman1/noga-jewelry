import { useEffect, useMemo } from 'react';
import { ContactShadows, MeshReflectorMaterial } from '@react-three/drei';
import { useControls } from 'leva';
import { CanvasTexture, Color, SRGBColorSpace } from 'three';

/**
 * The stage around the ring — turns "raw 3D object on void" into a lit,
 * dimensional product scene:
 *  - Backdrop: large plane with a generated radial-gradient texture — a warm
 *    spotlight glow behind the ring falling off to near-black at the edges.
 *    Unlit (meshBasicMaterial) so it is exact, cheap and light-independent.
 *  - Floor: barely-there blurred reflection (MeshReflectorMaterial) — the
 *    single biggest "expensive product shot" cue. Lighter settings on mobile.
 *  - ContactShadows: soft grounding shadow so the ring doesn't float.
 * The ring spans y ∈ [-1, 1] after normalization, so the floor sits at -1.02.
 */

function makeRadialGlowTexture(warmth: number, glow: number): CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Center color: neutral charcoal warmed toward brown, scaled by glow.
  const neutral = new Color('#1c1712');
  const warm = new Color('#3a2412');
  const center = neutral.clone().lerp(warm, warmth).multiplyScalar(glow);
  const edge = new Color('#050403');
  const css = (c: Color) =>
    `rgb(${Math.min(255, Math.round(c.r * 255))}, ${Math.min(255, Math.round(c.g * 255))}, ${Math.min(255, Math.round(c.b * 255))})`;

  const gradient = ctx.createRadialGradient(
    size / 2,
    size * 0.42, // glow center slightly above middle — behind the ring head
    size * 0.04,
    size / 2,
    size * 0.5,
    size * 0.62,
  );
  gradient.addColorStop(0, css(center));
  gradient.addColorStop(1, css(edge));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function Stage({ isMobile }: { isMobile: boolean }) {
  const stage = useControls('Stage', {
    warmth: { value: 0.6, min: 0, max: 1, step: 0.01 },
    glow: { value: 1.0, min: 0.2, max: 2, step: 0.01 },
    reflection: { value: 0.45, min: 0, max: 2, step: 0.01 },
    shadowOpacity: { value: 0.55, min: 0, max: 1, step: 0.01 },
  });

  const backdropTexture = useMemo(
    () => makeRadialGlowTexture(stage.warmth, stage.glow),
    [stage.warmth, stage.glow],
  );
  // Dispose replaced textures (leva re-tuning would otherwise leak them).
  useEffect(() => () => backdropTexture.dispose(), [backdropTexture]);

  return (
    <>
      {/* Warm radial-glow backdrop, far behind the ring */}
      <mesh position={[0, 0.4, -6]}>
        <planeGeometry args={[34, 18]} />
        <meshBasicMaterial map={backdropTexture} toneMapped={false} />
      </mesh>

      {/* Soft blurred floor reflection — elegant, not a mirror */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -1.02, 0]}>
        <planeGeometry args={[30, 30]} />
        <MeshReflectorMaterial
          blur={isMobile ? [120, 40] : [300, 100]}
          resolution={isMobile ? 256 : 512}
          mixBlur={1}
          mixStrength={stage.reflection}
          mirror={0.35}
          roughness={0.9}
          depthScale={0.8}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.4}
          color="#0b0908"
          metalness={0.5}
        />
      </mesh>

      {/* Grounding shadow directly under the band */}
      <ContactShadows
        position={[0, -1.01, 0]}
        opacity={stage.shadowOpacity}
        scale={7}
        blur={2.6}
        far={2.2}
        resolution={isMobile ? 256 : 512}
        color="#000000"
      />
    </>
  );
}
