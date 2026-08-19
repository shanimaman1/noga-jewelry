import { useEffect, type RefObject } from 'react';
import { useHeroVisibility } from '@/lib/heroVisibility';

/**
 * "Mostly out of view" rather than a pixel threshold: reveal the floating
 * actions once less than 10% of the hero is still on screen. A single
 * IntersectionObserver threshold is enough — the browser recomputes the
 * ratio every frame and fires the callback exactly when it crosses this
 * value, whether the user scrolls slowly or flings past it.
 */
const HERO_VISIBLE_RATIO = 0.1;

/**
 * Wires an IntersectionObserver to a page's hero section and mirrors "is it
 * still on screen" into the shared `heroVisibility` store, which
 * `FloatingActions` reads to decide whether to hide. Resets to `false` on
 * unmount so navigating away never leaves the floating actions stuck hidden.
 *
 * IntersectionObserver, not a scroll listener: no per-frame scroll handler,
 * no hardcoded pixel offset to keep in sync with the hero's height (which
 * varies with `88vh` and 3D-canvas layout), and it degrades safely — a ref
 * that never attaches (element removed, hook misused) just leaves the
 * default `false`, so the floating actions stay visible rather than stuck
 * hidden.
 */
export function useHeroInViewObserver(ref: RefObject<HTMLElement | null>) {
  const setHeroInView = useHeroVisibility((state) => state.setHeroInView);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => setHeroInView(entry.intersectionRatio >= HERO_VISIBLE_RATIO),
      { threshold: HERO_VISIBLE_RATIO },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      setHeroInView(false);
    };
  }, [ref, setHeroInView]);
}
