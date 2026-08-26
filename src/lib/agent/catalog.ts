/**
 * Pure search over the real catalogue. No product data lives here — every
 * name, price, category and metal is read from `@/data/products`, so the
 * assistant can never quote a piece or a price the store does not have.
 *
 * Layering note: `CATEGORY_LABELS` and `PRICE_BANDS` are imported from the
 * catalog FilterBar on purpose. They are the app's existing, user-visible
 * vocabulary for categories and price tiers — an assistant that offered
 * *different* tiers than the catalogue filters would be inconsistent, and a
 * second copy of the Hebrew labels would drift. FilterBar has no heavy
 * dependencies, so the cost of the import is a couple of KB.
 *
 * Catalogue results are always derived from the data and keep a stable order.
 */

import type { Category, Metal, Product } from '@/types/catalog';
import { METAL_LABELS } from '@/types/catalog';
import { products } from '@/data/products';
import { CATEGORY_LABELS, PRICE_BANDS, type PriceBand } from '@/components/catalog/FilterBar';

export { CATEGORY_LABELS, METAL_LABELS, PRICE_BANDS };
export type { PriceBand };

/** `undefined` on a field means "no preference" — that field is not filtered. */
export type CatalogFilters = {
  band?: PriceBand;
  category?: Category;
  metal?: Metal;
};

const bandOf = (id: PriceBand) => PRICE_BANDS.find((b) => b.id === id);

/** Inclusive on both ends, matching the band labels. No product sits exactly on
 *  a boundary in the current catalogue, so the bands do not overlap in practice. */
function inBand(price: number, id: PriceBand): boolean {
  const band = bandOf(id);
  if (!band) return true;
  if (band.min !== undefined && price < band.min) return false;
  if (band.max !== undefined && price > band.max) return false;
  return true;
}

const hasMetal = (product: Product, metal: Metal) =>
  product.metals.some((variant) => variant.id === metal);

function matchesFilters(product: Product, filters: CatalogFilters): boolean {
  if (filters.category && product.category !== filters.category) return false;
  if (filters.band && !inBand(product.price, filters.band)) return false;
  if (filters.metal && !hasMetal(product, filters.metal)) return false;
  return true;
}

/**
 * Products matching the filters.
 *
 * Order is deterministic — the same filters always produce the same list:
 *   1. categories the occasion points at (when given), then
 *   2. pieces flagged `featured` in the catalogue, then
 *   3. ascending price, then
 *   4. slug, as a final tie-break so the order never depends on array position.
 */
export function findProducts(
  filters: CatalogFilters,
  options: { preferCategories?: readonly Category[] } = {},
): Product[] {
  const prefer = options.preferCategories ?? [];
  const rank = (product: Product) => {
    const index = prefer.indexOf(product.category);
    return index === -1 ? prefer.length : index;
  };

  return products
    .filter((product) => matchesFilters(product, filters))
    .sort(
      (a, b) =>
        rank(a) - rank(b) ||
        Number(Boolean(b.featured)) - Number(Boolean(a.featured)) ||
        a.price - b.price ||
        a.slug.localeCompare(b.slug),
    );
}
