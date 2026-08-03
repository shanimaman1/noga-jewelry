import { type ReactNode } from 'react';

/**
 * Section eyebrow + heading. Headings inherit David Libre 400 from the base
 * layer — never bold. `tone` switches between cream and charcoal surfaces.
 */
export function SectionHeading({
  kicker,
  title,
  intro,
  tone = 'light',
  align = 'start',
}: {
  kicker?: string;
  title: ReactNode;
  intro?: ReactNode;
  tone?: 'light' | 'dark';
  align?: 'start' | 'center';
}) {
  const isDark = tone === 'dark';
  return (
    <div className={align === 'center' ? 'text-center' : ''}>
      {kicker && <p className="text-xs tracking-luxury text-gold">{kicker}</p>}
      <h2
        className={`mt-4 max-w-2xl text-2xl leading-snug sm:text-3xl ${
          isDark ? 'text-cream' : 'text-charcoal'
        } ${align === 'center' ? 'mx-auto' : ''}`}
      >
        {title}
      </h2>
      {intro && (
        <p
          className={`mt-4 max-w-xl leading-relaxed ${isDark ? 'text-cream/70' : 'text-stone'} ${
            align === 'center' ? 'mx-auto' : ''
          }`}
        >
          {intro}
        </p>
      )}
    </div>
  );
}
