import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { SHIPPING, shippingCostText } from '@/lib/fulfillment';
import { includesCertifiedDiamond } from '@/lib/productMaterials';
import type { Availability, StoneDetails } from '@/types/catalog';

type TrustItem = { id: string; label: string; icon: string; to?: string };

const standardItems: TrustItem[] = [
  { id: 'exchange', label: 'החלפה תוך 30 יום', icon: 'M25 16a9 9 0 1 1-3.2-6.9 M26 6v5h-5', to: ROUTES.returnsService },
  { id: 'shipping', label: `משלוח ${shippingCostText(SHIPPING.home)}`, icon: 'M3 8h14v12H3z M17 12h6l3 4v4h-9 M7 24a2 2 0 1 0 0-4 2 2 0 0 0 0 4 M21 24a2 2 0 1 0 0-4 2 2 0 0 0 0 4' },
  { id: 'gift', label: 'אריזת מתנה', icon: 'M6 13h20v13H6z M6 13l3-5h14l3 5 M16 13v13' },
];

const certificateItem: TrustItem = {
  id: 'certificate',
  label: 'תעודת יהלום',
  icon: 'M6 13l10-6 10 6-10 12z M6 13h20 M16 7v18',
};

/** Reassurance row under the add-to-cart button. */
export function TrustStrip({ stones, availability }: { stones: StoneDetails; availability: Availability }) {
  const availableItems = availability === 'out-of-stock'
    ? standardItems.filter((item) => item.id !== 'shipping')
    : standardItems;
  const items = includesCertifiedDiamond(stones)
    ? [availableItems[0], certificateItem, ...availableItems.slice(1)]
    : availableItems;

  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-4 border-y border-mist py-5">
      {items.map((item) => (
        <li key={item.id} className="flex items-center gap-2.5 text-sm text-stone">
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
          {item.to ? (
            <Link
              to={item.to}
              className="underline decoration-stone/50 underline-offset-4 transition-colors hover:text-charcoal hover:decoration-charcoal"
            >
              {item.label}
            </Link>
          ) : (
            item.label
          )}
        </li>
      ))}
    </ul>
  );
}
