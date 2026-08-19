import { BRAND, whatsappUrl } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';

const features = [
  'ניווט מלא באמצעות מקלדת, עם סימון ברור של הרכיב שבפוקוס.',
  'מבנה כותרות היררכי ותגיות סמנטיות לקוראי מסך.',
  'טקסט חלופי לתמונות המוצרים ולתוכן הוויזואלי.',
  'ניגודיות צבעים העומדת ביחס של 4.5:1 לפחות בטקסט.',
  'כיבוד העדפת המערכת ״צמצום תנועה״ (prefers-reduced-motion).',
  'טפסים עם תוויות מקושרות והודעות שגיאה ברורות.',
  'תמיכה מלאה בעברית ובכיווניות מימין לשמאל.',
];

/** Accessibility statement — IS 5568 / WCAG 2.0 AA. */
export function Accessibility() {
  // Last-reviewed date, shown in the statement per IS 5568 guidance.
  const updated = new Date().toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'long',
  });

  return (
    <div className="py-14 sm:py-20">
      <Seo
        title="הצהרת נגישות"
        description="אתר נוגה נבנה לעמידה בתקן הישראלי ת״י 5568 ובהנחיות WCAG 2.0 AA."
        path="/accessibility"
      />
      <Container className="max-w-3xl">
        <p className="text-xs tracking-luxury text-gold">נגישות</p>
        <h1 className="mt-4 text-3xl sm:text-4xl">הצהרת נגישות</h1>

        <div className="mt-8 space-y-10 leading-relaxed text-stone">
          <section>
            <p>
              ב{BRAND.nameHe} אנו רואים חשיבות בכך שהאתר יהיה נגיש לכלל הגולשים,
              לרבות אנשים עם מוגבלות. האתר נבנה במטרה לעמוד בדרישות תקן הנגישות
              הישראלי (ת״י 5568) ובהנחיות{' '}
              <span dir="ltr" className="text-charcoal">
                WCAG 2.0
              </span>{' '}
              ברמת התאמה AA.
            </p>
          </section>

          <section aria-labelledby="features-title">
            <h2 id="features-title" className="text-2xl text-charcoal">
              מה נגיש באתר
            </h2>
            <ul className="mt-5 list-disc space-y-2 ps-5">
              {features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="limits-title">
            <h2 id="limits-title" className="text-2xl text-charcoal">
              התאמות ומגבלות
            </h2>
            <p className="mt-5">
              חלק מהעמודים כוללים תצוגת תלת־ממד אינטראקטיבית. עבור גולשים שהגדירו
              במערכת ההפעלה העדפה לצמצום תנועה, מוצגת חלופה סטטית ללא אנימציה.
              אנו ממשיכים לשפר את נגישות האתר באופן שוטף. אם נתקלת ברכיב שאינו
              נגיש, נשמח שתעדכנו אותנו כדי שנוכל לתקן.
            </p>
          </section>

          <section aria-labelledby="contact-title">
            <h2 id="contact-title" className="text-2xl text-charcoal">
              פנייה בנושא נגישות
            </h2>
            <p className="mt-5">
              לכל שאלה, בקשה או דיווח על בעיית נגישות, אפשר לפנות לרכזת הנגישות
              שלנו:
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                דוא״ל:{' '}
                <a
                  href={`mailto:${BRAND.email}`}
                  className="text-charcoal underline underline-offset-4 hover:text-gold"
                >
                  {BRAND.email}
                </a>
              </li>
              <li>
                וואטסאפ:{' '}
                <a
                  href={whatsappUrl('היי, אני פונה בנושא נגישות האתר')}
                  target="_blank"
                  rel="noreferrer"
                  className="text-charcoal underline underline-offset-4 hover:text-gold"
                >
                  {BRAND.whatsapp}
                </a>
              </li>
            </ul>
            <p className="mt-6 text-sm">הצהרה זו עודכנה לאחרונה ב{updated}.</p>
            <p className="mt-2 text-sm text-stone/80">
              (זהו אתר הדגמה לפורטפוליו - פרטי הקשר הם לצורך המחשה בלבד.)
            </p>
          </section>
        </div>
      </Container>
    </div>
  );
}
