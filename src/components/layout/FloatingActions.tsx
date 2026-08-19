import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { ROUTES } from '@/lib/constants';
import { useHeroVisibility } from '@/lib/heroVisibility';
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
 * does NOT know about Safari's bottom toolbar. The offset is tuned to a
 * narrow window that clears the hero's H1 and CTA row on the pages/widths
 * where it fits (see the code comment on the CSS var) — but there is no
 * offset that also fits beside the Home hero at 375px, so that page hides
 * both elements outright instead. See "Hero clash" below.
 *
 * Hero clash: at narrow widths the Home hero's headline, subtext and CTA
 * row fill enough of the viewport that no bottom-offset value clears all of
 * them (measured, not assumed — see CHANGELOG.md). So on pages that
 * register a hero (currently only Home, via `useHeroInViewObserver`), both
 * elements hide while the hero is on screen and reveal once the user has
 * scrolled past it — `heroVisibility` (a tiny store, not a prop) carries
 * that state here since Home and this component are siblings under
 * RootLayout, not parent/child. Pages without a hero never touch the store,
 * so it stays `false` there and both elements show immediately.
 *
 * Hiding is opacity + `inert`, not conditional rendering: `inert` (set
 * imperatively via ref, not as a JSX prop — HTML boolean attributes passed
 * as JSX props are easy to get wrong, e.g. `inert={false}` risks rendering
 * the literal string "false", which the browser reads as present/truthy)
 * removes the group from the tab order, from the accessibility tree, and
 * from pointer/click handling the instant the hero comes into view — it is
 * not tied to the opacity transition's duration, so there is never a window
 * where a fading-out element is still clickable. Opacity is purely the
 * visual fade; the project's global reduced-motion rule (styles/index.css)
 * collapses that transition to near-zero automatically, so this component
 * does not special-case `prefers-reduced-motion` itself.
 *
 * The assistant's dialog panel is a separate `createPortal` straight to
 * `document.body` (see ShoppingAssistant.tsx) — it is not a DOM descendant
 * of this wrapper, so marking the wrapper inert while the hero is in view
 * never touches an already-open panel. That is what keeps an open panel
 * open if the user scrolls back up to the hero: nothing here targets it.
 */
export function FloatingActions() {
  const { pathname } = useLocation();
  const heroInView = useHeroVisibility((state) => state.heroInView);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    wrapperRef.current?.toggleAttribute('inert', heroInView);
  }, [heroInView]);

  if (pathname === ROUTES.checkout) return null;

  return (
    <div
      ref={wrapperRef}
      aria-hidden={heroInView}
      className={`fixed end-5 z-30 flex flex-col items-end gap-3 transition-opacity duration-200 ease-out ${
        heroInView ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ bottom: 'var(--floating-actions-offset)' }}
    >
      <ShoppingAssistant />
      <WhatsAppFab />
    </div>
  );
}
