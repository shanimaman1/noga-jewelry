/**
 * Shared motion vocabulary so the whole site reads as one continuous flow.
 *
 * Luxury = slow, soft, short-travel: a gentle deceleration with no overshoot,
 * never a spring or a bounce.
 *
 * Scroll reveals are NOT defined here — they live in CSS on the `data-reveal`
 * attribute (styles/index.css) and are armed by hooks/useReveal.ts, so that the
 * default, un-scripted state of every element is *visible*. Only values still
 * needed by JS-driven effects (Parallax, CountUp, reveal sequencing) remain.
 */

/** Signature easing — cubic ease-out, no overshoot. Matches the CSS curve. */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Gap between staggered siblings, in seconds. */
export const STAGGER = 0.12;

/** Viewport ratio at which a reveal fires. Matches useReveal's threshold. */
export const REVEAL_THRESHOLD = 0.12;
