import { Suspense, lazy, useState } from 'react';
import type { MetalVariant } from '@/types/catalog';
import { productImage } from '@/data/products';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Lazy so three loads only when a shopper opens the 360° view.
const RingViewer = lazy(() => import('@/three/product/RingViewer'));

/**
 * Product gallery. The image shown is the real photograph of the selected
 * metal — no tinting or filtering. For the one product the 3D model genuinely
 * depicts (`has3D`), a "360°" toggle swaps the photo for a live drag-to-rotate
 * viewer. Under prefers-reduced-motion the toggle is hidden (photo only).
 */
export function Gallery({
  variant,
  name,
  has3D = false,
}: {
  variant: MetalVariant;
  name: string;
  has3D?: boolean;
}) {
  const reduced = useReducedMotion();
  const mobile = useMediaQuery('(max-width: 767px)');
  const canSpin = has3D && !reduced;

  // 'photo' shows the stills; '3d' shows the live viewer.
  const [mode, setMode] = useState<'photo' | '3d'>('photo');
  // Which still crop is active (photo mode only).
  const views = [
    { key: 'main', label: 'מבט מלא', position: 'center', zoom: 'none' },
    { key: 'detail', label: 'תקריב', position: '50% 40%', zoom: 'scale(1.4)' },
  ] as const;
  const [active, setActive] = useState(0);
  const current = views[active];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-sm bg-mist/30">
        {mode === '3d' && canSpin ? (
          <Suspense
            fallback={<div className="absolute inset-0 grid place-items-center text-sm text-stone">טוען תצוגת 360°…</div>}
          >
            {/* Absolutely positioned so the R3F canvas can never drive the
                layout width (see AmbientRing for the feedback-loop it avoids). */}
            <div className="absolute inset-0">
              <RingViewer mobile={mobile} />
            </div>
            <span className="pointer-events-none absolute bottom-3 start-1/2 -translate-x-1/2 rounded-full bg-charcoal/70 px-4 py-1.5 text-xs text-cream">
              גררו לסיבוב
            </span>
          </Suspense>
        ) : (
          <img
            key={variant.image}
            src={productImage(variant.image, 'full')}
            alt={variant.imageAlt}
            width={1000}
            height={1000}
            loading="eager"
            decoding="async"
            className="h-full w-full object-cover"
            style={{ objectPosition: current.position, transform: current.zoom }}
          />
        )}
      </div>

      <ul className="mt-3 flex gap-3">
        {/* 360° toggle first, when available */}
        {canSpin && (
          <li>
            <button
              type="button"
              onClick={() => setMode(mode === '3d' ? 'photo' : '3d')}
              aria-pressed={mode === '3d'}
              className={`flex h-[72px] w-[72px] flex-col items-center justify-center gap-1 rounded-sm border text-[11px] transition-colors ${
                mode === '3d' ? 'border-gold text-charcoal' : 'border-mist text-stone hover:border-stone'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <ellipse cx="12" cy="12" rx="9" ry="4" />
                <path d="M3 12a9 4 0 0 0 18 0" />
                <path d="M12 3v18" opacity="0.5" />
              </svg>
              360°
            </button>
          </li>
        )}

        {views.map((view, i) => (
          <li key={view.key}>
            <button
              type="button"
              onClick={() => {
                setMode('photo');
                setActive(i);
              }}
              aria-label={`${name} — ${view.label}`}
              aria-current={mode === 'photo' && i === active}
              className={`block overflow-hidden rounded-sm border transition-colors ${
                mode === 'photo' && i === active ? 'border-gold' : 'border-transparent hover:border-mist'
              }`}
            >
              <img
                src={productImage(variant.image, '600')}
                alt=""
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                className="object-cover"
                style={{ width: 72, height: 72, objectPosition: view.position, transform: view.zoom }}
              />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
