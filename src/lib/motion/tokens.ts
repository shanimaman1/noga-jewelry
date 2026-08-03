import type { Transition, Variants } from 'motion/react';

/**
 * Shared motion vocabulary so the whole site reads as one continuous flow.
 *
 * Luxury = slow, soft, short-travel. A gentle deceleration curve with no
 * overshoot — never spring, never bounce.
 *
 * Everything here animates `opacity` and `transform` only, which the browser
 * can composite off the main thread. Nothing in this file can cause layout.
 */

/** Signature easing — cubic ease-out, no overshoot. */
export const EASE = [0.22, 1, 0.36, 1] as const;

export const DURATION = {
  reveal: 0.9,
  image: 1.2,
} as const;

/** Vertical travel for a reveal, in px. Small on purpose. */
export const TRAVEL = 32;

/** Gap between staggered siblings, in seconds. */
export const STAGGER = 0.12;

/**
 * Viewport options: play once, when ~12% of the element is visible.
 * Uses `amount` (intersection ratio), NOT a `%` rootMargin — a mixed-unit
 * margin was leaving tall sections stuck at opacity:0 in the production build
 * (the reveal never fired, so content stayed invisible). `amount` is reliable
 * for elements of any height.
 */
export const VIEWPORT = { once: true, amount: 0.12 } as const;

export const revealTransition: Transition = {
  duration: DURATION.reveal,
  ease: EASE,
};

/** Parent that staggers its children. Pair with `revealChild`. */
export const staggerParent: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: STAGGER },
  },
};

export const revealChild: Variants = {
  hidden: { opacity: 0, y: TRAVEL },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};
