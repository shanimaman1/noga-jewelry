import { formatPrice } from '@/lib/format';
import { SHIPPING, homeDeliveryCharge } from '@/lib/fulfillment';
import { includesCertifiedDiamond } from '@/lib/productMaterials';
import type { StoneDetails } from '@/types/catalog';

const shippingIcon =
  'M3 8h14v12H3z M17 12h6l3 4v4h-9 M7 24a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M21 24a2 2 0 1 0 0-4 2 2 0 0 0 0 4';

const standardItems = (price: number) => [
  { label: 'החלפה תוך 30 יום', icon: 'M25 16a9 9 0 1 1-3.2-6.9 M26 6v5h-5' },
  {
    label:
      homeDeliveryCharge(price) === 0
        ? 'משלוח חינם'
        : `משלוח חינם מעל ${formatPrice(SHIPPING.freeThreshold)}`,
    icon: shippingIcon,
  },
  { label: 'אריזת מתנה', icon: 'M6 13h20v13H6z M6 13l3-5h14l3 5 M16 13v13' },
];

const certificateItem = {
  label: 'תעודת יהלום',
  icon: 'M6 13l10-6 10 6-10 12z M6 13h20 M16 7v18',
};

/** Reassurance row under the add-to-cart button. */
export function TrustStrip({ stones, price }: { stones: StoneDetails; price: number }) {
  const baseItems = standardItems(price);
  const items = includesCertifiedDiamond(stones)
    ? [baseItems[0], certificateItem, ...baseItems.slice(1)]
    : baseItems;

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-mist py-5">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2.5 text-sm text-stone">
          <svg
            width="20"
            height="20"
            viewBox="0 0 32 32"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="shrink-0 text-gold"
          >
            <path d={item.icon} />
          </svg>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
