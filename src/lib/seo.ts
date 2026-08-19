import { BRAND, STUDIO } from './constants';

/**
 * Canonical site origin. DEMO placeholder — update to the real domain on
 * deploy (also referenced by public/robots.txt and public/sitemap.xml).
 */
export const SITE_URL = 'https://noga-jewelry.netlify.app';

/** Default Open Graph image (a real catalogue photo until a branded OG asset). */
export const DEFAULT_OG_IMAGE = '/products/ring-solitaire-yellow.webp';

/** LocalBusiness / JewelryStore structured data — rendered once, site-wide. */
export const localBusinessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'JewelryStore',
  name: BRAND.nameEn,
  alternateName: BRAND.nameHe,
  description:
    'אטלייה תכשיטים בתל אביב - זהב 14/18 קראט בעבודת יד, יהלומים טבעיים ומעבדה.',
  url: SITE_URL,
  image: `${SITE_URL}${DEFAULT_OG_IMAGE}`,
  telephone: BRAND.whatsapp,
  email: BRAND.email,
  priceRange: '₪₪₪',
  address: {
    '@type': 'PostalAddress',
    streetAddress: STUDIO.address,
    addressLocality: 'תל אביב',
    addressCountry: 'IL',
  },
  areaServed: 'IL',
};

/** Absolute URL for a route path (leading slash). */
export const absoluteUrl = (path: string) =>
  path === '/' ? SITE_URL : `${SITE_URL}${path}`;
