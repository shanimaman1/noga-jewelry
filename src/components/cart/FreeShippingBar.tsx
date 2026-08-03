import { FREE_SHIPPING_THRESHOLD } from '@/lib/cart/store';
import { formatPrice } from '@/lib/format';

/** Progress toward the free-shipping threshold. */
export function FreeShippingBar({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const qualified = remaining === 0;

  return (
    <div>
      <p className="text-xs text-stone">
        {qualified ? (
          <span className="text-charcoal">קיבלת משלוח חינם</span>
        ) : (
          <>
            עוד <span className="text-charcoal">{formatPrice(remaining)}</span> למשלוח חינם
          </>
        )}
      </p>
      <div
        className="mt-2 h-1 overflow-hidden rounded-full bg-mist"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={FREE_SHIPPING_THRESHOLD}
        aria-valuenow={Math.min(subtotal, FREE_SHIPPING_THRESHOLD)}
        aria-label="התקדמות למשלוח חינם"
      >
        <div
          className="h-full bg-gold transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
