import type { Availability, Product } from '@/types/catalog';

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  ready: 'מוכן בסטודיו',
  'made-to-order': 'נוצר בהזמנה',
  'out-of-stock': 'אזל זמנית',
};

export const DELIVERY_TIMES = {
  home: '3–5 ימי עסקים',
  collection: 'עד 2 ימי עסקים',
  madeToOrder: 'כשבועיים לייצור',
} as const;

/** Fulfilment prices in ILS. This is the single source used by every surface. */
export const SHIPPING = {
  home: 35,
  freeThreshold: 1000,
  collection: 0,
} as const;

export function homeDeliveryCharge(subtotal: number): number {
  return subtotal >= SHIPPING.freeThreshold ? 0 : SHIPPING.home;
}

export function amountUntilFreeDelivery(subtotal: number): number {
  return Math.max(0, SHIPPING.freeThreshold - subtotal);
}

export function availabilityDetail(availability: Availability): string {
  if (availability === 'made-to-order') {
    return `${DELIVERY_TIMES.madeToOrder}, ולאחר מכן זמן המשלוח או האיסוף שבחרת.`;
  }
  if (availability === 'out-of-stock') {
    return 'הפריט אינו זמין כרגע. אפשר להשאיר אימייל ולקבל עדכון כשהוא חוזר למלאי.';
  }
  return 'הפריט מוכן בסטודיו ויוצא למסירה לפי האפשרות שתיבחר.';
}

export function productDeliveryText(product: Product): string {
  if (product.availability === 'made-to-order') {
    return `${DELIVERY_TIMES.madeToOrder}, ואז משלוח עד הבית בתוך ${DELIVERY_TIMES.home} או איסוף בתוך ${DELIVERY_TIMES.collection}.`;
  }
  if (product.availability === 'out-of-stock') {
    return 'אין כרגע מועד מסירה לפריט הזה.';
  }
  return `משלוח עד הבית בתוך ${DELIVERY_TIMES.home}, או איסוף מהסטודיו בתוך ${DELIVERY_TIMES.collection}.`;
}

export const schemaAvailability: Record<Availability, string> = {
  ready: 'https://schema.org/InStock',
  'made-to-order': 'https://schema.org/PreOrder',
  'out-of-stock': 'https://schema.org/OutOfStock',
};
