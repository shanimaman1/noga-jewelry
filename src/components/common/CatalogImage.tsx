import { productImage } from '@/data/products';

/**
 * Catalogue photograph. Square by design (the source set is cropped 1:1),
 * with explicit dimensions so cards never shift as images arrive.
 * `priority` opts an image out of lazy-loading for above-the-fold slots.
 */
export function CatalogImage({
  name,
  alt,
  className = '',
  priority = false,
  full = false,
}: {
  name: string;
  alt: string;
  className?: string;
  priority?: boolean;
  full?: boolean;
}) {
  const size = full ? 1000 : 600;
  return (
    <img
      src={productImage(name, full ? 'full' : '600')}
      alt={alt}
      width={size}
      height={size}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`bg-mist/40 object-cover ${className}`}
    />
  );
}
