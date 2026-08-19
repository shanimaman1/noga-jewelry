import type { AgentRecommendation } from '@/lib/agent';
import { defaultVariant, getProduct } from '@/data/products';
import { formatPrice } from '@/lib/format';
import { CatalogImage } from '@/components/common/CatalogImage';
import { AvailabilityStatus } from '@/components/catalog/AvailabilityStatus';

/**
 * Compact recommendation card inside the assistant panel.
 *
 * The brain hands over a slug only; name, price and photograph are resolved
 * from `products.ts` here, so the card can never display a piece or a price
 * that is not in the catalogue. A slug with no product renders nothing rather
 * than an empty frame.
 */
export function AssistantProductCard({
  recommendation,
  onView,
  onAdd,
}: {
  recommendation: AgentRecommendation;
  onView: (slug: string) => void;
  onAdd: (slug: string) => void;
}) {
  const product = getProduct(recommendation.slug);
  if (!product) return null;

  const variant = defaultVariant(product);

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
            <bdi>{formatPrice(product.price)}</bdi>
          </p>
          <div className="mt-1">
            <AvailabilityStatus availability={product.availability} />
          </div>
          <p className="mt-1 text-xs leading-relaxed text-stone">{recommendation.reason}</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => onView(product.slug)}
          aria-label={`צפייה במוצר ${product.name}`}
          className="flex-1 rounded-full border border-mist px-3 py-1.5 text-xs text-charcoal hover:border-stone"
        >
          צפייה במוצר
        </button>
        {product.availability === 'out-of-stock' ? (
          <button
            type="button"
            onClick={() => onView(product.slug)}
            aria-label={`מעבר לעדכון מלאי עבור ${product.name}`}
            className="flex-1 rounded-full bg-charcoal px-3 py-1.5 text-xs text-cream hover:bg-ink"
          >
            לעדכון מלאי
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAdd(product.slug)}
            aria-label={`הוספת ${product.name} לעגלה`}
            className="flex-1 rounded-full bg-charcoal px-3 py-1.5 text-xs text-cream hover:bg-ink"
          >
            הוספה לעגלה
          </button>
        )}
      </div>
    </article>
  );
}
