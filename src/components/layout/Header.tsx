import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BRAND, NAV_LINKS, ROUTES } from '@/lib/constants';
import { useCart, useCartCount } from '@/lib/cart/store';

/**
 * Site header. Calm and minimal. On mobile the nav collapses into a
 * toggleable panel. (Transparent-over-hero treatment is added in Phase 1b.)
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cartCount = useCartCount();
  const openDrawer = useCart((s) => s.openDrawer);

  return (
    <header className="sticky top-0 z-40 border-b border-mist/70 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
        {/* Brand wordmark */}
        <Link
          to={ROUTES.home}
          className="font-heading text-2xl font-normal tracking-luxury text-charcoal"
          aria-label={`${BRAND.nameHe} - לדף הבית`}
        >
          {BRAND.nameHe}
        </Link>

        {/* Desktop nav */}
        <nav aria-label="ניווט ראשי" className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `text-sm tracking-wide transition-colors hover:text-gold ${
                  isActive ? 'text-gold' : 'text-charcoal/80'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openDrawer}
            aria-label={
              cartCount > 0 ? `עגלת הקניות, ${cartCount} פריטים` : 'עגלת הקניות, ריקה'
            }
            className="relative rounded-full p-2 text-charcoal transition-colors hover:text-gold"
          >
            <CartIcon />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] leading-none text-charcoal"
              >
                {cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            className="rounded-full p-2 text-charcoal transition-colors hover:text-gold md:hidden"
            aria-label={menuOpen ? 'סגירת התפריט' : 'פתיחת התפריט'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {menuOpen && (
        <nav
          aria-label="ניווט נייד"
          className="border-t border-mist/70 bg-cream md:hidden"
        >
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-2 sm:px-8">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-sm tracking-wide text-charcoal/90 hover:text-gold"
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 8h12l-1 11a2 2 0 0 1-2 1.8H9A2 2 0 0 1 7 19L6 8Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M9 8a3 3 0 0 1 6 0"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      )}
    </svg>
  );
}
