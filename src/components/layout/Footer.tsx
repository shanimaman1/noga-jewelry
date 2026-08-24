import { Link } from 'react-router-dom';
import { BRAND, DEMO_CONTACT_LABEL, NAV_LINKS, ROUTES, whatsappUrl } from '@/lib/constants';

const serviceLinks = [
  { to: ROUTES.sizeCare, label: 'מדריך מידות וטיפוח' },
  { to: ROUTES.accessibility, label: 'הצהרת נגישות' },
  { to: ROUTES.cart, label: 'עגלת הקניות' },
];

/** Rich footer — brand statement, navigation, contact, legal bottom bar. */
export function Footer() {
  return (
    <footer className="bg-charcoal text-cream/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-1">
          <p className="font-heading text-2xl font-normal tracking-luxury text-cream">
            {BRAND.nameHe}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/60">
            {BRAND.tagline}
          </p>
          <p className="mt-4 text-xs tracking-wide text-cream/40">
            אטלייה תכשיטים · {BRAND.city}
          </p>
        </div>

        {/* Explore */}
        <nav aria-label="ניווט תחתון - קטלוג">
          <h2 className="text-xs tracking-luxury text-gold">לגלות</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Service */}
        <nav aria-label="ניווט תחתון - שירות">
          <h2 className="text-xs tracking-luxury text-gold">שירות</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {serviceLinks.map((link) => (
              <li key={link.to}>
                <Link to={link.to} className="transition-colors hover:text-cream">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact */}
        <div>
          <h2 className="text-xs tracking-luxury text-gold">יצירת קשר</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a
                href={whatsappUrl()}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-cream"
              >
                WhatsApp · {BRAND.whatsapp}
              </a>
            </li>
            <li>
              <a href={`mailto:${BRAND.email}`} className="transition-colors hover:text-cream">
                {BRAND.email} <span className="text-cream/50">({DEMO_CONTACT_LABEL})</span>
              </a>
            </li>
            <li>
              <a
                href={`https://instagram.com/${BRAND.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="transition-colors hover:text-cream"
              >
                Instagram · @{BRAND.instagram}{' '}
                <span className="text-cream/50">({DEMO_CONTACT_LABEL})</span>
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-cream/40 sm:flex-row sm:px-8">
          <p>
            © {new Date().getFullYear()} {BRAND.nameEn}. אתר הדגמה לפורטפוליו - אין רכישות אמיתיות.
          </p>
          <Link to={ROUTES.accessibility} className="transition-colors hover:text-cream/70">
            נגישות
          </Link>
        </div>
      </div>
    </footer>
  );
}
