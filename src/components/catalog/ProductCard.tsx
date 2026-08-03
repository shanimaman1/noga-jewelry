import { Link } from 'react-router-dom';
import type { Product } from '@/types/catalog';
import { ROUTES } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { defaultVariant } from '@/data/products';
import { CatalogImage } from '@/components/common/CatalogImage';

/** Shared product card — used by the homepage row and the catalog grid. */
export function ProductCard({ product }: { product: Product }) {
  const variant = defaultVariant(product);
  return (
    <Link to={`${ROUTES.product}/${product.slug}`} className="group block">
      {/* No reveal mask here on purpose: the product photograph is the content
          of a jewellery store, so it must never be gated behind an animation
          (and a hidden ancestor also stops lazy images being fetched at all). */}
      <div className="relative overflow-hidden rounded-sm">
        <CatalogImage
          name={variant.image}
          alt={variant.imageAlt}
          className="aspect-square w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
        />
        {product.badge && (
          <span className="absolute top-3 end-3 rounded-full bg-cream/90 px-3 py-1 text-[11px] tracking-wide text-charcoal">
            {product.badge}
          </span>
        )}
      </div>

      <h3 className="mt-4 text-base text-charcoal transition-colors group-hover:text-gold">
        {product.name}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-stone">{product.shortDescription}</p>
      <p className="mt-2 text-sm text-charcoal">{formatPrice(product.price)}</p>
    </Link>
  );
}
