import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { CatalogImage } from '@/components/common/CatalogImage';
import { AmbientRing } from '@/three/story/AmbientRing';
import { Seo } from '@/components/seo/Seo';

/** Dana / the atelier — the trust-building story page. */
export function Story() {
  return (
    <>
      <Seo
        title="הסיפור של נוגה"
        description="דנה, צורפת בוגרת בצלאל עם 12 שנות ניסיון, והאטלייה בתל אביב. פחות דגמים, כל אחד בעבודת יד."
        path="/story"
        type="article"
      />
      {/* Intro on charcoal */}
      <section className="bg-charcoal py-20 text-cream sm:py-28">
        <Container className="max-w-3xl text-center">
          <p className="text-xs tracking-luxury text-gold">הסיפור</p>
          <h1 className="mt-4 text-3xl font-normal leading-snug sm:text-5xl">
            תכשיט אחד, נכון, שנשאר איתך
          </h1>
          <p className="mx-auto mt-6 max-w-xl leading-relaxed text-cream/70">
            נוגה נולדה מתוך מחשבה פשוטה: עדיף מעט תכשיטים שבאמת אוהבים ועונדים,
            על פני מגירה מלאה בכאלה שנשכחו.
          </p>
        </Container>
      </section>

      {/* Dana */}
      <section className="bg-cream py-20 sm:py-28" aria-labelledby="dana-title">
        <Container>
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
            {/* Ambient 3D ring — the story page's single 3D moment. */}
            <Reveal className="md:order-2">
              <AmbientRing />
            </Reveal>
            <Reveal delay={0.08} className="md:order-1">
              <h2 id="dana-title" className="text-2xl leading-snug sm:text-3xl">
                דנה, צורפת. שתים־עשרה שנה ליד השולחן.
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-stone">
                <p>
                  דנה סיימה צורפות בבצלאל, ואת שתים־עשרה השנים הבאות עבדה אצל אחרים,
                  בבתי מלאכה, בסטודיו לתכשיטים, ובמעבדות יהלומים. שם למדה את המקצוע
                  לעומק: ליטוש, הלחמה, שיבוץ, והבנה של איך אבן יושבת נכון על מתכת.
                </p>
                <p>
                  בשלב מסוים הבינה שהיא רוצה לעבוד אחרת, מול אנשים, לא מול הזמנות
                  אנונימיות. כך נפתח האטלייה בתל אביב, ודנה קראה לו נוגה, על שם בתה.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Philosophy */}
      <section className="bg-[#F2EEE6] py-20 sm:py-28" aria-labelledby="philosophy-title">
        <Container className="max-w-3xl">
          <Reveal>
            <p className="text-xs tracking-luxury text-gold">הגישה</p>
            <h2 id="philosophy-title" className="mt-4 text-2xl leading-snug sm:text-3xl">
              פחות דגמים, כל אחד בעבודת יד
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-stone">
              <p>
                בנוגה אין מאות דגמים. יש אוסף מצומצם של פריטים שנבחרו בקפידה, וכל
                אחד מהם נוצר ידנית באטלייה, לא בייצור המוני. זה אומר שכל תכשיט
                לוקח זמן, ושאפשר להתאים אותו: מתכת, מידה, גודל אבן.
              </p>
              <p>
                העבודה מתחילה בשיחה. מה את עונדת ביום־יום, מה מפריע לך בתכשיטים
                שכבר יש לך, ומה תרצי שיישאר איתך לאורך שנים. משם נבנה הפריט הנכון,
                לא הגדול ביותר, אלא זה שתלבשי הכי הרבה.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Craft images */}
      <section className="bg-cream py-20 sm:py-28" aria-label="מהאטלייה">
        <Container>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: 'necklace-floral-chain', alt: 'שרשרת זהב עדינה על שולחן העבודה' },
              { name: 'ring-fine-band', alt: 'טבעות דקות משובצות יהלומים זעירים' },
              { name: 'earrings-fine-hoops', alt: 'עגילי חישוק קטנים מזהב' },
            ].map((img, i) => (
              <Reveal key={img.name} delay={i * 0.06}>
                <div className="overflow-hidden rounded-sm">
                  <CatalogImage name={img.name} alt={img.alt} className="aspect-square w-full" />
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-charcoal py-20 text-center text-cream sm:py-24">
        <Container className="max-w-2xl">
          <h2 className="text-2xl leading-snug sm:text-3xl">רוצה להתחיל?</h2>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-cream/70">
            אפשר לעיין בקולקציה, או לתכנן יחד תכשיט משלך מהשרטוט הראשון.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to={ROUTES.catalog}
              className="rounded-full border border-gold px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:bg-gold hover:text-charcoal"
            >
              לקולקציה
            </Link>
            <Link
              to={ROUTES.custom}
              className="rounded-full px-8 py-3 text-sm tracking-wide text-cream/80 underline-offset-4 transition-colors hover:text-cream hover:underline"
            >
              לעיצוב אישי
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
