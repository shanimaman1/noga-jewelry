import { Outlet } from 'react-router-dom';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { useLenis } from '@/hooks/useLenis';
import { DemoModeBanner } from '@/components/common/DemoModeBanner';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { FloatingActions } from './FloatingActions';
import { Header } from './Header';
import { Footer } from './Footer';
import { ScrollToTop } from './ScrollToTop';
import { localBusinessJsonLd } from '@/lib/seo';

/** App shell: smooth scroll, demo banner, header, page outlet, footer,
 *  floating actions (shopping assistant + WhatsApp FAB), cart drawer. */
export function RootLayout() {
  const reduced = useReducedMotion();
  useLenis(!reduced); // native scrolling when the user prefers reduced motion

  return (
    <>
      {/* Site-wide LocalBusiness structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-2 focus:text-cream"
      >
        דלג לתוכן הראשי
      </a>

      <ScrollToTop />
      <DemoModeBanner />
      <Header />

      <main id="main">
        <Outlet />
      </main>

      <Footer />
      <FloatingActions />
      <CartDrawer />
    </>
  );
}
