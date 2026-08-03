import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useMediaQuery } from '@/hooks/useMediaQuery';

/**
 * Depth by differential speed: the wrapped content drifts vertically as the
 * section crosses the viewport, slightly out of step with the text beside it.
 *
 * `strength` is the total travel in px across the pass — keep it small
 * (24–70). Larger reads as a gimmick rather than depth.
 *
 * Driven by Framer Motion's `useScroll`, which observes scroll position and
 * writes a `y` transform. Vertical only, so it behaves identically in RTL.
 */
export function Parallax({
  children,
  strength = 48,
  className = '',
  /** Off on small screens by default, to protect frame rate. */
  desktopOnly = true,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
  desktopOnly?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [strength / 2, -strength / 2]);

  const disabled = reduced || (isMobile && desktopOnly);

  if (disabled) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}
