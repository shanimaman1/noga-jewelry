import type { CartLine } from '@/lib/cart/store';
import { useCart } from '@/lib/cart/store';
import { METAL_LABELS } from '@/types/catalog';
import { formatPrice } from '@/lib/format';
import { productImage } from '@/data/products';

/** A single cart line with quantity controls and remove. Used in drawer + page. */
export function LineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  const meta = [METAL_LABELS[line.metal], `${line.karat} קראט`, line.size && `מידה ${line.size}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex gap-4">
      <img
        src={productImage(line.image, '600')}
        alt=""
        width={compact ? 72 : 96}
        height={compact ? 72 : 96}
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-sm bg-mist/40 object-cover ${compact ? 'h-18 w-18' : 'h-24 w-24'}`}
        style={compact ? { width: 72, height: 72 } : { width: 96, height: 96 }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-charcoal">{line.name}</p>
            <p className="mt-1 text-xs text-stone">{meta}</p>
          </div>
          <button
            type="button"
            onClick={() => remove(line.id)}
            aria-label={`הסרת ${line.name} מהעגלה`}
            className="shrink-0 rounded-full p-1 text-stone transition-colors hover:text-charcoal"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          {/* Quantity stepper */}
          <div className="flex items-center rounded-full border border-mist">
            <button
              type="button"
              onClick={() => setQuantity(line.id, line.quantity - 1)}
              aria-label="הפחתת כמות"
              className="flex h-8 w-8 items-center justify-center text-stone transition-colors hover:text-charcoal"
            >
              <span aria-hidden="true">−</span>
            </button>
            <span
              className="min-w-6 text-center text-sm text-charcoal"
              aria-label={`כמות: ${line.quantity}`}
            >
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(line.id, line.quantity + 1)}
              aria-label="הגדלת כמות"
              className="flex h-8 w-8 items-center justify-center text-stone transition-colors hover:text-charcoal"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <p className="text-sm text-charcoal">{formatPrice(line.price * line.quantity)}</p>
        </div>
      </div>
    </div>
  );
}
