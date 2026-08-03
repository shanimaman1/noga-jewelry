import { useEffect } from 'react';
import Lenis from 'lenis';

/**
 * Lenis smooth scroll, driven by a single rAF loop.
 *
 * Deliberately standalone: scroll-driven animation is handled by Framer
 * Motion, which reads scroll position through its own observers and never
 * needs Lenis wired into it. Keeping this hook free of animation-library
 * coupling is what makes it safe to unmount.
 *
 * Disabled when the user prefers reduced motion (native scrolling instead).
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [enabled]);
}
