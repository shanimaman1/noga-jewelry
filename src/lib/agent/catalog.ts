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
 * Availability is always derived from the data, never assumed: a band,
 * category or metal is only ever offered to the shopper if at least one real
 * product matches it.
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

/** Which filters we are willing to drop, in the order we would drop them. */
export const RELAXATION_ORDER = ['metal', 'band', 'category'] as const;
export type RelaxableFilter = (typeof RELAXATION_ORDER)[number];

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

export const countProducts = (filters: CatalogFilters): number =>
  products.filter((product) => matchesFilters(product, filters)).length;

/** Price bands that actually contain at least one product. */
export function availableBands(base: CatalogFilters = {}): PriceBand[] {
  return PRICE_BANDS.filter((band) => countProducts({ ...base, band: band.id }) > 0).map(
    (band) => band.id,
  );
}

/** Categories that actually contain at least one product under `base`. */
export function availableCategories(base: CatalogFilters = {}): Category[] {
  const order = Object.keys(CATEGORY_LABELS) as Category[];
  return order.filter((category) => countProducts({ ...base, category }) > 0);
}

/** Metals genuinely photographed on at least one product under `base`. */
export function availableMetals(base: CatalogFilters = {}): Metal[] {
  const order = Object.keys(METAL_LABELS) as Metal[];
  return order.filter((metal) => countProducts({ ...base, metal }) > 0);
}

export const bandLabel = (id: PriceBand): string => bandOf(id)?.label ?? '';

/**
 * Which single filter could be dropped to turn an empty result into a
 * non-empty one. Returns every option that genuinely helps, cheapest
 * concession first — so the UI never offers a relaxation that still dead-ends.
 */
export function relaxationOptions(
  filters: CatalogFilters,
): { filter: RelaxableFilter; matches: number }[] {
  return RELAXATION_ORDER.filter((filter) => filters[filter] !== undefined)
    .map((filter) => ({
      filter,
      matches: countProducts({ ...filters, [filter]: undefined }),
    }))
    .filter((option) => option.matches > 0);
}
