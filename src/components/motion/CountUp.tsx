import { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { VIEWPORT } from '@/lib/motion/tokens';

/**
 * Counts a number up as it enters view.
 *
 * Renders through React state rather than writing to the DOM directly, so the
 * text node stays under React's control and the value is always the real one
 * on the final frame. Reduced-motion users see the final figure immediately.
 */
export function CountUp({
  value,
  duration = 1600,
  className = '',
  suffix = '',
}: {
  value: number;
  /** Milliseconds. */
  duration?: number;
  className?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { once: VIEWPORT.once, amount: VIEWPORT.amount });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (reduced || !inView) return;

    let frame = 0;
    const start = performance.now();
    // Ease-out cubic — matches the site's reveal curve.
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(ease(t) * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
