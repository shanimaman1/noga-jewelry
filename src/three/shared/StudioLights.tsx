import { Environment, Lightformer } from '@react-three/drei';

/**
 * Studio softbox rig — the whole environment is built from Lightformer rects.
 * NO HDRI, NO preset (city/sunset contaminate the gold with colour casts).
 *  - two long narrow side strips → the long specular streaks that read as
 *    polished metal (this is 80% of the "real gold" result)
 *  - one wide soft rect above → fill and top sheen
 *
 * `frames` defaults to 1: the env map is baked ONCE and reused, which is the
 * cheap production setting (CLAUDE.md). /lab passes Infinity for live tuning.
 * `mobile` drops the top fill to 2 strips (CLAUDE.md mobile downgrade).
 */
export function StudioLights({
  mobile = false,
  frames = 1,
}: {
  mobile?: boolean;
  frames?: number;
}) {
  return (
    <Environment resolution={256} frames={frames}>
      {/* Dark surround so reflections carry the charcoal room, not void */}
      <color attach="background" args={['#0A0908']} />

      <Lightformer
        form="rect"
        target={[0, 0, 0]}
        intensity={8}
        position={[-4, 0.8, 1.2]}
        scale={[1.1, 7, 1]}
      />
      <Lightformer
        form="rect"
        target={[0, 0, 0]}
        intensity={8}
        position={[4, 0.8, 1.2]}
        scale={[1.1, 7, 1]}
      />
      {!mobile && (
        <Lightformer
          form="rect"
          target={[0, 0, 0]}
          intensity={3}
          position={[0, 5, 0]}
          scale={[8, 2.5, 1]}
        />
      )}
    </Environment>
  );
}
