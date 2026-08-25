import { Link } from 'react-router-dom';
import { useCart, useCartSubtotal } from '@/lib/cart/store';
import { ROUTES } from '@/lib/constants';
import { formatPrice } from '@/lib/format';
import { DELIVERY_TIMES, SHIPPING, shippingCostText } from '@/lib/fulfillment';
import { Container } from '@/components/common/Container';
import { LineItem } from '@/components/cart/LineItem';
import { Seo } from '@/components/seo/Seo';

const cartSeo = (
  <Seo title="עגלת הקניות" description="הפריטים שבחרת." path="/cart" />
);

/** Full-page cart — for direct navigation; the drawer is the primary surface. */
export function Cart() {
  const lines = useCart((s) => s.lines);
  const subtotal = useCartSubtotal();

  if (lines.length === 0) {
    return (
      <div className="py-24 sm:py-32">
        {cartSeo}
        <Container className="text-center">
          <h1 className="text-3xl sm:text-4xl">העגלה ריקה</h1>
          <p className="mx-auto mt-4 max-w-md leading-relaxed text-stone">
            עוד לא הוספת פריטים. אפשר להתחיל מהקטלוג ולמצוא משהו שיישאר איתך.
          </p>
          <Link
            to={ROUTES.catalog}
            className="mt-8 inline-block rounded-full border border-charcoal px-8 py-3 text-sm tracking-wide transition-colors hover:bg-charcoal hover:text-cream"
          >
            לצפייה בקטלוג
          </Link>
        </Container>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16">
      {cartSeo}
      <Container>
        <h1 className="text-3xl sm:text-4xl">עגלת הקניות</h1>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-8">
            {lines.map((line) => (
              <li key={line.id} className="border-b border-mist pb-8 last:border-0">
                <LineItem line={line} />
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="rounded-sm border border-mist p-6">
              <h2 className="text-lg">סיכום</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-stone">סכום ביניים</dt>
                  <dd className="text-charcoal">{formatPrice(subtotal)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-stone">משלוח עד הבית</dt>
                  <dd className="text-charcoal">{shippingCostText(SHIPPING.home)}</dd>
                </div>
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-stone">איסוף מהסטודיו</dt>
                  <dd className="text-end text-charcoal">
                    לבחירה בצ׳קאאוט · {shippingCostText(SHIPPING.collection)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs leading-relaxed text-stone">
                מועד האיסוף: {DELIVERY_TIMES.collection}.
              </p>
              <Link
                to={ROUTES.checkout}
                className="mt-6 block rounded-full bg-charcoal px-8 py-4 text-center text-sm tracking-wide text-cream transition-colors hover:bg-charcoal/90"
              >
                המשך לתשלום
              </Link>
              <Link
                to={ROUTES.catalog}
                className="mt-3 block text-center text-sm text-stone underline-offset-4 transition-colors hover:text-charcoal hover:underline"
              >
                המשך בקנייה
              </Link>
            </div>
          </aside>
        </div>
      </Container>
    </div>
  );
}
