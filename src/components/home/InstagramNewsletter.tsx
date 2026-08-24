import { useId, useState, type FormEvent } from 'react';
import { BRAND, DEMO_CONTACT_LABEL } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { CatalogImage } from '@/components/common/CatalogImage';

// Six real catalogue frames standing in for an Instagram feed.
const FEED = [
  { name: 'editorial-necklace-onbody', alt: 'שרשראות זהב עדינות ענודות על הצוואר' },
  { name: 'ring-fine-band', alt: 'טבעות זהב דקות משובצות יהלומים זעירים' },
  { name: 'earrings-fine-hoops', alt: 'עגילי חישוק קטנים מזהב' },
  { name: 'bracelet-fine-chain', alt: 'צמיד חוליות זהב דק ענוד על היד' },
  { name: 'necklace-pearl-drop', alt: 'פנינה בודדת על שרשרת זהב דקה' },
  { name: 'necklace-bezel-chain', alt: 'שרשרת זהב דקה עם אבנים זעירות' },
] as const;

// Simple, permissive check — deliberately not an RFC-complete regex.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function InstagramNewsletter() {
  const emailId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();

    if (!value) {
      setError('צריך למלא כתובת מייל');
      return;
    }
    if (!EMAIL_RE.test(value)) {
      setError('כתובת המייל לא נראית תקינה');
      return;
    }

    // DEMO ONLY — nothing is sent anywhere.
    // In production this would POST to an email provider:
    // EmailJS / Formspree for a static site, or a Mailchimp / ActiveTrail
    // list (ActiveTrail is the common Israeli choice) via a serverless route.
    setError(null);
    setDone(true);
    setEmail('');
  };

  return (
    <section className="bg-cream py-20 sm:py-28" aria-labelledby="follow-title">
      <Container>
        {/* Instagram strip */}
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs tracking-luxury text-gold">אינסטגרם</p>
              <h2 id="follow-title" className="mt-4 text-2xl text-charcoal sm:text-3xl">
                מהשולחן באטלייה
              </h2>
            </div>
            <a
              href={`https://instagram.com/${BRAND.instagram}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm tracking-wide text-charcoal underline-offset-4 transition-colors hover:text-gold hover:underline"
            >
              @{BRAND.instagram} · {DEMO_CONTACT_LABEL}
            </a>
          </div>
        </Reveal>

        <ul className="mt-10 grid grid-cols-3 gap-3 sm:gap-4 lg:grid-cols-6">
          {FEED.map((post, i) => (
            <li key={post.name}>
              <Reveal delay={i * 0.04}>
                <a
                  href={`https://instagram.com/${BRAND.instagram}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`פוסט הדגמה ${i + 1} באינסטגרם של נוגה`}
                  className="block overflow-hidden rounded-sm"
                >
                  <CatalogImage
                    name={post.name}
                    alt={post.alt}
                    className="aspect-square w-full transition-transform duration-700 ease-out hover:scale-[1.04]"
                  />
                </a>
              </Reveal>
            </li>
          ))}
        </ul>

        {/* Newsletter */}
        <Reveal delay={0.1}>
          <div className="mt-20 border-t border-mist pt-14 text-center">
            <h2 className="text-2xl text-charcoal sm:text-3xl">קבלי עדכון על פריטים חדשים</h2>
            <p className="mx-auto mt-4 max-w-md leading-relaxed text-stone">
              מייל אחד בחודש, לפעמים פחות. רק כשיש משהו חדש באטלייה.
            </p>
            <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed text-stone">
              מצב הדגמה - הכתובת אינה נשלחת ולא נשמרת.
            </p>

            {done ? (
              <p
                role="status"
                className="mx-auto mt-8 max-w-md rounded-sm border border-gold/40 px-6 py-4 text-charcoal"
              >
                הכתובת תקינה. מצב הדגמה - הכתובת אינה נשלחת ולא נשמרת.
              </p>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row"
              >
                <label htmlFor={emailId} className="sr-only">
                  כתובת מייל
                </label>
                <input
                  id={emailId}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="your@email.com"
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  className={`w-full rounded-full border bg-transparent px-6 py-3 text-start text-charcoal placeholder:text-stone/60 focus:outline-none ${
                    error ? 'border-red-700' : 'border-charcoal/25 focus:border-gold'
                  }`}
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-charcoal px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90"
                >
                  בדיקת כתובת
                </button>
              </form>
            )}

            {error && (
              <p id={errorId} role="alert" className="mt-3 text-sm text-red-800">
                {error}
              </p>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
