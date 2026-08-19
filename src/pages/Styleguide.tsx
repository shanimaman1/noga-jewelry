// Locked type-scale style guide. The font decision is settled: David Libre 400
// for all headings (via the --font-heading token), Assistant for body.
// This page imports NO fonts of its own — every heading below uses a real
// h1–h4 tag, so it inherits the global heading token. If a heading here renders
// in David Libre, so does every heading on the site.
import { BRAND } from '@/lib/constants';

const HERO = 'תכשיט אחד שתלבשי כל יום - לא עשרה נשכחים במגירה';

export default function Styleguide() {
  return (
    <div className="bg-charcoal px-6 py-20 text-cream sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-luxury text-gold">מדריך טיפוגרפיה</p>
        <h1 className="mt-2">כותרות · David Libre · משקל 400</h1>
        <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-cream/60">
          זו הבחירה הנעולה: David Libre (סריף עברי) במשקל 400 לכל הכותרות, דרך טוקן
          יחיד. הגוף נשאר Assistant. כל שורה למטה היא תג כותרת אמיתי שיורש את הטוקן,
          כך אפשר לאמת שכל רמות הכותרת קיבלו את השינוי, לא רק ה-Hero.
        </p>

        {/* Heading scale — real tags, inheriting --font-heading */}
        <div className="mt-14 space-y-10">
          <Row label="H1 · כותרת Hero">
            <h1 className="text-3xl leading-tight sm:text-5xl">{HERO}</h1>
          </Row>
          <Row label="H2 · כותרת סקשן">
            <h2 className="text-2xl sm:text-3xl">העבודה שלנו מתחילה בסטודיו בתל אביב</h2>
          </Row>
          <Row label="H3 · תת-כותרת">
            <h3 className="text-xl sm:text-2xl">זהב 14 ו-18 קראט, יהלומים טבעיים ומעבדה</h3>
          </Row>
          <Row label="H4 · כותרת משנה">
            <h4 className="text-lg">ליווי אישי מהבחירה ועד התכשיט המוגמר</h4>
          </Row>

          <Row label="גוף · Assistant, משקל 400">
            <p className="max-w-2xl font-body leading-relaxed text-cream/80">
              {BRAND.tagline}. דנה, צורפת בוגרת בצלאל, מלווה כל לקוחה לאורך כל הדרך,
              עבודת יד, חומרים אמיתיים, ותשומת לב לכל פרט.
            </p>
          </Row>
        </div>

        {/* Same headings on cream, to check both contexts */}
        <div className="mt-16 rounded-lg bg-cream p-8 text-charcoal">
          <p className="text-xs tracking-luxury text-gold">על רקע קרם</p>
          <h2 className="mt-3 text-2xl sm:text-3xl">אותה כותרת, רקע בהיר</h2>
          <p className="mt-3 max-w-2xl font-body leading-relaxed text-stone">
            בדיקת קריאוּת וניגודיות של הכותרת והגוף על הרקע הבהיר של האתר.
          </p>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs tracking-luxury text-gold">{label}</p>
      {children}
      <hr className="mt-8 border-cream/10" />
    </div>
  );
}
