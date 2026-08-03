import { useEffect, useRef } from 'react';

/**
 * Scroll reveal — FAIL-OPEN by design.
 *
 * The rule this enforces: content is visible unless we have positively armed
 * it AND can guarantee we will also un-arm it. Every path that isn't a fully
 * working IntersectionObserver leaves the element visible.
 *
 * This replaces an earlier fail-closed system where elements rendered at
 * opacity:0 / clip-path:inset(...100%...) and only appeared if an observer
 * fired. When one didn't, content was invisible permanently — and because
 * `loading="lazy"` refuses to fetch images inside hidden ancestors, catalogue
 * photos were never even downloaded.
 *
 * Four guarantees:
 *  1. Reduced motion, or no IntersectionObserver → never armed. Visible.
 *  2. Already on screen at mount → never armed (also avoids a hide/show flash).
 *  3. Armed elements are released the moment they intersect.
 *  4. A safety timer releases anything still armed after SAFETY_MS, so a
 *     missed observer callback can never leave content hidden.
 *
 * Styling lives in CSS on the `data-reveal` attribute (see styles/index.css),
 * so the un-styled default — no attribute at all — is the visible state.
 */

const SAFETY_MS = 2500;

export function useReveal<T extends HTMLElement = HTMLDivElement>(
  /** Seconds of delay before the transition starts, matching the old API. */
  delay = 0,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Guarantee 1 — no motion, or no observer support: stay visible.
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    // Guarantee 2 — already in view: nothing to reveal, don't hide it.
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) return;

    el.style.transitionDelay = delay ? `${delay}s` : '';
    el.dataset.reveal = 'armed';

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      el.dataset.reveal = 'in';
    };

    // Guarantee 3 — release on intersection.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          release();
          io.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);

    // Guarantee 4 — release regardless, so nothing can stay hidden.
    const safety = window.setTimeout(release, SAFETY_MS);

    return () => {
      window.clearTimeout(safety);
      io.disconnect();
      // Leave the element visible if it unmounts mid-animation.
      if (!released) delete el.dataset.reveal;
    };
  }, [delay]);

  return ref;
}
