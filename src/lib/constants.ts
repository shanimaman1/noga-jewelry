// Brand-level constants. Copy is Hebrew placeholder for this portfolio demo.

export const BRAND = {
  nameHe: 'נוגה',
  nameEn: 'NOGA Fine Jewelry',
  tagline: 'תכשיט אחד שתלבשי כל יום — לא עשרה נשכחים במגירה',
  city: 'תל אביב',
  foundedYear: 2013,
  // Deliberately INVALID placeholder number for this demo — never a real number.
  whatsapp: '+972-50-000-0000',
  whatsappDigits: '972500000000',
  email: 'hello@noga-demo.co.il',
  instagram: 'noga.jewelry',
} as const;

export const ROUTES = {
  home: '/',
  catalog: '/catalog',
  product: '/product', // /product/:slug
  giftGuide: '/gift-guide',
  custom: '/custom',
  story: '/story',
  visit: '/visit',
  sizeCare: '/size-care',
  cart: '/cart',
  checkout: '/checkout',
  orderConfirmation: '/order-confirmation',
  accessibility: '/accessibility',
  lab: '/lab',
} as const;

// Primary navigation. Kept short and calm — luxury restraint.
export const NAV_LINKS: { to: string; label: string }[] = [
  { to: ROUTES.catalog, label: 'קטלוג' },
  { to: ROUTES.giftGuide, label: 'מדריך מתנות' },
  { to: ROUTES.story, label: 'הסיפור' },
  { to: ROUTES.visit, label: 'ביקור בסטודיו' },
  { to: ROUTES.custom, label: 'עיצוב אישי' },
];

export const STUDIO = {
  address: 'שבזי 45, נווה צדק, תל אביב',
  hours: [
    { days: 'ראשון–חמישי', hours: '10:00–19:00' },
    { days: 'שישי', hours: '10:00–14:00' },
    { days: 'שבת', hours: 'סגור' },
  ],
} as const;

// wa.me link. Number is intentionally invalid (demo) — link is illustrative.
export const whatsappUrl = (message = 'היי, אשמח לעזרה בבחירת תכשיט') =>
  `https://wa.me/${BRAND.whatsappDigits}?text=${encodeURIComponent(message)}`;
