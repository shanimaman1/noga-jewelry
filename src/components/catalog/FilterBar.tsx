import type { Category, Metal } from '@/types/catalog';
import { METAL_LABELS } from '@/types/catalog';

export type PriceBand = 'under1500' | 'mid' | 'over3000';

export const CATEGORY_LABELS: Record<Category, string> = {
  rings: 'טבעות',
  necklaces: 'שרשראות',
  earrings: 'עגילים',
  bracelets: 'צמידים',
};

export const PRICE_BANDS: { id: PriceBand; label: string; min?: number; max?: number }[] = [
  { id: 'under1500', label: 'עד ₪1,500', max: 1500 },
  { id: 'mid', label: '₪1,500–3,000', min: 1500, max: 3000 },
  { id: 'over3000', label: 'מעל ₪3,000', min: 3000 },
];

type Filters = {
  category: Category | 'all';
  price: PriceBand | 'all';
  metal: Metal | 'all';
};

const chip = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm transition-colors ${
    active ? 'border-gold text-charcoal' : 'border-mist text-stone hover:border-stone'
  }`;

/** Catalog filters — category, price band, metal. Purely client-side. */
export function FilterBar({
  filters,
  onChange,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
}) {
  return (
    <div className="space-y-5">
      <FilterRow label="קטגוריה">
        <button type="button" onClick={() => onChange({ category: 'all' })} className={chip(filters.category === 'all')}>
          הכול
        </button>
        {(Object.keys(CATEGORY_LABELS) as Category[]).map((c) => (
          <button key={c} type="button" onClick={() => onChange({ category: c })} className={chip(filters.category === c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </FilterRow>

      <FilterRow label="מחיר">
        <button type="button" onClick={() => onChange({ price: 'all' })} className={chip(filters.price === 'all')}>
          הכול
        </button>
        {PRICE_BANDS.map((b) => (
          <button key={b.id} type="button" onClick={() => onChange({ price: b.id })} className={chip(filters.price === b.id)}>
            {b.label}
          </button>
        ))}
      </FilterRow>

      <FilterRow label="מתכת">
        <button type="button" onClick={() => onChange({ metal: 'all' })} className={chip(filters.metal === 'all')}>
          הכול
        </button>
        {(['yellow', 'rose', 'white'] as Metal[]).map((m) => (
          <button key={m} type="button" onClick={() => onChange({ metal: m })} className={chip(filters.metal === m)}>
            {METAL_LABELS[m]}
          </button>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="me-1 text-xs tracking-luxury text-stone">{label}</span>
      {children}
    </div>
  );
}
