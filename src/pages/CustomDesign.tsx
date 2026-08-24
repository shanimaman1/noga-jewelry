import { useState, type FormEvent } from 'react';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { CatalogImage } from '@/components/common/CatalogImage';
import { Field, TextAreaField } from '@/components/ui/Field';
import { Seo } from '@/components/seo/Seo';

type Errors = Record<string, string>;

const PHONE_RE = /^0(5\d|[2-489])[-\s]?\d{7}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const steps = [
  { n: '01', title: 'שיחת היכרות', text: 'נשב יחד (או בזום) ונבין מה את מחפשת, סגנון, תקציב, אבן, הזדמנות.' },
  { n: '02', title: 'שרטוט והצעה', text: 'דנה מכינה שרטוט והדמיה, עם הצעת מחיר מדויקת. מדייקים עד שזה מרגיש נכון.' },
  { n: '03', title: 'יצירה באטלייה', text: 'התכשיט נוצר בעבודת יד. בדרך כלל 3–4 שבועות, ואת מעודכנת לאורך הדרך.' },
];

/** Custom design — process explanation + lead form (sends nowhere in demo). */
export function CustomDesign() {
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const get = (k: string) => (data.get(k) as string | null)?.trim() ?? '';

    const found: Errors = {};
    if (!get('name')) found.name = 'צריך למלא שם';
    if (!get('phone')) found.phone = 'צריך למלא טלפון';
    else if (!PHONE_RE.test(get('phone'))) found.phone = 'מספר טלפון לא תקין';
    if (!get('email')) found.email = 'צריך למלא מייל';
    else if (!EMAIL_RE.test(get('email'))) found.email = 'כתובת המייל לא נראית תקינה';
    if (!get('dream')) found.dream = 'ספרי לנו קצת מה את מדמיינת';

    setErrors(found);
    if (Object.keys(found).length > 0) {
      form.querySelector<HTMLElement>(`[name="${Object.keys(found)[0]}"]`)?.focus();
      return;
    }

    // DEMO ONLY — nothing is sent. In production this lead would be delivered
    // to Dana's inbox via EmailJS / Formspree (static site) or a serverless
    // form endpoint, ideally with an autoresponder to the customer.
    setSent(true);
    form.reset();
  };

  return (
    <>
      <Seo
        title="עיצוב אישי"
        description="נתכנן יחד תכשיט משלך, משיחת היכרות, דרך שרטוט והצעה, ועד יצירה בעבודת יד באטלייה."
        path="/custom"
      />
      {/* Intro */}
      <section className="bg-charcoal py-20 text-cream sm:py-28">
        <Container className="max-w-3xl text-center">
          <p className="text-xs tracking-luxury text-gold">עיצוב אישי</p>
          <h1 className="mt-4 text-3xl font-normal leading-snug sm:text-5xl">
            נתכנן יחד תכשיט משלך
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-cream/70">
            טבעת אירוסין, תכשיט לציון רגע, או פשוט משהו שלא מצאת בשום מקום. נתחיל
            משיחה, ונבנה אותו מהשרטוט הראשון.
          </p>
        </Container>
      </section>

      {/* Process */}
      <section className="bg-cream py-20 sm:py-28" aria-labelledby="process-title">
        <Container>
          <Reveal>
            <h2 id="process-title" className="text-2xl sm:text-3xl">
              איך זה עובד
            </h2>
          </Reveal>
          <ol className="mt-12 grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.n}>
                <Reveal delay={i * 0.06}>
                  <p className="font-heading text-3xl text-gold">{step.n}</p>
                  <h3 className="mt-4 text-lg text-charcoal">{step.title}</h3>
                  <p className="mt-2 leading-relaxed text-stone">{step.text}</p>
                </Reveal>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Lead form */}
      <section className="bg-[#F2EEE6] py-20 sm:py-28" aria-labelledby="form-title">
        <Container>
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <Reveal>
              <div className="overflow-hidden rounded-sm">
                <CatalogImage
                  name="ring-solitaire-rose"
                  alt="טבעת סוליטר בזהב אדום, דוגמה לעבודת עיצוב אישי"
                  className="aspect-[4/5] w-full"
                  full
                />
              </div>
            </Reveal>

            <div>
              <h2 id="form-title" className="text-2xl sm:text-3xl">
                נשמח לשמוע מה בראש
              </h2>
              <p className="mt-4 leading-relaxed text-stone">
                השאירי פרטים וכמה מילים על מה שאת מדמיינת. במצב ההדגמה הפרטים
                נבדקים בדפדפן בלבד ואינם נשלחים או נשמרים.
              </p>

              {sent ? (
                <div
                  role="status"
                  className="mt-8 rounded-sm border border-gold/50 bg-cream p-6 leading-relaxed text-charcoal"
                >
                  הפרטים תקינים. זו הדגמה בלבד, והפנייה אינה נשלחת ואינה נשמרת.
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
                  <Field label="שם מלא" name="name" autoComplete="name" error={errors.name} />
                  <Field label="טלפון" name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" placeholder="050-0000000" error={errors.phone} />
                  <Field label="אימייל" name="email" type="email" inputMode="email" autoComplete="email" dir="ltr" placeholder="your@email.com" error={errors.email} />
                  <TextAreaField label="מה את מדמיינת?" name="dream" placeholder="סוג התכשיט, סגנון, אבן, תקציב משוער, מועד יעד..." />
                  {errors.dream && (
                    <p role="alert" className="text-xs text-red-800">
                      {errors.dream}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="w-full rounded-full bg-charcoal px-8 py-4 text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90 sm:w-auto"
                  >
                    בדיקת הפרטים
                  </button>
                </form>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
