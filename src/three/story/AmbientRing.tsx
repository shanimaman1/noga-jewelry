import { Suspense, lazy } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const StoryCanvas = lazy(() => import('./StoryCanvas'));

/**
 * Self-contained ambient 3D ring for the Story page: a dark "atelier" panel
 * with the studio-lit ring turning slowly inside it. Handles its own
 * reduced-motion fallback (a static glow, no canvas, three never downloaded)
 * so the page just drops in <AmbientRing />.
 */
export function AmbientRing() {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery('(max-width: 767px)');

  return (
    // w-full + an absolutely-positioned canvas: R3F sizes its canvas from the
    // container, so if the canvas were in normal flow an auto-width grid column
    // would size itself from the canvas instead — a feedback loop that left the
    // canvas stuck at its old width and overflowed the page after a resize.
    // Taking it out of flow means it can never drive layout.
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm bg-charcoal">
      {/* Warm light pool — also the reduced-motion poster. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(58% 52% at 50% 46%, rgba(201,162,39,0.18), rgba(10,9,8,0) 70%)',
        }}
      />
      {!reduced && (
        <Suspense fallback={null}>
          <div className="absolute inset-0">
            <StoryCanvas mobile={mobile} />
          </div>
        </Suspense>
      )}
    </div>
  );
}
