export type Metal = 'yellow' | 'rose' | 'white';

export type Category = 'rings' | 'necklaces' | 'earrings' | 'bracelets';

/**
 * A metal a piece is genuinely offered in — and can only exist when we hold a
 * REAL photograph of that piece in that metal. Never simulate a metal by
 * tinting another photo: the colour shown must be the colour photographed.
 * A product with one truthful photo gets one variant, and the selector hides
 * itself rather than offering options we cannot back.
 */
export type MetalVariant = {
  id: Metal;
  /** Base name in /products (e.g. "ring-solitaire-rose"). */
  image: string;
  /** Describes this specific photograph for screen readers. */
  imageAlt: string;
};

export type Product = {
  slug: string;
  name: string;
  shortDescription: string;
  price: number;
  category: Category;
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
