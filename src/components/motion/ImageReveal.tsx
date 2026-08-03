import { type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { DURATION, EASE, VIEWPORT } from '@/lib/motion/tokens';

/**
 * Editorial image reveal: a mask uncovers the photograph from the bottom
 * upward while the picture itself settles from a slight scale-up.
 *
 * The counter-motion is what makes it read as expensive — the frame opens and
 * the image relaxes into place, rather than a flat fade.
 *
 * `clip-path` and `transform` are both compositor-friendly. Framer Motion
 * writes them as inline styles on nodes React owns; no DOM surgery involved.
 */
export function ImageReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={`overflow-hidden ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`overflow-hidden ${className}`}
      initial={{ clipPath: 'inset(0% 0% 100% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={VIEWPORT}
      transition={{ duration: DURATION.image, ease: EASE, delay }}
    >
      <motion.div
        initial={{ scale: 1.12 }}
        whileInView={{ scale: 1 }}
        viewport={VIEWPORT}
        transition={{ duration: DURATION.image + 0.3, ease: EASE, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
