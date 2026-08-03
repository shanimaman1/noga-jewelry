import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';
import { ringSizes } from '@/data/sizes';

const measureSteps = [
  'גזרי רצועת נייר דקה, ברוחב כחצי סנטימטר.',
  'עטפי אותה סביב בסיס האצבע — צמוד, אך כך שתעבור מעל הפרק.',
  'סמני בעט את נקודת המפגש, ומדדי את האורך בסרגל במילימטרים.',
  'המספר שקיבלת הוא ההיקף. אתרי אותו בטבלה כדי לקבל את המידה.',
];

const careItems = [
  {
    title: 'ענידה יומיומית',
    text: 'הסירי תכשיטים לפני מקלחת, ים, בריכה, ואימון. סבון, כלור ומי מלח פוגעים בברק ובאבנים.',
  },
  {
    title: 'ניקוי בבית',
    text: 'השרייה קצרה במים פושרים עם טיפת סבון עדין, הברשה עדינה במברשת שיניים רכה, וייבוש במטלית מיקרופייבר.',
  },
  {
    title: 'יהלומים',
    text: 'יהלום מושך שומן ולכן מאבד ברק עם הזמן. ניקוי אחת לכמה שבועות מחזיר את הנצנוץ. אנחנו נשמח לנקות ולבדוק שיבוץ ללא תשלום.',
  },
  {
    title: 'אחסון',
    text: 'שמרי כל פריט בנפרד — בשקית בד או בתא נפרד בקופסה — כדי שלא ישרטו זה את זה. זהב רך יחסית ונשרט במגע עם מתכות אחרות.',
  },
];

/** Size & care guide — practical, clear, brand voice. */
export function SizeCare() {
  return (
    <div className="py-14 sm:py-20">
      <Seo
        title="מדריך מידות וטיפוח"
        description="איך למדוד מידת טבעת בבית, טבלת מידות ישראלית, ואיך לשמור על זהב ויהלומים."
        path="/size-care"
      />
      <Container className="max-w-3xl">
        <p className="text-xs tracking-luxury text-gold">מדריך</p>
        <h1 className="mt-4 text-3xl sm:text-4xl">מידות וטיפוח</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-stone">
          איך למדוד מידת טבעת בבית, טבלת מידות, ואיך לשמור על התכשיט שיישאר יפה
          לאורך שנים.
        </p>

        {/* Measure at home */}
        <section className="mt-14" aria-labelledby="measure-title">
          <h2 id="measure-title" className="text-2xl">
            מדידת מידת טבעת בבית
          </h2>
          <ol className="mt-6 list-decimal space-y-3 ps-5 leading-relaxed text-stone">
            {measureSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 leading-relaxed text-stone">
            כדאי למדוד בסוף היום, כשהאצבעות בנפח מלא, ולחזור על המדידה פעמיים.
            אם יצאת בין שתי מידות — עדיף לעגל למידה הגדולה.
          </p>
        </section>

        {/* Chart */}
        <section className="mt-14" aria-labelledby="chart-title">
          <h2 id="chart-title" className="text-2xl">
            טבלת מידות
          </h2>
          <p className="mt-3 leading-relaxed text-stone">
            בישראל, מידת הטבעת היא הקוטר הפנימי במילימטרים.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[320px] border-collapse text-start">
              <caption className="sr-only">
                המרה בין מידת טבעת ישראלית להיקף פנימי במילימטרים
              </caption>
              <thead>
                <tr className="border-b border-mist">
                  <th scope="col" className="py-3 text-start font-normal text-charcoal">
                    מידה (קוטר)
                  </th>
                  <th scope="col" className="py-3 text-start font-normal text-charcoal">
                    היקף פנימי
                  </th>
                </tr>
              </thead>
              <tbody>
                {ringSizes.map((row) => (
                  <tr key={row.size} className="border-b border-mist/60">
                    <td className="py-3">{row.size} מ"מ</td>
                    <td className="py-3">{row.circumference} מ"מ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Care */}
        <section className="mt-14" aria-labelledby="care-title">
          <h2 id="care-title" className="text-2xl">
            טיפוח זהב ויהלומים
          </h2>
          <dl className="mt-6 space-y-6">
            {careItems.map((item) => (
              <div key={item.title} className="border-t border-mist pt-5">
                <dt className="text-base text-charcoal">{item.title}</dt>
                <dd className="mt-2 leading-relaxed text-stone">{item.text}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className="mt-14 rounded-sm border border-mist p-6 text-sm leading-relaxed text-stone">
          לא בטוחה לגבי מידה, או שרוצה לרענן תכשיט ותיק? אפשר לכתוב לנו בוואטסאפ
          ונעזור. וכמובן — ההחלפה אפשרית תוך 30 יום.
        </p>
      </Container>
    </div>
  );
}
