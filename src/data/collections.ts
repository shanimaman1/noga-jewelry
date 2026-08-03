import type { Collection } from '@/types/catalog';

export const collections: Collection[] = [
  {
    slug: 'rings',
    name: 'טבעות',
    description: 'מרצועות דקות ליומיום ועד סוליטר.',
    category: 'rings',
    image: 'ring-fine-band',
    imageAlt: 'טבעות זהב דקות משובצות יהלומים זעירים',
  },
  {
    slug: 'necklaces',
    name: 'שרשראות',
    description: 'תליונים עדינים ושרשראות באורך מתכוונן.',
    category: 'necklaces',
    image: 'editorial-necklace-onbody',
    imageAlt: 'אישה עונדת שתי שרשראות זהב עדינות',
  },
  {
    slug: 'earrings',
    name: 'עגילים',
    description: 'חישוקים וצמודים בזהב מלא.',
    category: 'earrings',
    image: 'earrings-fine-hoops',
    imageAlt: 'עגילי חישוק קטנים מזהב משובצים יהלומי בגט',
  },
  {
    slug: 'custom',
    name: 'עיצוב אישי',
    description: 'תכשיט שנבנה מהשרטוט הראשון יחד איתך.',
    category: 'custom',
    image: 'necklace-floral-chain',
    imageAlt: 'שרשרת זהב עדינה עם פרחים זעירים, על בד לבן',
  },
];
