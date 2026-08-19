import { Link } from 'react-router-dom';
import { getProduct } from '@/data/products';
import { ROUTES, whatsappUrl } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { CatalogImage } from '@/components/common/CatalogImage';
import { ProductCard } from '@/components/catalog/ProductCard';
import { Seo } from '@/components/seo/Seo';

/**
 * Gift guide — a distinct surface for the time-pressured gift buyer. Organized
 * to help someone decide (budget / occasion), not by product type like the
 * catalog. Every tier and occasion deep-links into a filtered catalog view.
 */

const budgetTiers = [
  {
    label: 'עד ₪1,500',
    copy: 'מתנה שמרגשת בלי להסתבך, עגילים, תליון או טבעת דקה.',
    image: 'earrings-tiny-studs',
    to: `${ROUTES.catalog}?max=1500`,
  },
  {
    label: '₪1,500–3,000',
    copy: 'הבחירה הפופולרית, שרשראות יהלום, חישוקים וצמידים.',
    image: 'necklace-gold-pendant',
    to: `${ROUTES.catalog}?min=1500&max=3000`,
  },
  {
    label: 'מעל ₪3,000',
    copy: 'לרגע גדול, סוליטר, יהלום מרכזי, משהו שזוכרים.',
    image: 'ring-solitaire-yellow',
    to: `${ROUTES.catalog}?min=3000`,
  },
];

const occasions = [
  {
    title: 'מתנה לבת זוג',
    copy: 'אם אין לך מושג מאיפה להתחיל, אלה הבחירות הבטוחות. עדין, קלאסי, ומתאים כמעט לכולן.',
    picks: ['single-diamond-necklace', 'mini-hoop-earrings', 'fine-diamond-band'],
    to: `${ROUTES.catalog}?category=necklaces`,
  },
  {
    title: 'יום נישואין',
    copy: 'משהו עם משקל לרגע משמעותי, יהלום מרכזי או פריט שמלווה שנים.',
    picks: ['solitaire-classic', 'heart-pendant-necklace', 'slim-bangle'],
    to: `${ROUTES.catalog}?min=3000`,
  },
  {
    title: 'מתנה קטנה ומרגשת',
    copy: 'לא צריך אירוע גדול. פריט עדין שאומר ״חשבתי עלייך״, בתקציב נוח.',
    picks: ['tiny-stud-earrings', 'floral-chain-necklace', 'pearl-drop-necklace'],
    to: `${ROUTES.catalog}?max=1500`,
  },
];

export function GiftGuide() {
  return (
    <>
      <Seo
        title="מדריך מתנות"
        description="לבחור מתנה בלי להיות מבינים בתכשיטים, לפי תקציב ולפי הזדמנות. סינון מהיר, ועזרה אישית בוואטסאפ."
        path="/gift-guide"
      />
      {/* Reassuring intro */}
      <section className="bg-charcoal py-20 text-cream sm:py-28">
        <Container className="max-w-3xl text-center">
          <p className="text-xs tracking-luxury text-gold">מדריך מתנות</p>
          <h1 className="mt-4 text-3xl font-normal leading-snug sm:text-5xl">
            לבחור מתנה, בלי להיות מבינים בתכשיטים
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-cream/70">
            רוב האנשים לא יודעים מה לחפש, וזה בסדר גמור. סיננו במקומך לפי תקציב
            ולפי ההזדמנות, כדי שתגיעו לבחירה נכונה בכמה קליקים.
          </p>
          <a
            href={whatsappUrl('היי, אני צריך עזרה בבחירת מתנה')}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-block rounded-full border border-gold px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-gold hover:text-charcoal"
          >
            לא בטוחים? נעזור לכם לבחור
          </a>
        </Container>
      </section>

      {/* By budget */}
      <section className="bg-cream py-20 sm:py-28" aria-labelledby="budget-title">
        <Container>
          <Reveal>
            <p className="text-xs tracking-luxury text-gold">שלב ראשון</p>
            <h2 id="budget-title" className="mt-4 text-2xl sm:text-3xl">
              לפי תקציב
            </h2>
          </Reveal>
          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {budgetTiers.map((tier, i) => (
              <li key={tier.label}>
                <Reveal delay={i * 0.06}>
                  <Link to={tier.to} className="group block">
                    <div className="overflow-hidden rounded-sm">
                      <CatalogImage
                        name={tier.image}
                        alt=""
                        className="aspect-[3/2] w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <p className="mt-5 text-xl text-charcoal transition-colors group-hover:text-gold">
                      {tier.label}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-stone">{tier.copy}</p>
                    <span className="mt-3 inline-block text-sm tracking-wide text-gold">
                      לצפייה בהצעות
                    </span>
                  </Link>
                </Reveal>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* By occasion */}
      <section className="bg-[#F2EEE6] py-20 sm:py-28" aria-labelledby="occasion-title">
        <Container>
          <Reveal>
            <p className="text-xs tracking-luxury text-gold">או פשוט</p>
            <h2 id="occasion-title" className="mt-4 text-2xl sm:text-3xl">
              לפי ההזדמנות
            </h2>
          </Reveal>

          <div className="mt-12 space-y-16">
            {occasions.map((occasion) => {
              const picks = occasion.picks.map(getProduct).filter((p) => p !== undefined);
              return (
                <Reveal key={occasion.title}>
                  <div>
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div className="max-w-xl">
                        <h3 className="text-xl text-charcoal">{occasion.title}</h3>
                        <p className="mt-2 leading-relaxed text-stone">{occasion.copy}</p>
                      </div>
                      <Link
                        to={occasion.to}
                        className="text-sm tracking-wide text-charcoal underline-offset-4 transition-colors hover:text-gold hover:underline"
                      >
                        לכל ההצעות
                      </Link>
                    </div>
                    <ul className="mt-6 grid gap-6 sm:grid-cols-3">
                      {picks.map((product) => (
                        <li key={product!.slug}>
                          <ProductCard product={product!} />
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Closing reassurance */}
      <section className="bg-cream py-16 sm:py-20">
        <Container className="max-w-2xl text-center">
          <p className="leading-relaxed text-stone">
            עדיין מתלבטים? כתבו לנו כמה מילים על מי שמקבל/ת את המתנה ועל התקציב,
            ונשלח כמה הצעות אישיות.
          </p>
          <a
            href={whatsappUrl('היי, אשמח לכמה הצעות למתנה')}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block rounded-full bg-charcoal px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90"
          >
            שיחה בוואטסאפ
          </a>
        </Container>
      </section>
    </>
  );
}
