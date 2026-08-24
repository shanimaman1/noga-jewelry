export type Metal = 'yellow' | 'rose' | 'white';

export type Category = 'rings' | 'necklaces' | 'earrings' | 'bracelets';

export type Availability = 'ready' | 'made-to-order' | 'out-of-stock';

export type GoldKarat = 14 | 18;

export type StoneDetails =
  | { kind: 'none' }
  | {
      kind: 'pearl';
      source: 'freshwater-cultured';
      quantity: 1;
      diameterMm: number;
    }
  | {
      kind: 'diamonds';
      origin: 'natural' | 'lab-grown';
      totalCarat: number;
      arrangement: 'single' | 'multiple';
      cut?: 'round' | 'baguette';
      color?: string;
      clarity?: string;
      setComposition?: {
        diamondSetPieces: number;
        plainPieces: number;
      };
    };

/**
 * A metal a piece is genuinely offered in. Every variant must have a truthful,
 * visually verified image for that exact design and metal: either a licensed
 * real photograph or an explicitly approved AI asset for this fictional demo.
 * Never simulate a metal by tinting another image. A product with one truthful
 * image gets one variant, and the selector hides itself rather than offering
 * options we cannot back.
 */
export type MetalVariant = {
  id: Metal;
  /** Base name in /products (e.g. "ring-solitaire-rose"). */
  image: string;
  /** Describes this specific photograph for screen readers. */
  imageAlt: string;
};

type ProductBase = {
  slug: string;
  /** Shopper-facing catalogue number, unique across the catalogue. */
  sku: string;
  name: string;
  shortDescription: string;
  price: number;
  category: Category;
  /** Real catalogue availability used by every shopping surface. */
  availability: Availability;
  /** Explicit material disclosure; there is deliberately no catalogue fallback. */
  stones: StoneDetails;
  /** Approximate net gold weight, excluding stones, in grams. */
  goldWeightGrams: number;
  /** Ordered; the first is the default view. At least one. */
  metals: MetalVariant[];
  /** Marks the piece for the "featured" row on the homepage. */
  featured?: boolean;
  /** Optional badge copy, e.g. "חדש" — used sparingly. */
  badge?: string;
  /** True only for the product the ring.glb model genuinely depicts, enabling
   *  the live 360° drag-to-rotate viewer. Never set this on a product whose
   *  real shape differs from the model. */
  has3D?: boolean;
};

export type Product = ProductBase &
  (
    | {
        /** This design has an explicitly priced 18-karat special-order variant. */
        availableIn18K: true;
        price18K: number;
      }
    | {
        /** This design stays in 14-karat gold for the stated construction reason. */
        availableIn18K: false;
        price18K?: never;
        eighteenKExclusionReason: string;
      }
  );

export type Collection = {
  slug: string;
  name: string;
  description: string;
  category: Category | 'custom';
  image: string;
  imageAlt: string;
};

export type Testimonial = {
  id: string;
  quote: string;
  name: string;
  context: string;
};

export const METAL_LABELS: Record<Metal, string> = {
  yellow: 'זהב צהוב',
  rose: 'זהב אדום',
  white: 'זהב לבן',
};
