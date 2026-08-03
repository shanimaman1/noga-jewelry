import { Link } from 'react-router-dom';
import { ROUTES, whatsappUrl } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { SectionHeading } from '@/components/common/SectionHeading';

/**
 * Gift guide by price — the fast path for the time-pressured gift buyer.
 * Each tier links to a pre-filtered catalog view.
 */
const tiers = [
  {
    label: 'עד ₪1,500',
    note: 'עגילים, תליונים וטבעות דקות',
    query: 'max=1500',
  },
  {
    label: '₪1,500–3,000',
    note: 'שרשראות יהלום וצמידים',
    query: 'min=1500&max=3000',
  },
  {
    label: 'מעל ₪3,000',
    note: 'סוליטר ופריטי יהלום מרכזיים',
    query: 'min=3000',
  },
];

export function GiftGuide() {
  return (
    <section className="bg-charcoal py-20 text-cream sm:py-28" aria-labelledby="gift-title">
      <Container>
        <Reveal>
          <SectionHeading
            kicker="מדריך מתנות"
            title={<span id="gift-title">לבחור מתנה לפי תקציב</span>}
            intro="אם יש לך מעט זמן, זו הדרך המהירה. אפשר גם לכתוב לנו ונעזור בבחירה."
            tone="dark"
            align="center"
          />
        </Reveal>

        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {tiers.map((tier, i) => (
            <li key={tier.label}>
              <Reveal delay={i * 0.06}>
                <Link
                  to={`${ROUTES.catalog}?gift=1&${tier.query}`}
                  className="group flex h-full flex-col justify-between rounded-sm border border-cream/15 p-8 transition-colors hover:border-gold"
                >
                  <div>
                    <p className="text-xl text-cream transition-colors group-hover:text-gold">
                      {tier.label}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-cream/60">{tier.note}</p>
                  </div>
                  <span className="mt-8 text-sm tracking-wide text-gold">לצפייה בפריטים</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        <Reveal delay={0.2}>
          <p className="mt-12 text-center text-sm text-cream/60">
            עוד מתלבטים?{' '}
            <a
              href={whatsappUrl('היי, אשמח לעזרה בבחירת מתנה')}
              target="_blank"
              rel="noreferrer"
              className="text-cream underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              נשמח לעזור בוואטסאפ
            </a>
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
