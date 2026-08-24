import type { AgentRecommendation } from '@/lib/agent';
import { defaultVariant, getProduct } from '@/data/products';
import { formatPrice } from '@/lib/format';
import { CatalogImage } from '@/components/common/CatalogImage';
import { AvailabilityStatus } from '@/components/catalog/AvailabilityStatus';

/**
 * Compact recommendation card inside the assistant panel.
 *
 * The brain hands over a slug and an optional 18k display marker; name, price
 * and photograph are resolved from `products.ts` here, so the card can never
 * display a piece or a price that is not in the catalogue. A slug with no
 * product renders nothing rather than an empty frame.
 */
export function AssistantProductCard({
  recommendation,
  onView,
  onAdd,
}: {
  recommendation: AgentRecommendation;
  onView: (slug: string, karat?: 18) => void;
  onAdd: (slug: string, karat?: 18) => void;
}) {
  const product = getProduct(recommendation.slug);
  if (!product) return null;

  const variant = defaultVariant(product);
  const is18K = recommendation.karat === 18 && product.availableIn18K;
  const displayedPrice = is18K ? product.price18K : product.price;
  const displayedAvailability = is18K ? 'made-to-order' : product.availability;

  return (
    <article className="rounded-sm border border-mist bg-cream/60 p-3">
      <div className="flex items-start gap-3">
        <CatalogImage
          name={variant.image}
          alt={variant.imageAlt}
          className="h-16 w-16 shrink-0 rounded-sm"
        />
        <div className="min-w-0">
          <h4 className="truncate text-sm text-charcoal">{product.name}</h4>
          {/* Isolated so the shekel sign and digits never reorder in Hebrew. */}
          <p className="mt-0.5 text-sm text-charcoal">
            <bdi>{formatPrice(displayedPrice)}</bdi>
          </p>
          <div className="mt-1">
            <AvailabilityStatus availability={displayedAvailability} />
          </div>
          {is18K && <p className="mt-1 text-xs text-stone">18 קראט · הזמנה מיוחדת</p>}
          <p className="mt-1 text-xs leading-relaxed text-stone">{recommendation.reason}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onView(product.slug, is18K ? 18 : undefined)}
          aria-label={`צפייה במוצר ${product.name}`}
          className="flex-1 rounded-full border border-mist px-3 py-1.5 text-xs text-charcoal hover:border-stone"
        >
          צפייה במוצר
        </button>
        {displayedAvailability === 'out-of-stock' ? (
          <button
            type="button"
            onClick={() => onView(product.slug, is18K ? 18 : undefined)}
            aria-label={`מעבר לעדכון מלאי עבור ${product.name}`}
            className="flex-1 rounded-full bg-charcoal px-3 py-1.5 text-xs text-cream hover:bg-ink"
          >
            לעדכון מלאי
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product.slug, is18K ? 18 : undefined)}
            aria-label={`הוספת ${product.name}${is18K ? ' ב־18 קראט' : ''} לעגלה`}
            className="flex-1 rounded-full bg-charcoal px-3 py-1.5 text-xs text-cream hover:bg-ink"
          >
            הוספה לעגלה
          </button>
        )}
      </div>
    </article>
  );
}
