import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { RootLayout } from '@/components/layout/RootLayout';
import { Home } from '@/pages/Home';
import { Catalog } from '@/pages/Catalog';
import { GiftGuide } from '@/pages/GiftGuide';
import { Product } from '@/pages/Product';
import { CustomDesign } from '@/pages/CustomDesign';
import { Story } from '@/pages/Story';
import { Visit } from '@/pages/Visit';
import { SizeCare } from '@/pages/SizeCare';
import { ReturnsService } from '@/pages/ReturnsService';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { OrderConfirmation } from '@/pages/OrderConfirmation';
import { Accessibility } from '@/pages/Accessibility';
import { NotFound } from '@/pages/NotFound';

// Lab is code-split: leva (Phase 1a) must never enter the main bundle.
const Lab = lazy(() => import('@/pages/Lab'));
// Styleguide is code-split: the comparison-only serif fonts stay out of main.
const Styleguide = lazy(() => import('@/pages/Styleguide'));

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/catalog', element: <Catalog /> },
      { path: '/gift-guide', element: <GiftGuide /> },
      { path: '/product/:slug', element: <Product /> },
      { path: '/custom', element: <CustomDesign /> },
      { path: '/story', element: <Story /> },
      { path: '/visit', element: <Visit /> },
      { path: '/size-care', element: <SizeCare /> },
      { path: '/returns-service', element: <ReturnsService /> },
      { path: '/cart', element: <Cart /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/order-confirmation', element: <OrderConfirmation /> },
      { path: '/accessibility', element: <Accessibility /> },
      {
        path: '/styleguide',
        element: (
          <Suspense fallback={null}>
            <Styleguide />
          </Suspense>
        ),
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    // /lab lives OUTSIDE the RootLayout on purpose: full-screen canvas on
    // charcoal, nothing else on the page (no header/footer/banner).
    path: '/lab',
    element: (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#0A0908' }} />}>
        <Lab />
      </Suspense>
    ),
  },
]);
