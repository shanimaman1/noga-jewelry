import { type ReactNode } from 'react';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';
import { useReveal } from '@/hooks/useReveal';
import { STAGGER } from '@/lib/motion/tokens';

type Reason = { title: string; text: string; icon: ReactNode };

const iconProps = {
  width: 28,
  height: 28,
  viewBox: '0 0 32 32',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.1,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

const reasons: Reason[] = [
  {
    title: 'עבודת יד',
    text: 'כל פריט נוצר באטלייה בתל אביב, לא בייצור המוני.',
    icon: (
      <svg {...iconProps}>
        <path d="M8 24c0-5 3.6-8 8-8s8 3 8 8" />
        <path d="M12 12l4-5 4 5-4 3z" />
      </svg>
    ),
  },
  {
    title: 'תעודת יהלום',
    text: 'לכל יהלום מעל 0.3 קראט מצורפת תעודת מעבדה.',
    icon: (
      <svg {...iconProps}>
        <path d="M6 13l10-6 10 6-10 12z" />
        <path d="M6 13h20M16 7v18" />
      </svg>
    ),
  },
  {
    title: 'החלפה תוך 30 יום',
    text: 'מידה לא מדויקת או שינוי דעה, מחליפים בלי סיבוכים.',
    icon: (
      <svg {...iconProps}>
        <path d="M25 16a9 9 0 1 1-3.2-6.9" />
        <path d="M26 6v5h-5" />
      </svg>
    ),
  },
  {
    title: 'אריזת מתנה',
    text: 'קופסה, סרט וכרטיס בכתב יד, נשלח מוכן להענקה.',
    icon: (
      <svg {...iconProps}>
        <path d="M6 13h20v13H6zM6 13l3-5h14l3 5M16 13v13" />
      </svg>
    ),
  },
];

/**
 * "Why NOGA" — a plain, robust section: heading reveal + a 4-up grid that
 * staggers in when it enters view. No pinning, no tall spacer, no scroll-scrub
 * (an earlier pinned version created a huge empty band that read as broken, and
 * the GSAP pin before it crashed on unmount). Under reduced motion it renders
 * fully visible with no animation.
 */
export function WhyNoga() {
  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="why-title">
      <Container>
        <Reveal>
          <SectionHeading
            kicker="למה נוגה"
            title={<span id="why-title">מה נכלל בכל הזמנה</span>}
            align="center"
          />
        </Reveal>

        <ul className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map((reason, i) => (
            <ReasonItem key={reason.title} reason={reason} index={i} />
          ))}
        </ul>
      </Container>
    </section>
  );
}

/** One point, revealed in sequence via the fail-open hook. */
function ReasonItem({ reason, index }: { reason: Reason; index: number }) {
  const ref = useReveal<HTMLLIElement>(index * STAGGER);
  return (
    <li ref={ref} className="text-center">
      <span className="inline-flex text-gold">{reason.icon}</span>
      <h3 className="mt-4 text-base text-charcoal">{reason.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone">{reason.text}</p>
    </li>
  );
}
