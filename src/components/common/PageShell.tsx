import { type ReactNode } from 'react';
import { Container } from './Container';

/** Simple inner-page header + content wrapper used by non-home pages. */
export function PageShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children?: ReactNode;
}) {
  return (
    <div className="py-20 sm:py-28">
      <Container>
        {kicker && <p className="text-xs tracking-luxury text-gold">{kicker}</p>}
        <h1 className="mt-3 text-3xl font-normal sm:text-4xl">{title}</h1>
        {children && <div className="mt-8 max-w-2xl leading-relaxed text-stone">{children}</div>}
      </Container>
    </div>
  );
}
