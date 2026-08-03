import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Editorial image reveal: a mask uncovers the picture from the bottom up.
 *
 * FAIL-OPEN, and deliberately so — an earlier fail-closed version applied
 * `clip-path: inset(0 0 100% 0)` as the *initial* style, which not only hid
 * the image when the observer didn't fire but also stopped `loading="lazy"`
 * images from ever being fetched.
 *
 * The mask is applied only after we have both an observer AND a safety timer
 * committed to removing it. Never used on catalogue product cards: a product
 * photo is the content, and must not be gated behind an animation.
 */

const SAFETY_MS = 2500;

export function ImageReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    // Already on screen — nothing to uncover, and masking now would flash.
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.style.transitionDelay = delay ? `${delay}s` : '';
    el.dataset.revealImage = 'armed';

    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      el.dataset.revealImage = 'in';
    };

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
    const safety = window.setTimeout(release, SAFETY_MS);

    return () => {
      window.clearTimeout(safety);
      io.disconnect();
      if (!released) delete el.dataset.revealImage;
    };
  }, [delay]);

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
