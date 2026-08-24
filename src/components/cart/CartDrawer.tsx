import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useCart, useCartSubtotal } from '@/lib/cart/store';
import { ROUTES } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { SHIPPING, shippingCostText } from '@/lib/fulfillment';
import { LineItem } from './LineItem';

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

/**
 * Slide-in cart drawer (right side, RTL). Opens on cart-icon click and after
 * "הוסף לעגלה". Escape closes, focus is trapped, background scroll locked.
 */
export function CartDrawer() {
  const open = useCart((s) => s.drawerOpen);
  const close = useCart((s) => s.closeDrawer);
  const lines = useCart((s) => s.lines);
  const subtotal = useCartSubtotal();
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused.current?.focus();
    };
  }, [open, close]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="עגלת הקניות"
        tabIndex={-1}
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-xl outline-none"
      >
        <header className="flex items-center justify-between border-b border-mist px-6 py-5">
          <h2 className="text-lg">עגלת הקניות</h2>
          <button
            type="button"
            onClick={close}
            aria-label="סגירת העגלה"
            className="-me-2 rounded-full p-2 text-stone transition-colors hover:text-charcoal"
          >
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <p className="text-lg text-charcoal">העגלה ריקה</p>
            <p className="max-w-xs text-sm leading-relaxed text-stone">
              עוד לא הוספת פריטים. אפשר להתחיל מהקטלוג ולמצוא משהו שיישאר איתך.
            </p>
            <Link
              to={ROUTES.catalog}
              onClick={close}
              className="rounded-full border border-charcoal px-8 py-3 text-sm tracking-wide transition-colors hover:bg-charcoal hover:text-cream"
            >
              לצפייה בקטלוג
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {lines.map((line) => (
                <LineItem key={line.id} line={line} compact />
              ))}
            </div>

            <footer className="space-y-4 border-t border-mist px-6 py-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone">סכום ביניים</span>
                <span className="text-charcoal">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone">משלוח עד הבית</span>
                <span className="text-charcoal">{shippingCostText(SHIPPING.home)}</span>
              </div>
              <Link
                to={ROUTES.checkout}
                onClick={close}
                className="block rounded-full bg-charcoal px-8 py-4 text-center text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90"
              >
                המשך לתשלום
              </Link>
              <button
                type="button"
                onClick={close}
                className="block w-full text-center text-sm text-stone underline-offset-4 transition-colors hover:text-charcoal hover:underline"
              >
                המשך בקנייה
              </button>
            </footer>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
