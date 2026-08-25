import { Link } from 'react-router-dom';
import { Container } from '@/components/common/Container';
import { Seo } from '@/components/seo/Seo';
import { ROUTES, whatsappUrl } from '@/lib/constants';
import {
  careServiceText,
  resizingPolicyText,
  returnsPolicyPoints,
  specialOrderReturnsText,
  warrantyPolicyText,
} from '@/lib/servicePolicies';

export function ReturnsService() {
  return (
    <div className="py-14 sm:py-20">
      <Seo
        title="החלפות, החזרות ושירות"
        description="תנאי החלפה והחזר, התאמת מידת טבעת, אחריות, תיקונים וניקוי באטלייה של נוגה."
        path={ROUTES.returnsService}
      />
      <Container className="max-w-3xl">
        <p className="text-xs tracking-luxury text-gold">שירות</p>
        <h1 className="mt-4 text-3xl sm:text-4xl">החלפות, החזרות ושירות</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-stone">
          התנאים והשירותים שחשוב להכיר לפני ואחרי הקנייה.
        </p>

        <section className="mt-14 border-t border-mist pt-8" aria-labelledby="returns-title">
          <h2 id="returns-title" className="text-2xl">החלפות והחזרות</h2>
          <ul className="mt-5 space-y-3 leading-relaxed text-stone">
            {returnsPolicyPoints().map((point) => <li key={point}>{point}</li>)}
          </ul>
          <p className="mt-5 text-sm leading-relaxed text-stone">
            מדיניות זו אינה גורעת מזכות ביטול או החזר שמוקנית לפי חוק הגנת הצרכן.
          </p>
        </section>

        <section className="mt-12 border-t border-mist pt-8" aria-labelledby="special-order-title">
          <h2 id="special-order-title" className="text-2xl">הזמנה מיוחדת</h2>
          <p className="mt-4 leading-relaxed text-stone">{specialOrderReturnsText()}</p>
        </section>

        <section className="mt-12 border-t border-mist pt-8" aria-labelledby="resizing-title">
          <h2 id="resizing-title" className="text-2xl">התאמת מידת טבעת</h2>
          <p className="mt-4 leading-relaxed text-stone">{resizingPolicyText()}</p>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            התאמה נוספת, או שינוי שמצריך תוספת זהב משמעותית, מתומחרים לאחר בדיקה.
          </p>
        </section>

        <section className="mt-12 border-t border-mist pt-8" aria-labelledby="warranty-title">
          <h2 id="warranty-title" className="text-2xl">אחריות ותיקונים</h2>
          <p className="mt-4 leading-relaxed text-stone">{warrantyPolicyText()}</p>
        </section>

        <section className="mt-12 border-t border-mist pt-8" aria-labelledby="care-service-title">
          <h2 id="care-service-title" className="text-2xl">ניקוי ובדיקת שיבוץ</h2>
          <p className="mt-4 leading-relaxed text-stone">{careServiceText()}</p>
        </section>

        <div className="mt-14 rounded-sm border border-mist p-6">
          <p className="text-sm leading-relaxed text-stone">
            להחלפה, החזרה או שירות, כתבי לדנה ב־WhatsApp והיא תתאם את ההמשך.
          </p>
          <a
            href={whatsappUrl('היי דנה, אשמח לעזרה בהחלפה, החזרה או שירות לתכשיט')}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-full bg-charcoal px-7 py-3 text-sm text-cream transition-colors hover:bg-charcoal/90"
          >
            כתיבה לדנה ב־WhatsApp
          </a>
          <Link
            to={ROUTES.sizeCare}
            className="mt-4 block text-sm text-stone underline underline-offset-4 transition-colors hover:text-charcoal"
          >
            למדריך מידות וטיפוח
          </Link>
        </div>
      </Container>
    </div>
  );
}
