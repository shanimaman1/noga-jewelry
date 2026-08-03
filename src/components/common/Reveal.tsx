import { Children, type ReactNode } from 'react';
import { useReveal } from '@/hooks/useReveal';
import { STAGGER } from '@/lib/motion/tokens';

/**
 * Fade-and-rise as the element scrolls into view.
 *
 * FAIL-OPEN: the rendered markup carries no hiding styles. Content is visible
 * on first paint and stays visible unless useReveal positively arms it — and
 * arming is only ever done alongside a guaranteed release (observer + safety
 * timer). See hooks/useReveal.ts for the four guarantees.
 *
 * API is unchanged from the previous Framer Motion version (`delay`,
 * `stagger`, `className`) so existing call sites need no edits.
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
  if (stagger) return <StaggerReveal delay={delay} className={className}>{children}</StaggerReveal>;
  return <SingleReveal delay={delay} className={className}>{children}</SingleReveal>;
}

function SingleReveal({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className: string;
}) {
  const ref = useReveal<HTMLDivElement>(delay);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** Reveals each direct child in sequence, so a heading lands before its body. */
function StaggerReveal({
  children,
  delay,
  className,
}: {
  children: ReactNode;
  delay: number;
  className: string;
}) {
  return (
    <div className={className}>
      {Children.map(children, (child, i) => (
        <StaggerChild delay={delay + i * STAGGER}>{child}</StaggerChild>
      ))}
    </div>
  );
}

function StaggerChild({ children, delay }: { children: ReactNode; delay: number }) {
  const ref = useReveal<HTMLDivElement>(delay);
  return <div ref={ref}>{children}</div>;
}
