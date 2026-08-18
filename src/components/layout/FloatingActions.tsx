import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { ShoppingAssistant } from '@/components/agent/ShoppingAssistant';
import { WhatsAppFab } from './WhatsAppFab';

/**
 * Single mount point for the two bottom-anchored floating actions (shopping
 * assistant launcher + WhatsApp FAB). Grouping them here — rather than
 * mounting each independently in RootLayout — keeps the two things they must
 * always agree on defined in exactly one place instead of drifting across
 * two files: which routes hide them, and which edge of the screen they
 * stack on.
 *
 * Checkout hide: a checkout page must contain nothing but the form, so
 * neither renders there. This is the single route check for both — do not
 * duplicate it inside WhatsAppFab or ShoppingAssistant. (WhatsAppFab keeps
 * its own, unrelated check that hides it on product pages, which have their
 * own inline WhatsApp button — that rule only ever applied to the FAB.)
 *
 * Same-side stacking: both anchor to the inline-end edge (visually the left
 * in this RTL site) as a column, `items-end` so a narrower child (the round
 * WhatsApp icon) sits flush with the wider one (the launcher pill) rather
 * than centered with a ragged gap. Previously they sat at opposite corners,
 * so together they spanned the full viewport width and were guaranteed to
 * collide with any full-width content row.
 *
 * Bottom offset: `--floating-actions-offset` (defined in styles/index.css)
 * combines `env(safe-area-inset-bottom)` with a fixed buffer. That env()
 * value only covers the hardware safe area (notch / home indicator) — it
 * does NOT know about Safari's bottom toolbar, which has no CSS-visible
 * signal, so the buffer is sized generously to clear it too. Set once here
 * as an inline style (a CSS var, not a JS viewport read) so both elements
 * share the exact same clearance.
 */
export function FloatingActions() {
  const { pathname } = useLocation();
  if (pathname === ROUTES.checkout) return null;

  return (
    <div
      className="fixed end-5 z-30 flex flex-col items-end gap-3"
      style={{ bottom: 'var(--floating-actions-offset)' }}
    >
      <ShoppingAssistant />
      <WhatsAppFab />
    </div>
  );
}
