import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Metal } from '@/types/catalog';

export type CartLine = {
  /** Stable key: same product in a different metal/size is a separate line. */
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  metal: Metal;
  size?: string;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  /** Slide-in drawer open state (not persisted). */
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  add: (line: Omit<CartLine, 'id' | 'quantity'>, quantity?: number) => void;
  remove: (id: string) => void;
  setQuantity: (id: string, quantity: number) => void;
  clear: () => void;
};

/** Free-shipping threshold in ILS. Below it, delivery is charged (see SHIPPING). */
export const FREE_SHIPPING_THRESHOLD = 1000;
export const STANDARD_SHIPPING = 39;

const lineId = (slug: string, metal: Metal, size?: string) =>
  `${slug}__${metal}__${size ?? 'one-size'}`;

/**
 * Cart state, persisted to localStorage so it survives a refresh.
 * Demo only — no server, no checkout API. In production the cart would be
 * reconciled against a backend (stock, pricing) before payment.
 */
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      drawerOpen: false,
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),

      add: (line, quantity = 1) =>
        set((state) => {
          const id = lineId(line.slug, line.metal, line.size);
          const existing = state.lines.find((l) => l.id === id);
          const lines = existing
            ? state.lines.map((l) =>
                l.id === id ? { ...l, quantity: l.quantity + quantity } : l,
              )
            : [...state.lines, { ...line, id, quantity }];
          // Adding always reveals the drawer so the shopper sees confirmation.
          return { lines, drawerOpen: true };
        }),

      remove: (id) => set((state) => ({ lines: state.lines.filter((l) => l.id !== id) })),

      setQuantity: (id, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.id !== id)
              : state.lines.map((l) => (l.id === id ? { ...l, quantity } : l)),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: 'noga_cart_v1',
      // Persist only the line items — drawer state is per-session UI.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** Total item count for the header badge. */
export const useCartCount = () =>
  useCart((state) => state.lines.reduce((sum, l) => sum + l.quantity, 0));

/** Cart subtotal in ILS. */
export const useCartSubtotal = () =>
  useCart((state) => state.lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
