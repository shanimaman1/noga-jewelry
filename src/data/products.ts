import type { Product } from '@/types/catalog';

// Placeholder catalogue for the demo. Prices span the brand range ₪890–₪8,900.
// Copy follows the brand voice: plain, restrained, no superlatives.
//
// Imagery: visually verified assets for the exact demo product — licensed real
// photography or an explicitly approved AI image backed by a canonical spec.
// The original curated photo set is documented in build-catalog-images.mjs.
//
// METAL RULE: `metals` lists only metals backed by a visually verified image of
// that exact design and colour, and each variant points at its own file. Metal
// colour is never simulated with a tint. Most pieces therefore offer a single
// metal — that is correct, not a gap. To add a metal, first source and verify a
// licensed photo or obtain explicit approval for a spec-matched AI demo asset.
export const products: Product[] = [
  // ── Rings ──────────────────────────────────────────────────────────────
  {
    slug: 'solitaire-classic',
    name: 'סוליטר קלאסי',
    shortDescription: 'אבן בודדת על רצועה מחורצת דקה. הטבעת שלא יוצאת מהאופנה.',
    price: 8900,
    category: 'rings',
    availability: 'made-to-order',
    stones: {
      kind: 'diamonds',
      origin: 'natural',
      totalCarat: 0.5,
      arrangement: 'single',
      cut: 'round',
      color: 'G',
      clarity: 'VS1',
    },
    goldWeightGrams: 3,
    availableIn18K: true,
    // The only product the ring.glb model genuinely depicts → live 360° viewer.
    has3D: true,
    // Matched pair: the same verified milgrain-band design in two metal colours.
    metals: [
      {
        id: 'yellow',
        image: 'solitaire-classic-round-yellow-v1',
        imageAlt: 'טבעת סוליטר מזהב צהוב עם יהלום עגול יחיד ורצועת מילגריין דקה, על בד כהה',
      },
      {
        id: 'rose',
        image: 'solitaire-classic-round-rose-v1',
        imageAlt: 'טבעת סוליטר מזהב אדום עם יהלום עגול יחיד ורצועת מילגריין דקה, על בד כהה',
      },
    ],
    featured: true,
  },
  {
    slug: 'fine-diamond-band',
    name: 'טבעת יהלומים דקה',
    shortDescription: 'שורת יהלומים זעירים על רצועה דקה, לענידה לבד או בשכבות.',
    price: 3400,
    category: 'rings',
    availability: 'made-to-order',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.35,
      arrangement: 'multiple',
    },
    goldWeightGrams: 1.8,
    availableIn18K: true,
    metals: [
      {
        id: 'yellow',
        image: 'fine-diamond-band-main-v1',
        imageAlt: 'טבעת זהב צהוב דקה עם שורת יהלומים זעירים, על בד בגוון שנהב',
      },
    ],
    featured: true,
  },
  {
    slug: 'thin-band-daily',
    name: 'טבעת יומיום דקה',
    shortDescription: 'רצועה דקה בעבודת יד, נוחה לענידה רצופה.',
    price: 1290,
    category: 'rings',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 1.4,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'ring-thin-daily-main-v1',
        imageAlt: 'טבעת יומיום דקה מזהב צהוב על רקע אבן בגוון קרם',
      },
    ],
  },
  {
    slug: 'stacking-rings',
    name: 'טבעות שכבות',
    shortDescription: 'שלוש רצועות דקות שנענדות יחד או בנפרד.',
    price: 3900,
    category: 'rings',
    availability: 'ready',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.1,
      arrangement: 'multiple',
      setComposition: { diamondSetPieces: 1, plainPieces: 2 },
    },
    goldWeightGrams: 4.4,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'stacking-rings-set-v1',
        imageAlt: 'שלוש טבעות זהב צהוב דקות, חלקה, במרקם מילגריין ומשובצת יהלומים זעירים, על בד בגוון שנהב',
      },
    ],
  },

  // ── Necklaces ──────────────────────────────────────────────────────────
  {
    slug: 'single-diamond-necklace',
    name: 'שרשרת יהלום בודד',
    shortDescription: 'תליון קטן על שרשרת עדינה, באורך מתכוונן.',
    price: 2450,
    category: 'necklaces',
    availability: 'ready',
    stones: {
      kind: 'diamonds',
      origin: 'natural',
      totalCarat: 0.25,
      arrangement: 'single',
      cut: 'round',
    },
    goldWeightGrams: 1.9,
    availableIn18K: false,
    metals: [
      {
        id: 'white',
        image: 'single-diamond-necklace-main-v1',
        imageAlt: 'שרשרת עדינה מזהב לבן עם יהלום עגול יחיד בשיבוץ מסגרת, על בד בגוון שנהב',
      },
    ],
    featured: true,
  },
  {
    slug: 'heart-pendant-necklace',
    name: 'תליון לב',
    shortDescription: 'קו לב פתוח משובץ יהלומים, על שרשרת כדורים דקה.',
    price: 3100,
    category: 'necklaces',
    availability: 'ready',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.45,
      arrangement: 'multiple',
    },
    goldWeightGrams: 2.5,
    availableIn18K: false,
    metals: [
      {
        id: 'white',
        image: 'necklace-heart-white',
        imageAlt: 'תליון לב משובץ יהלומים בזהב לבן על שרשרת כדורים דקה',
      },
    ],
  },
  {
    slug: 'gold-pendant',
    name: 'תליון זהב',
    shortDescription: 'תליון בחיתוך ידני על שרשרת דקה, לענידה יומיומית.',
    price: 1890,
    category: 'necklaces',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 2.8,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'necklace-gold-pendant',
        imageAlt: 'אישה עונדת תליון זהב צהוב על שרשרת דקה',
      },
    ],
  },
  {
    slug: 'pearl-drop-necklace',
    name: 'שרשרת פנינה',
    shortDescription: 'פנינה בודדת על שרשרת זהב דקה. קלאסי, בלי עודף.',
    price: 1650,
    category: 'necklaces',
    availability: 'ready',
    stones: {
      kind: 'pearl',
      source: 'freshwater-cultured',
      quantity: 1,
      diameterMm: 8,
    },
    goldWeightGrams: 1.7,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'necklace-pearl-drop',
        imageAlt: 'פנינה בודדת תלויה על שרשרת זהב צהוב דקה',
      },
    ],
    featured: true,
  },
  {
    slug: 'layered-necklace',
    name: 'שרשרת שכבות',
    shortDescription: 'שלוש שרשראות דקות באורכים שונים, נענדות יחד.',
    price: 2100,
    category: 'necklaces',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 3.2,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'necklace-layered-fine',
        imageAlt: 'שלוש שרשראות זהב צהוב דקות באורכים שונים, ענודות יחד',
      },
    ],
  },
  {
    slug: 'bezel-chain-necklace',
    name: 'שרשרת נקודות',
    shortDescription: 'אבנים זעירות משובצות לאורך שרשרת דקה.',
    price: 2950,
    category: 'necklaces',
    availability: 'ready',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.5,
      arrangement: 'multiple',
    },
    goldWeightGrams: 2.4,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'bezel-chain-necklace-main-v1',
        imageAlt: 'שרשרת זהב צהוב דקה עם יהלומים זעירים בשיבוצי מסגרת, על רקע אבן בגוון קרם',
      },
    ],
  },
  {
    slug: 'floral-chain-necklace',
    name: 'שרשרת פרחים',
    shortDescription: 'פרחים זעירים לאורך שרשרת עדינה במיוחד.',
    price: 1490,
    category: 'necklaces',
    availability: 'out-of-stock',
    stones: { kind: 'none' },
    goldWeightGrams: 2.1,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'necklace-floral-chain',
        imageAlt: 'שרשרת זהב צהוב עדינה עם פרחים זעירים, על בד לבן',
      },
    ],
  },

  // ── Earrings ───────────────────────────────────────────────────────────
  {
    slug: 'mini-hoop-earrings',
    name: 'עגילי חישוק קטנים',
    shortDescription: 'חישוק בקוטר 10 מ״מ עם יהלומי בגט, קל מספיק לשכוח שהוא שם.',
    price: 2200,
    category: 'earrings',
    availability: 'ready',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.3,
      arrangement: 'multiple',
      cut: 'baguette',
    },
    goldWeightGrams: 2,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'earrings-fine-hoops',
        imageAlt: 'עגילי חישוק קטנים מזהב צהוב משובצים יהלומי בגט',
      },
    ],
  },
  {
    slug: 'tiny-stud-earrings',
    name: 'עגילים צמודים זעירים',
    shortDescription: 'עיגול זהב קטן במרקם עדין. העגיל שנשאר באוזן גם בלילה.',
    price: 890,
    category: 'earrings',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 0.6,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'earrings-tiny-studs',
        imageAlt: 'זוג עגילים צמודים עגולים מזהב צהוב, במרקם עדין',
      },
    ],
  },

  // ── Bracelets ──────────────────────────────────────────────────────────
  {
    slug: 'fine-chain-bracelet',
    name: 'צמיד חוליות דק',
    shortDescription: 'חוליות מוארכות בזהב מלא, עם סוגר בטחון.',
    price: 2100,
    category: 'bracelets',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 2.8,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'bracelet-fine-chain',
        imageAlt: 'צמיד חוליות זהב צהוב דק ענוד על פרק היד',
      },
    ],
  },
  {
    slug: 'beaded-bracelet',
    name: 'צמיד חרוזים',
    shortDescription: 'שני צמידים דקים בעבודת חרוזים זעירים.',
    price: 2400,
    category: 'bracelets',
    availability: 'ready',
    stones: { kind: 'none' },
    goldWeightGrams: 3,
    availableIn18K: false,
    metals: [
      {
        id: 'yellow',
        image: 'bracelet-thin-beaded',
        imageAlt: 'שני צמידי זהב צהוב דקים עשויים חרוזים זעירים, על פרק היד',
      },
    ],
  },
  {
    slug: 'slim-bangle',
    name: 'צמיד קשיח דק',
    shortDescription: 'צמיד קשיח בקו נקי, עם שורת אבנים עדינה.',
    price: 5900,
    category: 'bracelets',
    availability: 'made-to-order',
    stones: {
      kind: 'diamonds',
      origin: 'lab-grown',
      totalCarat: 0.25,
      arrangement: 'multiple',
    },
    goldWeightGrams: 6,
    availableIn18K: true,
    metals: [
      {
        id: 'yellow',
        image: 'bracelet-slim-bangle',
        imageAlt: 'צמיד קשיח דק מזהב צהוב עם שורת אבנים, על בד לבן',
      },
    ],
  },
];

export const featuredProducts = products.filter((p) => p.featured).slice(0, 4);

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

/** The photograph shown by default in listings. */
export const defaultVariant = (product: Product) => product.metals[0];

/** Card-size image (600px square). */
export const productImage = (name: string, size: '600' | 'full' = '600') =>
  size === '600' ? `/products/${name}@600.webp` : `/products/${name}.webp`;
