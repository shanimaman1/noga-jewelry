import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { CatalogImage } from '@/components/common/CatalogImage';
import { ImageReveal } from '@/components/motion/ImageReveal';
import { Parallax } from '@/components/motion/Parallax';
import { CountUp } from '@/components/motion/CountUp';

/** Founder section on charcoal — the brand's quiet human anchor. */
export function DanaStory() {
  return (
    <section className="bg-charcoal py-20 text-cream sm:py-28" aria-labelledby="story-title">
      <Container>
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          {/* Workspace still-life rather than a portrait: this is a fictional
              founder, so we don't present a real person's face as "Dana".
              Swap for a real photo of the actual goldsmith when available. */}
          <Parallax strength={56} className="md:order-2">
            <ImageReveal className="rounded-sm">
              <CatalogImage
                name="necklace-floral-chain"
                alt="שרשרת זהב עדינה מונחת על בד לבן באטלייה"
                className="aspect-[4/5] w-full"
              />
            </ImageReveal>
          </Parallax>

          {/* Stagger runs down the direct children: kicker, heading, body,
              stats, then the link — so the eye is led in reading order. */}
          <Reveal stagger className="md:order-1">
            <p className="text-xs tracking-luxury text-gold">מי עומדת מאחורי</p>
            <h2 id="story-title" className="mt-4 text-2xl leading-snug sm:text-3xl">
              דנה, צורפת. שתים־עשרה שנה ליד השולחן.
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-cream/70">
              <p>
                דנה סיימה צורפות בבצלאל ופתחה את האטלייה בתל אביב אחרי שנים של עבודה
                אצל אחרים. מאז היא מלטשת, מלחימה ומשבצת כל פריט בעצמה.
              </p>
              <p>
                העבודה מתחילה בשיחה, מה את עונדת ביום־יום, מה מפריע לך בתכשיטים
                שיש לך, ומה תרצי שיישאר איתך לאורך זמן. משם נולד התכשיט.
              </p>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-12 gap-y-6 border-t border-cream/15 pt-8">
              <div>
                <dt className="sr-only">שנות ניסיון</dt>
                <dd className="font-heading text-3xl text-gold">
                  <CountUp value={12} />
                </dd>
                <p className="mt-1 text-xs tracking-wide text-cream/60">שנות ניסיון</p>
              </div>
              <div>
                <dt className="sr-only">קראט זהב</dt>
                <dd className="font-heading text-3xl text-gold">
                  <CountUp value={14} suffix="/18" />
                </dd>
                <p className="mt-1 text-xs tracking-wide text-cream/60">קראט, זהב מלא</p>
              </div>
              <div>
                <dt className="sr-only">ימי החלפה</dt>
                <dd className="font-heading text-3xl text-gold">
                  <CountUp value={30} />
                </dd>
                <p className="mt-1 text-xs tracking-wide text-cream/60">ימי החלפה</p>
              </div>
            </dl>

            <Link
              to={ROUTES.story}
              className="mt-8 inline-block rounded-full border border-cream/30 px-8 py-3 text-sm tracking-wide text-cream transition-colors hover:border-gold hover:text-gold"
            >
              לסיפור המלא
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
