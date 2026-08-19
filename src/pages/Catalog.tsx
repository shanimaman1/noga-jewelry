import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Category, Metal } from '@/types/catalog';
import { products } from '@/data/products';
import { Container } from '@/components/common/Container';
import { Reveal } from '@/components/common/Reveal';
import { ProductCard } from '@/components/catalog/ProductCard';
import { FilterBar, PRICE_BANDS, type PriceBand } from '@/components/catalog/FilterBar';
import { Seo } from '@/components/seo/Seo';

const CATEGORIES: Category[] = ['rings', 'necklaces', 'earrings', 'bracelets'];
const METALS: Metal[] = ['yellow', 'rose', 'white'];

/** Catalog with client-side filters synced to the URL (so gift-guide + collection
 *  links deep-link into a filtered view). */
type SortKey = 'featured' | 'price-asc' | 'price-desc';

const SORT_LABELS: Record<SortKey, string> = {
  featured: 'מומלצים',
  'price-asc': 'מחיר: מהנמוך לגבוה',
  'price-desc': 'מחיר: מהגבוה לנמוך',
};

export function Catalog() {
  const [params, setParams] = useSearchParams();

  // Read filters from the URL (single source of truth), validating values.
  const rawCategory = params.get('category');
  const category = (CATEGORIES as string[]).includes(rawCategory ?? '')
    ? (rawCategory as Category)
    : 'all';
  const rawMetal = params.get('metal');
  const metal = (METALS as string[]).includes(rawMetal ?? '') ? (rawMetal as Metal) : 'all';

  // Price: gift links pass raw min/max; the filter UI passes a band id.
  const rawPrice = params.get('price');
  const priceBand: PriceBand | 'all' = PRICE_BANDS.some((b) => b.id === rawPrice)
    ? (rawPrice as PriceBand)
    : 'all';
  const urlMin = Number(params.get('min')) || undefined;
  const urlMax = Number(params.get('max')) || undefined;

  const rawSort = params.get('sort');
  const sort: SortKey = (['featured', 'price-asc', 'price-desc'] as string[]).includes(rawSort ?? '')
    ? (rawSort as SortKey)
    : 'featured';

  const setFilter = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === 'all') next.delete(k);
      else next.set(k, v);
    }
    // Choosing a band from the UI supersedes any raw min/max from a deep link.
    if ('price' in patch) {
      next.delete('min');
      next.delete('max');
    }
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const band = PRICE_BANDS.find((b) => b.id === priceBand);
    const min = band?.min ?? urlMin;
    const max = band?.max ?? urlMax;
    const list = products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (metal !== 'all' && !p.metals.some((m) => m.id === metal)) return false;
      if (min !== undefined && p.price < min) return false;
      if (max !== undefined && p.price > max) return false;
      return true;
    });
    if (sort === 'price-asc') return [...list].sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') return [...list].sort((a, b) => b.price - a.price);
    // "featured" keeps the curated order in products.ts, featured items first.
    return [...list].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [category, metal, priceBand, urlMin, urlMax, sort]);

  // A gift deep-link with raw min/max should light up the matching band chip.
  const activeBand: PriceBand | 'all' =
    priceBand !== 'all'
      ? priceBand
      : (PRICE_BANDS.find((b) => b.min === urlMin && b.max === urlMax)?.id ?? 'all');

  return (
    <div className="py-12 sm:py-16">
      <Seo
        title="קטלוג התכשיטים"
        description="כל התכשיטים של נוגה, טבעות, שרשראות, עגילים וצמידים בזהב מלא. סינון לפי קטגוריה, מתכת וטווח מחיר."
        path="/catalog"
      />
      <Container>
        <p className="text-xs tracking-luxury text-gold">הקולקציה</p>
        <h1 className="mt-3 text-3xl sm:text-4xl">קטלוג</h1>
        <p className="mt-4 max-w-xl leading-relaxed text-stone">
          כל הפריטים במקום אחד. אפשר לסנן לפי קטגוריה, מתכת וטווח מחיר.
        </p>

        <div className="mt-10">
          <FilterBar
            filters={{ category, price: activeBand, metal }}
            onChange={(patch) => {
              const mapped: Record<string, string | undefined> = {};
              if ('category' in patch) mapped.category = patch.category;
              if ('metal' in patch) mapped.metal = patch.metal;
              if ('price' in patch) mapped.price = patch.price;
              setFilter(mapped);
            }}
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-t border-mist pt-5">
          <p className="text-sm text-stone" aria-live="polite">
            {filtered.length} פריטים
          </p>
          <label className="flex items-center gap-2 text-sm text-stone">
            מיון
            <select
              value={sort}
              onChange={(e) => setFilter({ sort: e.target.value })}
              className="rounded-md border border-mist bg-transparent px-3 py-1.5 text-charcoal focus:border-gold focus:outline-none"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filtered.length > 0 ? (
          <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product, i) => (
              <li key={product.slug}>
                <Reveal delay={Math.min(i, 6) * 0.05}>
                  <ProductCard product={product} />
                </Reveal>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-16 rounded-sm border border-mist py-16 text-center">
            <p className="text-lg text-charcoal">לא נמצאו פריטים בסינון הזה</p>
            <p className="mt-2 text-sm text-stone">אפשר לשחרר חלק מהפילטרים ולנסות שוב.</p>
            <button
              type="button"
              onClick={() => setParams(new URLSearchParams(), { replace: true })}
              className="mt-6 rounded-full border border-charcoal px-8 py-3 text-sm tracking-wide transition-colors hover:bg-charcoal hover:text-cream"
            >
              ניקוי הסינון
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}
