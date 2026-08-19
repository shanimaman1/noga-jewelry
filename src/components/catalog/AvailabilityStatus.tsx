import type { Availability } from '@/types/catalog';
import { AVAILABILITY_LABELS } from '@/lib/fulfillment';

export function AvailabilityStatus({
  availability,
  prominent = false,
}: {
  availability: Availability;
  prominent?: boolean;
}) {
  const outOfStock = availability === 'out-of-stock';

  return (
    <p
      className={`flex items-center gap-2 text-xs ${
        outOfStock || prominent ? 'text-charcoal' : 'text-stone'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          outOfStock
            ? 'bg-charcoal'
            : availability === 'made-to-order'
              ? 'bg-gold'
              : 'bg-stone/60'
        }`}
      />
      {AVAILABILITY_LABELS[availability]}
    </p>
  );
}
