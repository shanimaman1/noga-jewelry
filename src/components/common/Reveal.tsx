import { Children, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import {
  VIEWPORT,
  revealChild,
  revealTransition,
  staggerParent,
  TRAVEL,
} from '@/lib/motion/tokens';

/**
 * Fade-and-rise as the element scrolls into view.
 *
 * Implemented with Framer Motion, which only ever writes `style` on elements
 * React already owns — it never inserts, removes or reparents DOM nodes. That
 * is what makes it safe to unmount mid-animation during route changes.
 *
 * With `stagger`, each direct child is wrapped and revealed in sequence, so a
 * section's heading arrives before its body and cards.
 *
 * Under `prefers-reduced-motion` the content renders plainly, with no
 * animation and no leftover transforms.
 */
export function Reveal({
  children,
  delay = 0,
  stagger = false,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  stagger?: boolean;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  if (stagger) {
    return (
      <motion.div
        className={className}
        variants={staggerParent}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        transition={{ delayChildren: delay }}
      >
        {Children.map(children, (child, i) => (
          <motion.div key={i} variants={revealChild}>
            {child}
          </motion.div>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: TRAVEL }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ ...revealTransition, delay }}
    >
      {children}
    </motion.div>
  );
}
